export default class Timer {
  private start: [number, number]

  constructor() {
    this.start = process.hrtime()
  }

  reset(): void {
    this.start = process.hrtime()
  }

  getMillisecs(): number {
    const diff = process.hrtime(this.start)
    return diff[0] * 1e3 + diff[1] * 1e-6
  }
}
