import pino, { Logger } from 'pino'
import dotenv from 'dotenv'
import { createNamespace, Namespace } from 'cls-hooked'
import CorrelationIds from './correlationIds'
import { envStr } from './util'

dotenv.config()

/** Parent logger */
export const logger = pino({
  level: envStr('LOG_LEVEL'),
  name: envStr('SERVICE_NAME'),
})

export function getRootLogger(): Logger {
  return logger
}

class Context {
  private readonly ns: Namespace
  constructor(name = 'myapp') {
    this.ns = createNamespace(name)
  }

  set logger(logger: Logger) {
    this.ns.set('logger', logger)
  }

  get logger(): Logger {
    return this.ns.get('logger') as Logger
  }

  set correlationIds(cids: CorrelationIds) {
    this.ns.set('correlationIds', cids)
  }

  get correlationIds(): CorrelationIds {
    return this.ns.get('correlationIds') as CorrelationIds
  }

  get namespace(): Namespace {
    return this.ns
  }
}

const ctx = new Context()

export default ctx
