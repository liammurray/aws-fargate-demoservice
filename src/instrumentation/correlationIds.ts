export default class CorrelationIds {
  constructor(private readonly ids = {}, private readonly prefix: string = 'x-correlation-id-') {}

  withPrefix(str: string): string {
    return str.startsWith(this.prefix) ? str : `${this.prefix}${str}`
  }

  put(name: string, val: string): void {
    this.ids[this.withPrefix(name)] = val
  }

  get(): { [key: string]: string } {
    return this.ids
  }
}
