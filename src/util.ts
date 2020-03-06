import env from 'env-var'

export function flatten<T>(arr: T[][]): T[] {
  return arr.reduce((prev: T[], cur: T[]) => prev.concat(cur))
}

// tslint:disable-next-line function-name
export function swap<T>(arr: T[], first: number, second: number): T[] {
  const temp = arr[first]
  arr[first] = arr[second] // eslint-disable-line no-param-reassign
  arr[second] = temp // eslint-disable-line no-param-reassign
  return arr
}

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
