export type IdMap = {
  [key: string]: string
}

const DEFAULT_PREFIX='nod15c-cid-'
export default class CorrelationIds {
  constructor(private readonly ids = {}, private readonly prefix: string = DEFAULT_PREFIX) {}

  withPrefix(str: string): string {
    return str.startsWith(this.prefix) ? str : `${this.prefix}${str}`
  }

  /**
   * Fixes up keys when adding IDs. Ensures ID is normalized:
   *  1) lowercase
   *  2) ensures correlation id prefix if not there
   */
  fixup(str: string): string {
    return  this.withPrefix(str).toLowerCase()
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
