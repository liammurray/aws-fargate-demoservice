import * as cdk from '@aws-cdk/core'
import * as ecr from '@aws-cdk/aws-ecr'
import { Duration } from '@aws-cdk/core'
import * as CodeBuild from '@aws-cdk/aws-codebuild'
import * as CodePipeline from '@aws-cdk/aws-codepipeline'
import * as cloudformation from '@aws-cdk/aws-cloudformation'
import * as CodePipelineActions from '@aws-cdk/aws-codepipeline-actions'
import * as ssm from '@aws-cdk/aws-ssm'
import * as iam from '@aws-cdk/aws-iam'

const ssmVal = ssm.StringParameter.valueForStringParameter

export interface BuildStackProps extends cdk.StackProps {
  readonly user: string
  readonly repo: string
  readonly branch: string
  readonly npmtoken: string
  readonly codebuildSecret: string
  readonly stackNameDev: string
  readonly stackNameLive: string
}

/**
 *
 * This stack deploys:
 *
 *  1) Codebuild project triggered by github webhook (matching ./service) that
 *     builds and pushes image to ECR.
 *
 *  2) CodePipeline to deploy image from ECR.
 *
 * Step (2) is manual unless you enable cloudtrail to respond to ECR push
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

    // For github source
    const oauthToken = cdk.SecretValue.secretsManager(this.props.codebuildSecret)

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
      projectName: 'DemoServiceMasterBuildImage',
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

    this.giveSsmParamAccess(buildProject)

    this.addDeployPipeline(imageRepo, srcRepo, owner, oauthToken)
  }

  /**
   * Adds deployment pipepline
   */
  private addDeployPipeline(
    imageRepo: ecr.Repository,
    repo: string,
    owner: string,
    oauthToken: cdk.SecretValue
  ): CodePipeline.Pipeline {
    const pipeline = new CodePipeline.Pipeline(this, 'DeployPipeline', {
      pipelineName: `DemoServiceMaster`,
      restartExecutionOnUpdate: true,
    })

    // ECR image
    const ecrSourceOutput = new CodePipeline.Artifact('ecr')
    const ecrSourceAction = new CodePipelineActions.EcrSourceAction({
      actionName: 'ECR',
      repository: imageRepo,
      imageTag: 'latest',
      output: ecrSourceOutput,
    })

    // GitHub (no webhook)
    // For CDK synth (CODEBUILD_SRC_DIR_src)
    const srcOutput = new CodePipeline.Artifact('src')
    const gitHubSourceAction = new CodePipelineActions.GitHubSourceAction({
      actionName: 'Code',
      owner,
      repo,
      oauthToken,
      output: srcOutput,
      trigger: CodePipelineActions.GitHubTrigger.NONE,
      branch: this.props.branch,
    })

    // Where cdk synth output goes
    const outputSynth = new CodePipeline.Artifact('synthOutput')

    // Trigger from ECR push (for latest)
    //
    pipeline.addStage({
      stageName: 'Source',
      actions: [ecrSourceAction, gitHubSourceAction],
    })

    // See main.ts
    const deployTemplate = 'demoservice-dev.template.json'

    // Run cdk synth command to generate cfn template(s) to deploy
    //
    const buildDeployDevStackProject = new CodeBuild.PipelineProject(this, 'CdkBuildProject', {
      projectName: 'DemoServiceMasterCdkSynth',
      description: 'Runs CDK commands to generate deploy template',
      environment: {
        buildImage: CodeBuild.LinuxBuildImage.STANDARD_4_0,
      },
      buildSpec: CodeBuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            commands: ['echo $IMAGE_URI', 'cd $CODEBUILD_SRC_DIR_src/stack', 'npm ci'],
          },
          build: {
            commands: ['npm run build', 'npm run cdk synth demoservice-dev'],
          },
        },
        artifacts: {
          'base-directory': '$CODEBUILD_SRC_DIR_src/stack/cdk.out',
          files: deployTemplate,
        },
      }),
    })

    this.giveSsmParamAccess(buildDeployDevStackProject)

    const actionBuild = new CodePipelineActions.CodeBuildAction({
      actionName: 'CdkDeployTemplateBuild',
      environmentVariables: {
        IMAGE_URI: {
          value: ecrSourceAction.variables.imageUri,
        },
        // Not needed for CDK synth unless we install nod15c pacakages
        NPM_TOKEN_PARAM_KEY: {
          type: CodeBuild.BuildEnvironmentVariableType.PLAINTEXT,
          value: this.props.npmtoken,
        },
      },
      project: buildDeployDevStackProject,
      input: ecrSourceOutput,
      extraInputs: [srcOutput],
      outputs: [outputSynth],
    })

    pipeline.addStage({
      stageName: 'Build',
      actions: [actionBuild],
    })

    this.addStageDeployDev(pipeline, outputSynth, deployTemplate)
    return pipeline
  }

  private addStageDeployDev(
    pipeline: CodePipeline.Pipeline,
    buildArtifact: CodePipeline.Artifact,
    deployTemplate: string
  ): void {
    const changeSetName = 'DemoServiceDeployDevChangeSet'

    const capabilities = [
      cloudformation.CloudFormationCapabilities.AUTO_EXPAND,
      cloudformation.CloudFormationCapabilities.NAMED_IAM,
    ]

    const changes = new CodePipelineActions.CloudFormationCreateReplaceChangeSetAction({
      actionName: 'PrepareChanges',
      stackName: this.props.stackNameDev,
      changeSetName,
      capabilities,
      adminPermissions: true,
      templatePath: buildArtifact.atPath(deployTemplate),
      runOrder: 1,
    })

    const approve = new CodePipelineActions.ManualApprovalAction({
      actionName: 'ApproveChanges',
      additionalInformation: 'Approving deploys (or updates) dev ECS cluster',
      runOrder: 2,
    })

    const execute = new CodePipelineActions.CloudFormationExecuteChangeSetAction({
      actionName: 'ExecuteChanges',
      stackName: this.props.stackNameDev,
      changeSetName,
      runOrder: 3,
    })

    pipeline.addStage({
      stageName: 'DeployDev',
      actions: [changes, approve, execute],
    })
  }

  private addRepo(repositoryName: string): ecr.Repository {
    const repository = new ecr.Repository(this, repositoryName, {
      repositoryName,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
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

  private giveSsmParamAccess(project: CodeBuild.Project): void {
    const ssmResources = ['demoservice', 'common'].map(
      p => `arn:aws:ssm:${this.region}:${this.account}:parameter/cicd/${p}/*`
    )
    project.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'ssm:GetParameters',
          'ssm:GetParameter',
          'ssm:DescribeParamters',
          'ssm:GetParameterHistory',
        ],
        resources: ssmResources,
      })
    )
  }
}
