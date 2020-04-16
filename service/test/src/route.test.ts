import { expect } from 'chai'
import Timer from '~/util/timer'
import ctx from '~/globals'

describe('Context', function () {
  it('should  handle layered context', function () {
    // TODO: verify logs
    const timer = new Timer()
    ctx.correlationIds.put({ parent: 'x' })
    ctx.run(function () {
      ctx.correlationIds.put({ child: 'y' })
      ctx.logger.info('hi from logger')
    })
    ctx.logger.info('hi from outside')

    expect(timer.getMillisecs()).to.be.above(0)
  })
})
