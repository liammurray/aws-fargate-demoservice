#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from '@aws-cdk/core'
import ServiceCommonStack from './common'
import FargateServiceStack from './fargateService'

const myAccount = '958019638877'

const app = new cdk.App()

/**
 * Creates common loggroup and ECR repos for services
 */
new ServiceCommonStack(app, 'services-common', {
  env: {
    region: 'us-west-2',
    account: myAccount,
  },
})

/**
 * Stack for service in VPC
 */
new FargateServiceStack(app, 'demoservice', {
  env: {
    region: 'us-west-2',
    account: myAccount,
  },
  certId: 'bf2794b2-e3d6-45cc-a849-f7add37d76d0',
  dnsName: 'demoservice.nod15c.com',
  domainApex: 'nod15c.com.',
  serviceName: 'demoservice',
})
