import chai from 'chai'
import sinonChai from 'sinon-chai'
import { Runner } from 'mocha'
import ctx from '~/globals'

chai.use(sinonChai)

chai.config.includeStack = true

// Establish CLS context
const hookedRun = Runner.prototype.run
Runner.prototype.run = function (fn) {
  return ctx.run(hookedRun.bind(this, fn))
}
