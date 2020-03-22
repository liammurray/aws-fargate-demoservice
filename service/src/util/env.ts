import env from 'env-var'

export function envStr(key: string): string {
  return env
    .get(key)
    .required()
    .asString()
}
export function envPort(key: string): number {
  return env
    .get(key)
    .required()
    .asPortNumber()
}
