import pino, { Logger } from 'pino'
import dotenv from 'dotenv'
import { createNamespace, Namespace } from 'cls-hooked'
import CorrelationIds, { IdMap } from './instrumentation/correlationIds'
import { envStr } from './util/env'
import { EventEmitter } from 'events'

dotenv.config()

/** Parent logger */
export const logger = pino({
  level: envStr('LOG_LEVEL'),
  name: envStr('SERVICE_NAME'),
})

export function getRootLogger(): Logger {
  return logger
}

export type RunParams = {
  emitters: EventEmitter[]
}

export type RunFunc = (...args: any[]) => void

class Context {
  private readonly ns: Namespace
  constructor(name = 'myapp') {
    this.ns = createNamespace(name)
  }

  run(params: RunParams, func: RunFunc) {
    if (this.ns.active) {
      // For simplicity of implementation (otherwise need to copy logger and map)
      throw new Error('Nested CLS contexts forbidden')
    }
    for (const e of params.emitters) {
      this.ns.bindEmitter(e)
    }

    this.ns.run(() => {
      this.ns.set('correlationIds', new CorrelationIds())
      func()
    })
  }

  set logger(logger: Logger) {
    this.ns.set('logger', logger)
  }

  get logger(): Logger {
    return (this.ns.get('logger') as Logger) || getRootLogger()
  }

  /**
   * Creates and pushes child logger
   * Note:
   *    Pino adds duplicate bindings (we could strip out based on current bindings)
   *    We don't support removing correlation ids
   */
  childLogger(bindings: pino.Bindings) {
    const childBindings = {
      ...bindings,
      ...this.correlationIds.get(),
    }
    this.logger = this.logger.child(childBindings)
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
