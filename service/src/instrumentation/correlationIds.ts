export type IdMap = {
  [key: string]: string
}

function isUpper(ch: string): boolean {
  return ch >= 'A' && ch <= 'Z'
}

function startsUpper(str: string): boolean {
  return str.length != 0 && isUpper(str[0])
}

function capFirst(str: string): string {
  if (str.length != 0) {
    return `${str[0].toUpperCase()}${str.slice(1)}`
  }
  return str
}

function uncapFirst(str: string): string {
  if (str.length != 0) {
    return `${str[0].toLowerCase()}${str.slice(1)}`
  }
  return str
}

/**
 * Splits PascalCase and camelCase
 */
export function caseSplit(str: string): string[] {
  const parts: string[] = []

  let begin = 0
  for (let idx = 1; idx < str.length; ++idx) {
    if (isUpper(str[idx])) {
      parts.push(str.slice(begin, idx))
      begin = idx
    }
  }
  parts.push(str.slice(begin, str.length))
  return parts.filter(Boolean)
}

export type Opts = {
  logPrefix: string
  headerPrefix: string
}

const defaultOpts: Opts = {
  logPrefix: 'cid',
  headerPrefix: 'Nod15c-Id',
}

export default class CorrelationIds {
  private readonly opts: Opts
  constructor(private readonly ids = {}, opts?: Partial<Opts>) {
    this.opts = { ...defaultOpts, ...opts }
  }

  /**
   * Adds all entries from map
   */
  put(idMap: IdMap): void {
    for (const [key, val] of Object.entries(idMap)) {
      this.ids[this.fixup(key)] = val
    }
  }

  /**
   * Adds one entry
   */
  set(key: string, val: string): void {
    this.ids[this.fixup(key)] = val
  }

  get(): IdMap {
    return this.ids
  }

  getLogs(): IdMap {
    const out: IdMap = {}
    for (const [key, val] of Object.entries<string>(this.ids)) {
      out[this.toLogKey(key)] = val
    }
    return out
  }

  getHeaders(): IdMap {
    const out: IdMap = {}
    for (const [key, val] of Object.entries<string>(this.ids)) {
      out[this.toHeaderKey(key)] = val
    }
    return out
  }

  private toHeaderKey(key: string): string {
    const suffix = caseSplit(key)
      .map(s => s.toLowerCase())
      .map(s => capFirst(s))
      .join('-')
    return `${this.opts.headerPrefix}-${suffix}`
  }

  private toLogKey(key: string): string {
    return `${this.opts.logPrefix}${capFirst(key)}`
  }

  private fixup(str: string): string {
    return uncapFirst(str)
  }
}
