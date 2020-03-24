import * as cdk from '@aws-cdk/core'
import * as ec2 from '@aws-cdk/aws-ec2'
import * as ecs from '@aws-cdk/aws-ecs'
import * as ecr from '@aws-cdk/aws-ecr'
import * as ecs_patterns from '@aws-cdk/aws-ecs-patterns'

export class DemoServiceFargateStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const vpc = new ec2.Vpc(this, 'DemoVpc', {
      maxAzs: 3,
    })

    const cluster = new ecs.Cluster(this, 'DemoCluster', {
      vpc: vpc,
    })

    //958019638877.dkr.ecr.us-west-2.amazonaws.com/demoservice:latest
    const repositoryName = 'demoservice'
    const repository = new ecr.Repository(this, repositoryName, {
      repositoryName,
    })

    new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'MyFargateService', {
      cluster: cluster,
      cpu: 512,
      desiredCount: 1,
      taskImageOptions: { image: ecs.ContainerImage.fromEcrRepository(repository) },
      memoryLimitMiB: 2048,
      publicLoadBalancer: true,
    })
  }
}
