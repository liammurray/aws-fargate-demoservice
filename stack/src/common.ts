import * as cdk from '@aws-cdk/core'
import * as ecr from '@aws-cdk/aws-ecr'
import * as logs from '@aws-cdk/aws-logs'
import { Duration } from '@aws-cdk/core'

/**
 * ECR Repo for demoservice
 */
export default class ServiceCommonStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    new logs.LogGroup(this, 'logroup', {
      logGroupName: '/nod15c/services',
    })

    const repos = ['demoservice']

    for (const repo of repos) {
      this.addRepo(repo)
    }
  }

  addRepo(repositoryName: string) {
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
  }
}
