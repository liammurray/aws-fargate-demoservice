import axios, { AxiosBasicCredentials, AxiosRequestConfig } from 'axios'
import * as OrdersApi from '@liammurray/orders-client-axios'
import { createSSM, getSecureParam } from '~/util/awsUtil'
import querystring from 'querystring'
import ctx from '~/globals'
import { envStr } from '~/util/env'
import { DefaultApi } from '@liammurray/orders-client-axios'

// Numeric args are typed as strings (TODO figure it out)
// See: https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-known-issues.html#api-gateway-known-issues-rest-apis
// https://github.com/OpenAPITools/openapi-generator/tree/master/samples/openapi3/client/petstore/javascript-es6

type TokenRequestOpts = {
  auth: AxiosBasicCredentials
  endpoint: string
}

// The generator currently doesn't name the API correctly (TODO figure it out)
export type OrdersApiClient = DefaultApi

class TokenGetter {
  private accessToken?: string
  private expirationEpoch?: number

  constructor(private readonly opts: TokenRequestOpts) {}

  async get(): Promise<string> {
    if (this.accessToken && this.isValid()) {
      return this.accessToken
    }
    await this.fetch()
    if (!this.accessToken) {
      throw new Error('Whoops')
    }
    return this.accessToken
  }

  private isValid(): boolean {
    return (this.expirationEpoch || 0) > Date.now()
  }

  private async fetch(): Promise<void> {
    // https://docs.aws.amazon.com/cognito/latest/developerguide/token-endpoint.html

    const form = querystring.stringify({
      // eslint-disable-next-line @typescript-eslint/camelcase
      grant_type: 'client_credentials',
      scope: 'orders/rw',
    })

    const config: AxiosRequestConfig = {
      auth: this.opts.auth,
      headers: {
        Accept: '*/*',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
    const strip = { ...config }
    delete strip.auth
    ctx.logger.info('Fetching access token', strip)
    const res = await axios.post(this.opts.endpoint, form, config)
    const body = res.data
    this.accessToken = body.access_token
    const MS_30SECS = 30 * 1000
    this.expirationEpoch = Date.now() + body.expires_in * 1000 - MS_30SECS
  }
}

async function createTokenGetter(): Promise<TokenGetter> {
  const path = '/api/clientcreds/FullUser'
  ctx.logger.info(`Fetching client credentials from SSM for ${path}`)
  const val = await getSecureParam(createSSM(), path)
  const [username, password] = val.split(':')
  return new TokenGetter({
    auth: {
      username,
      password,
    },
    endpoint: envStr('ORDERS_AUTH_ENDPOINT'),
  })
}

class OrdersClientGetter {
  constructor(private readonly tokenGetter: TokenGetter) {}
  async get(): Promise<OrdersApi.DefaultApi> {
    // We specify security scheme 'apiKey' in swagger (until we figure out OAuth2 for client credentials).
    // We therefore pass the 'Authorization' header value as as apiKey
    const accessToken = await this.tokenGetter.get()
    const authHeader = `Bearer ${accessToken}`
    const basePath = envStr('ORDERS_API_ENDPOINT') || 'https://dev-api.nod15c.com/orders'
    return new OrdersApi.DefaultApi({ apiKey: authHeader }, basePath)
  }

  // private createAxios(): AxiosInstance | undefined {
  //   const AXIOS_OPTS: AxiosRequestConfig = {
  //     // So we get 404, etc. instead of throw
  //     validateStatus: (): boolean => true,
  //   }
  //   // Needs to be compat with version that generated client uses
  //   return axios.create(AXIOS_OPTS)
  // }
}

let getter: OrdersClientGetter

/**
 * Returns function that when called returns an instance of the auto-generated
 * orders api client (generated from openapi-generator). You need to call this
 * each time you handle a request. It ensures the token is valid (fetching a
 * new token as needed).
 *
 * We are using the configuraion 'accessToken' which is passed as
 *  Authorization: <token>
 *
 * The reason for this funkyness is there is no asynchronous
 * hook to supply the token. (So we make "get client" asynchronous.)
 * The client probably supports "oauth2" security but not sure how to
 * get that (type=oauth2) to work with AWS SAM template and swagger. (See
 * https://swagger.io/docs/specification/authentication/)
 *
 * Usage:
 *
 * import { getOrdersApiClient } from '~/getOrdersApiClient'
 * const client = await getOrdersApiClient()
 * const orders = await client.listOrders()
 */
export default async function getOrdersApiClient(): Promise<OrdersApi.DefaultApi> {
  if (!getter) {
    const tokenGetter = await createTokenGetter()
    getter = await new OrdersClientGetter(tokenGetter)
  }
  return getter.get()
}
