import * as cdk from '@aws-cdk/core'
import * as ec2 from '@aws-cdk/aws-ec2'
import * as ecs from '@aws-cdk/aws-ecs'
import * as ecr from '@aws-cdk/aws-ecr'
import * as EcsPatterns from '@aws-cdk/aws-ecs-patterns'
import * as certman from '@aws-cdk/aws-certificatemanager'
import * as elbv2 from '@aws-cdk/aws-elasticloadbalancingv2'
import * as route53 from '@aws-cdk/aws-route53'
import * as iam from '@aws-cdk/aws-iam'
import { Fn } from '@aws-cdk/core'
import * as logs from '@aws-cdk/aws-logs'

/**
 * Fargate service
 */
export interface FargateServiceStackProps extends cdk.StackProps {
  readonly certId: string
  readonly dnsName: string
  readonly domainApex: string
  readonly serviceName: string
}

/**
 * ECS Fargate service running demoservice in its own VPC
 */
export default class FargateServiceStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: FargateServiceStackProps) {
    super(scope, id, props)

    // Lookups (we could pass from other stack too)
    const logGroup = logs.LogGroup.fromLogGroupArn(
      this,
      'LogGroup',
      Fn.importValue('ServicesLogGroupArn')
    )
    const repository = ecr.Repository.fromRepositoryName(this, 'repo', props.serviceName)
    const regionCertArn = `arn:aws:acm:${this.region}:${this.account}:certificate/${props.certId}`
    const certificate = certman.Certificate.fromCertificateArn(this, 'albCert', regionCertArn)
    const domainZone = route53.HostedZone.fromLookup(this, 'zone', {
      domainName: props.domainApex,
    })

    const vpc = new ec2.Vpc(this, 'demoVpc', {
      maxAzs: 3,
    })

    const cluster = new ecs.Cluster(this, 'demoCluster', {
      vpc,
    })

    const executionRole = this.getTaskExecutionRole()
    const taskRole = this.getTaskRole()

    // Creates:
    //   ALB, target group, ecs cluster service, route53 entries, etc.
    //
    const pat = new EcsPatterns.ApplicationLoadBalancedFargateService(this, 'demoService', {
      cluster: cluster,
      publicLoadBalancer: true,
      certificate,
      domainName: props.dnsName,
      domainZone,
      protocol: elbv2.ApplicationProtocol.HTTPS,
      memoryLimitMiB: 2048,
      cpu: 512,
      desiredCount: 1,
      // Uses awslogs as default
      taskImageOptions: {
        containerPort: 3005,
        executionRole,
        taskRole,
        environment: {
          DEPLOY_DATE: Date.now().toLocaleString(),
        },
        image: ecs.ContainerImage.fromEcrRepository(repository),
        logDriver: new ecs.AwsLogDriver({
          logGroup,
          streamPrefix: props.serviceName,
        }),
      },
    })

    this.addTracing(pat)

    pat.targetGroup.configureHealthCheck({
      path: '/v1/healthcheck',
    })
  }

  private addTracing(pat: EcsPatterns.ApplicationLoadBalancedFargateService): void {
    const taskDef = pat.taskDefinition

    const xrayContainer = taskDef.addContainer('xray-daemon', {
      image: ecs.ContainerImage.fromRegistry('amazon/aws-xray-daemon'),
      cpu: 32,
      memoryReservationMiB: 256,
    })

    xrayContainer.addPortMappings({
      hostPort: 2000,
      containerPort: 2000,
      protocol: ecs.Protocol.UDP,
    })
  }

  getTaskExecutionRole(): iam.Role {
    // Role ecs service assumes to launch and manage the service (push logs, etc.)
    //
    const executionRole = new iam.Role(this, 'taskExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    })

    // CLI:
    //    aws iam list-policies --scope AWS --query 'Policies[].PolicyName' | grep ECS
    // Console:
    //    https://console.aws.amazon.com/iam/home?#/policies
    //
    executionRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy')
    )
    executionRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess')
    )
    return executionRole
  }

  getTaskRole(): iam.Role {
    // Role for task itself (access SSM, bucket, etc.)
    //
    const role = new iam.Role(this, 'taskRole', {
      path: '/task/role/',
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    })
    role.addToPolicy(
      new iam.PolicyStatement({
        resources: ['*'],
        actions: ['ssm:Describe*'],
      })
    )
    const paramPath = `arn:aws:ssm:${this.region}:${this.account}:parameter/api/clientcreds/*`
    role.addToPolicy(
      new iam.PolicyStatement({
        resources: [paramPath],
        actions: ['ssm:Get*'],
      })
    )
    return role
  }
}
