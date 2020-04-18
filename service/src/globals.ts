import pino, { Logger, LogFn } from 'pino'
import dotenv from 'dotenv'
import { createNamespace, Namespace } from 'cls-hooked'
import CorrelationIds from './instrumentation/correlationIds'
import { envStr, envBool, envPort } from './util/env'
import { EventEmitter } from 'events'

dotenv.config()

const pinoBaseOpts: pino.LoggerOptions = {
  level: envStr('LOG_LEVEL'),
  name: envStr('SERVICE_NAME'),
}

const hooks = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  logMethod(inputArgs: any[], method: any): void {
    if (inputArgs.length >= 2) {
      const arg1 = inputArgs.shift()
      const arg2 = inputArgs.shift()
      return method.apply(this, [arg2, arg1, ...inputArgs])
    }
    return method.apply(this, inputArgs)
  },
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(pinoBaseOpts as any).hooks = hooks

// Used by default if outside cls context
const globalLogger = pino({
  ...pinoBaseOpts,
})

export type RunParams = {
  emitters?: EventEmitter[]
}

export type RunFunc<RT> = (...args: any[]) => RT

const KEY_LOGGER = 'logger'
const KEY_IDS = 'cids'

type Config = {
  hookGlobalHttp: boolean
  port: number
}

const config: Config = {
  hookGlobalHttp: envBool('INSTRUMENT_GLOBAL_HTTP', true),
  port: envPort('PORT'),
}

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

  get config(): Config {
    return config
  }

  get logger(): Logger {
    return (this.ns.get(KEY_LOGGER) as Logger) || globalLogger
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
