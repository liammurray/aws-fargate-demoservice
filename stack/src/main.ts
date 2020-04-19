#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from '@aws-cdk/core'
import * as aws from 'aws-sdk'
import BuildStack from './buildStack'
import FargateServiceStack from './fargateServiceStack'

const app = new cdk.App()

export async function getCallerAccount(): Promise<string> {
  const sts = new aws.STS({ apiVersion: '2011-06-15' })
  const data = await sts.getCallerIdentity({}).promise()
  if (!data?.Account) {
    throw new Error('oops')
  }
  return data.Account
}

getCallerAccount().then(account => {
  const env = {
    account,
    region: 'us-west-2',
  }

  /**
   * Creates common loggroup and ECR repos for services
   */

  try {
    // Builds and deploys OrdersAPI from master branch
    // This provides pipeline that builds and deploys automatically
    //
    new BuildStack(app, 'demoservice-build', {
      branch: 'master',
      repo: '/cicd/demoservice/github/repo',
      user: '/cicd/demoservice/github/owner',
      npmtoken: '/cicd/demoservice/github/npmtoken',
      env,
    })

    /**
     * Stack for service in VPC (dev stage)
     * TODO: move values below to SSM
     */
    new FargateServiceStack(app, 'demoservice-service', {
      certId: 'bf2794b2-e3d6-45cc-a849-f7add37d76d0',
      dnsName: 'demoservice-dev.nod15c.com',
      domainApex: 'nod15c.com.',
      serviceName: 'demoservice',
      stage: 'dev',
      env,
    })
  } catch (e) {
    console.log(e)
  }
})
