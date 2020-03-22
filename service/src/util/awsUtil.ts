import AWS from 'aws-sdk'
import _ from 'lodash'

//
// Generic AWS SDK utils
//

function ensureRegion(region?: string): string {
  return region || process.env.AWS_REGION || 'us-west-2'
}

export function createSSM(region?: string): AWS.SSM {
  return new AWS.SSM({ apiVersion: '2014-11-06', region: ensureRegion(region) })
}

export function createS3(region?: string): AWS.S3 {
  return new AWS.S3({
    apiVersion: '2006-03-01',
    region: ensureRegion(region),
    sslEnabled: true,
    signatureVersion: 'v4',
  })
}

/**
 * Returns secure string parameter assumed stored as JSON.
 * You can pass a path into the JSON object to retrieve a portion of the objet.
 * Example:
 *    /path/to/json:some.json.path
 */
export async function getSecureJsonParam(ssm: AWS.SSM, pathKey: string): Promise<string | object> {
  const [name, key] = pathKey.split(':')
  const res = await ssm.getParameter({ Name: name, WithDecryption: true }).promise()
  if (res && res.Parameter && res.Parameter.Value) {
    const ob = JSON.parse(res.Parameter.Value)
    if (key) {
      return _.get(ob, key)
    }
    return ob
  }
  throw new Error(`Failed to lookup parameter ${pathKey}`)
}

export async function getSecureParam(ssm: AWS.SSM, path: string): Promise<string> {
  const res = await ssm.getParameter({ Name: path, WithDecryption: true }).promise()
  if (res && res.Parameter && res.Parameter.Value) {
    return res.Parameter.Value
  }
  throw new Error(`Failed to lookup parameter ${path}`)
}
