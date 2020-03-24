#!/usr/bin/env node
import 'source-map-support/register'
import cdk from '@aws-cdk/core'
import { DemoServiceFargateStack } from './stack'

const myAccount = '958019638877'

// cdk deploy demoservice-stack

const app = new cdk.App()

new DemoServiceFargateStack(app, 'demoservice-stack', {
  env: {
    region: 'us-west-2',
    account: myAccount,
  },
})
