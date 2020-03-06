import pino, { Logger } from 'pino'
import dotenv from 'dotenv'
import { createNamespace } from 'cls-hooked'
import CorrelationIds from './correlationIds'
import { envStr } from './util'

dotenv.config()

/** Parent logger */
export const logger = pino({
  level: envStr('LOG_LEVEL'),
  name: envStr('SERVICE_NAME'),
})

const ns = createNamespace('myApp')

export function getNamespace(): typeof ns {
  return ns
}

export function getRootLogger(): Logger {
  return logger
}

export function getLogger(): Logger {
  return ns.get('logger') as Logger
}

export function getCorrelationIds(): CorrelationIds {
  return ns.get('correlationIds') as CorrelationIds
}
