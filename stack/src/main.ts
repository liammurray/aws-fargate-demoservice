#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from '@aws-cdk/core'
import * as aws from 'aws-sdk'
import BuildStack from './buildStack'
import FargateServiceStack from './fargateServiceStack'
import { getStringParams } from './util'

const app = new cdk.App()

export async function getCallerAccount(): Promise<string> {
  const sts = new aws.STS({ apiVersion: '2011-06-15' })
  const data = await sts.getCallerIdentity({}).promise()
  if (!data?.Account) {
    throw new Error('oops')
  }
  return data.Account
}

getCallerAccount().then(async account => {
  const env = {
    account,
    region: 'us-west-2',
  }

  /**
   * Creates common loggroup and ECR repos for services
   */

  // Builds and deploys OrdersAPI from master branch
  // This provides pipeline that builds and deploys automatically
  //
  new BuildStack(app, 'demoservice-build', {
    branch: 'master',
    repo: '/cicd/demoservice/github/repo',
    user: '/cicd/common/github/owner',
    npmtoken: '/cicd/common/github/npmtoken',
    env,
  })

  // We need to resolve these params during synth (since used in string substitutions)
  const [certId, domain] = await getStringParams(
    '/cicd/common/certs/us-west-2',
    '/cicd/common/domain'
  )

  /**
   * Stack for service in VPC (dev stage)
   * TODO: move values below to SSM
   */
  return new FargateServiceStack(app, 'demoservice-service', {
    certId,
    domain,
    dnsPrefix: 'demoservice-dev',
    serviceName: 'demoservice',
    stage: 'dev',
    env,
  })
})
