import pino, { Logger } from 'pino'
import dotenv from 'dotenv'
import { createNamespace, Namespace } from 'cls-hooked'
import CorrelationIds from './instrumentation/correlationIds'
import { envStr } from './util/env'
import { EventEmitter } from 'events'

dotenv.config()

const pinoBaseOpts: pino.LoggerOptions = {
  level: envStr('LOG_LEVEL'),
  name: envStr('SERVICE_NAME'),
}

export type RunParams = {
  emitters?: EventEmitter[]
}

export type RunFunc<RT> = (...args: any[]) => RT

const KEY_LOGGER = 'logger'
const KEY_IDS = 'cids'

class GlobalClsContext {
  private readonly ns: Namespace
  constructor(name = 'myapp') {
    this.ns = createNamespace(name)
  }

  /**
   * Returns return value from 'func'
   */
  run<RT>(func: RunFunc<RT>, params: RunParams = {}): RT {
    for (const e of params.emitters || []) {
      this.ns.bindEmitter(e)
    }

    return this.ns.runAndReturn(() => {
      // Support possible nesting

      // Clone existing
      const ids = { ...(this.correlationIds?.get() || {}) }
      this.ns.set(KEY_IDS, new CorrelationIds(ids))

      const old = this.logger

      // Always create new logger so it uses right mixin
      let logger = pino({
        ...pinoBaseOpts,
        mixin: () => {
          // Dynamically add IDs to every log
          return this.correlationIds.getLogs()
        },
      })
      if (old) {
        logger = logger.child(old.bindings())
      }
      this.ns.set(KEY_LOGGER, logger)

      return func()
    })
  }

  /**
   * Creates and sets child logger in context
   * Note:
   *    Pino adds duplicate bindings (we could strip out based on current bindings)
   */
  childLogger(bindings: pino.Bindings): void {
    const logger = this.logger.child(bindings)
    this.ns.set(KEY_LOGGER, logger)
  }

  get logger(): Logger {
    return this.ns.get(KEY_LOGGER) as Logger
  }

  get correlationIds(): CorrelationIds {
    return this.ns.get(KEY_IDS) as CorrelationIds
  }

  get namespace(): Namespace {
    return this.ns
  }
}

const ctx = new GlobalClsContext()
export default ctx
