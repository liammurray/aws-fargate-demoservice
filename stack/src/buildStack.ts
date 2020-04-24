import * as cdk from '@aws-cdk/core'
import * as ecr from '@aws-cdk/aws-ecr'
import { Duration } from '@aws-cdk/core'
import * as CodeBuild from '@aws-cdk/aws-codebuild'
import * as CodePipeline from '@aws-cdk/aws-codepipeline'
import * as CodePipelineActions from '@aws-cdk/aws-codepipeline-actions'
import * as ssm from '@aws-cdk/aws-ssm'
import * as iam from '@aws-cdk/aws-iam'

export interface BuildStackProps extends cdk.StackProps {
  readonly user: string
  readonly repo: string
  readonly branch: string
  readonly npmtoken: string
}

const ssmVal = ssm.StringParameter.valueForStringParameter

/**
 *
 * ECR Repo for demoservice image
 * Codebuild to build and push image
 * Pipeline to deploy
 *
 * See github actions: https://aws.amazon.com/blogs/containers/create-a-ci-cd-pipeline-for-amazon-ecs-with-github-actions-and-aws-codebuild-tests/
 */
export default class BuildStack extends cdk.Stack {
  readonly props: BuildStackProps

  constructor(scope: cdk.Construct, id: string, props: BuildStackProps) {
    super(scope, id, props)

    this.props = props
    this.addCodeBuild()
  }

  private addCodeBuild(): void {
    const imageRepo = this.addRepo('demoservice')

    const srcRepo = ssmVal(this, this.props.repo)
    const owner = ssmVal(this, this.props.user)

    // Note: github token is created in account for CodeBuild (created in another global stack for account)

    // Trigger when push to branch occurs
    const source = CodeBuild.Source.gitHub({
      owner,
      repo: srcRepo,
      cloneDepth: 1,
      reportBuildStatus: true,
      webhook: true,
      webhookFilters: [
        CodeBuild.FilterGroup.inEventOf(CodeBuild.EventAction.PUSH)
          .andBranchIs(this.props.branch)
          .andFilePathIs('service/.*'),
      ],
    })

    const buildProject = new CodeBuild.Project(this, 'DemoService', {
      projectName: 'DemoServiceMaster',
      description: 'Builds DemoService image and pushes to ECR',
      source,
      environment: {
        buildImage: CodeBuild.LinuxBuildImage.STANDARD_4_0,
        computeType: CodeBuild.ComputeType.SMALL,
        // Needed to run docker build
        privileged: true,
      },
      badge: true,
      environmentVariables: {
        NPM_TOKEN_PARAM_KEY: {
          // pass path to secure ssm
          type: CodeBuild.BuildEnvironmentVariableType.PLAINTEXT,
          value: this.props.npmtoken,
        },
        IMAGE_NAME: {
          value: 'demoservice',
        },
        IMAGE_TAG: {
          value: 'latest',
        },
        IMAGE_REPO: {
          value: `${this.account}.dkr.ecr.${this.region}.amazonaws.com`,
        },
      },
      buildSpec: CodeBuild.BuildSpec.fromSourceFilename('buildspec.yml'),
    })

    buildProject.role?.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryReadOnly')
    )

    imageRepo.grantPullPush(buildProject)

    const ssmPath = `arn:aws:ssm:${this.region}:${this.account}:parameter/cicd/demoservice/*`

    // Allow build to read SSM parameter
    buildProject.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['ssm:GetParameters'],
        resources: [ssmPath],
      })
    )

    this.addPipeline(imageRepo)
  }

  private addPipeline(imageRepo: ecr.Repository): CodePipeline.Pipeline {
    const pipeline = new CodePipeline.Pipeline(this, 'DemoservicePipeline', {
      pipelineName: 'DemoServiceMaster',
      restartExecutionOnUpdate: true,
    })

    // TODO Add cloudtrail to capture ECR to make this trigger

    const ecrSourceOutput = new CodePipeline.Artifact('ecr')
    const ecrSourceAction = new CodePipelineActions.EcrSourceAction({
      actionName: 'ECR',
      repository: imageRepo,
      imageTag: 'latest',
      output: ecrSourceOutput,
    })

    // TODO
    //   1) Add stack source action
    //   2) Add extraInputs to build
    //   3) Update buildDeployDevStackProject to cd to CODEBUILD_SRC_DIR_stack
    //   4) Add changeset and execute

    // Need this source to run CDK synth
    //
    // const stackSourceOutput = new CodePipeline.Artifact('stack')
    // const stackSourceAction = new CodePipelineActions.GitHubSourceAction({
    //   actionName: 'Stack',
    //   owner: owner,
    //   repo: props.repoTools,
    //   oauthToken,
    //   output: outputTools,
    //   branch: 'master',
    //   trigger: CodePipelineActions.GitHubTrigger.NONE,
    // })

    // Where cdk synth output goes
    const outputSynth = new CodePipeline.Artifact('synthOutput')

    // Trigger from ECR push (for latest)
    //
    pipeline.addStage({
      stageName: 'Source',
      //actions: [ecrSourceAction, stackSourceAction],
      actions: [ecrSourceAction],
    })

    // Run cdk synth command to generate cfn template(s) to deploy
    //
    const buildDeployDevStackProject = new CodeBuild.PipelineProject(this, 'CdkBuildProject', {
      projectName: 'DemoServiceMasterCdkSynth',
      description: 'Runs CDK commands to generate cfn templates for deploy',
      environment: {
        buildImage: CodeBuild.LinuxBuildImage.STANDARD_4_0,
      },
      buildSpec: CodeBuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            commands: ['echo $IMAGE_URI', 'cd stack', 'npm ci'],
          },
          build: {
            commands: ['npm run build', 'npm run cdk synth demoservice-dev -- -o .'],
          },
        },
        artifacts: {
          'base-directory': 'cdk.out',
          files: 'demoservice-service.template.json',
        },
      }),
    })

    const actionBuild = new CodePipelineActions.CodeBuildAction({
      actionName: 'CdkDeployTemplateBuild',
      environmentVariables: {
        IMAGE_URI: {
          value: ecrSourceAction.variables.imageUri,
        },
      },
      project: buildDeployDevStackProject,
      input: ecrSourceOutput,
      // extraInputs: [
      //   // CODEBUILD_SRC_DIR_stack
      //   stackSourceOutput,
      // ],
      outputs: [outputSynth],
    })

    pipeline.addStage({
      stageName: 'Build',
      actions: [actionBuild],
    })
    return pipeline
  }

  private addRepo(repositoryName: string): ecr.Repository {
    const repository = new ecr.Repository(this, repositoryName, {
      repositoryName,
    })

    const expireRule: ecr.LifecycleRule = {
      description: 'Expire untagged images after 10 days',
      tagStatus: ecr.TagStatus.UNTAGGED,
      maxImageAge: Duration.days(10),
    }
    const maxCountRule: ecr.LifecycleRule = {
      description: 'Max 10 tagged images',
      tagStatus: ecr.TagStatus.ANY,
      maxImageCount: 10,
    }
    repository.addLifecycleRule(expireRule)
    repository.addLifecycleRule(maxCountRule)

    return repository
  }
}
