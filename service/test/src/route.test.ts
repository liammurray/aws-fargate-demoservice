import { expect } from 'chai'
import Timer from '~/util/timer'
import ctx from '~/globals'

describe.only('Order', function() {
  it('should do something', function() {
    const timer = new Timer()
    ctx.run(function() {
      ctx.correlationIds.put({child: 'someval'})
      ctx.logger.info('hi from logger')
    })
    ctx.logger.info('hi from outside')

    expect(timer.getMillisecs()).to.be.above(0)
  })
})
