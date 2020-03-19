import { expect } from 'chai'
import Timer from '~/util/timer'

describe('Timer', function() {
  it('should produce millisecs', function() {
    const timer = new Timer()

    expect(timer.getMillisecs()).to.be.above(0)
  })
})
