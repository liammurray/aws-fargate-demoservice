import * as cdk from '@aws-cdk/core'
import * as ecr from '@aws-cdk/aws-ecr'
import { Duration } from '@aws-cdk/core'
import * as CodeBuild from '@aws-cdk/aws-codebuild'
//import * as CodePipeline from '@aws-cdk/aws-codepipeline'
//import * as CodePipelineActions from '@aws-cdk/aws-codepipeline-actions'
import * as ssm from '@aws-cdk/aws-ssm'
import * as iam from '@aws-cdk/aws-iam'

export interface BuildStackProps extends cdk.StackProps {
  readonly user: string
  readonly repo: string
  readonly branch: string
  readonly npmtoken: string
}

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
    const repo = this.addRepo('demoservice')

    // const repo = ssm.StringParameter.valueForStringParameter(this, this.props.repo)
    const owner = ssm.StringParameter.valueForStringParameter(this, this.props.user)

    // Note: github token is created in account for CodeBuild (created in another global stack for account)

    // Trigger when push to branch occurs
    const source = CodeBuild.Source.gitHub({
      owner,
      repo: 'aws-fargate-demoservice',
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

    repo.grantPullPush(buildProject)

    const ssmPath = `arn:aws:ssm:${this.region}:${this.account}:parameter/cicd/demoservice/*`

    // Allow build to read SSM parameter
    buildProject.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['ssm:GetParameters'],
        resources: [ssmPath],
      })
    )

    // const pipeline = new codepipeline.Pipeline(this, 'MyPipeline')
    // const sourceOutput = new codepipeline.Artifact()
    // const sourceAction = new codepipeline_actions.EcrSourceAction({
    //   actionName: 'ECR',
    //   repository: ecrRepository,
    //   imageTag: 'some-tag', // optional, default: 'latest'
    //   output: sourceOutput,
    // })
    // pipeline.addStage({
    //   stageName: 'Source',
    //   actions: [sourceAction],
    // })
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
