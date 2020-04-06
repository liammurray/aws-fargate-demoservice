export type IdMap = {
  [key: string]: string
}
const DEFAULT_SUFFIX = '-_'

export default class CorrelationIds {
  constructor(private readonly ids = {}, private readonly prefix: string = 'x-correlation-id-') {}

  withPrefix(str: string): string {
    return str.startsWith(this.prefix) ? str : `${this.prefix}${str}`
  }

  /**
   * Fixes up keys when adding IDs. Ensures ID is normalized:
   *  1) lowercase
   *  2) ensures 'x-correlation-id-' prefix if not there
   *  3) handles '_' as special case so we end up with default 'x-correlation-id'
   */
  fixup(str: string): string {
    str = this.withPrefix(str).toLowerCase()
    str.lastIndexOf
    if (str.endsWith(DEFAULT_SUFFIX)) {
      str = str.slice(0, str.length - DEFAULT_SUFFIX.length)
    }
    return str
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
  set(key: string, val: string) {
    this.ids[this.fixup(key)] = val
  }

  get(): IdMap {
    return this.ids
  }
}
