import pino, { Logger } from 'pino'
import dotenv from 'dotenv'
import { createNamespace, Namespace } from 'cls-hooked'
import CorrelationIds, { IdMap } from './instrumentation/correlationIds'
import { envStr } from './util/env'
import { EventEmitter } from 'events'

dotenv.config()

const pinoBaseOpts: pino.LoggerOptions = {
  level: envStr('LOG_LEVEL'),
  name: envStr('SERVICE_NAME')
}


export type RunParams = {
  emitters: EventEmitter[]
}

export type RunFunc = (...args: any[]) => void

const KEY_LOGGER = 'logger'
const KEY_IDS = 'cids'

class GlobalClsContext {
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

      this.ns.set(KEY_IDS, new CorrelationIds())

      const logger = pino({
        ...pinoBaseOpts,
        mixin: () => {
          return this.correlationIds.get()
        }
      })

      this.ns.set(KEY_LOGGER, logger)

      func()
    })
  }

   /**
   * Creates and sets child logger in context
   * Note:
   *    Pino adds duplicate bindings (we could strip out based on current bindings)
   */
  childLogger(bindings: pino.Bindings) {
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

