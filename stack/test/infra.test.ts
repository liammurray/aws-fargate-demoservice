import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert'
import * as cdk from '@aws-cdk/core'
import FargateServiceStack from '../src/fargateService'

test('Empty Stack', () => {
  const app = new cdk.App()
  // WHEN
  const stack = new FargateServiceStack(app, 'MyTestStack', {
    env: {
      region: 'us-west-2',
      account: 'xyz',
    },
    certId: 'bf2794b2-e3d6-45cc-a849-f7add37d76d0',
    dnsName: 'demoservice.nod15c.com',
    domainApex: 'nod15c.com.',
    serviceName: 'demoservice',
  })
  // THEN
  expectCDK(stack).to(
    matchTemplate(
      {
        Resources: {},
      },
      MatchStyle.EXACT
    )
  )
})
