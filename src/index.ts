import express, { Request, Response } from 'express'
import pino, { Logger } from 'pino'
import dotenv from 'dotenv'
import env from 'env-var'
import { createNamespace } from 'cls-hooked'
import { v4 as uuid } from 'uuid'
import CorrelationIds from './correlationIds'

//import { testAsyncHook } from './hooker'

//testAsyncHook()

export function envStr(key: string): string {
  return env
    .get(key)
    .required()
    .asString()
}
export function envPort(key: string): number {
  return env
    .get(key)
    .required()
    .asPortNumber()
}

dotenv.config()

export const logger = pino({
  level: envStr('LOG_LEVEL'),
  name: envStr('SERVICE_NAME'),
})

const ns = createNamespace('myApp')

function initClsMiddleware(req, res, next): void {
  ns.run(() => {
    const ids = new CorrelationIds()
    ids.put('default', uuid())
    ns.set('correlationIds', ids)

    const context = {
      'x-request-id': uuid(),
      ...ids.get(),
    }
    const child = logger.child(context)
    ns.set('logger', child)

    next()
  })
}

function getLogger(): Logger {
  return ns.get('logger') as Logger
}
function getCorrelationIds(): CorrelationIds {
  return ns.get('correlationIds') as CorrelationIds
}

const app = express()
const port = envPort('PORT')

app.use(initClsMiddleware)

app.get('/healthcheck', (_req, res) => {
  getLogger().info('healthcheck')
  res.status(200).json({ uptime: process.uptime() })
})

app.get('/', (req: Request, res: Response) => {
  getLogger().info('Request incoming')
  res.send('Hello!')
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
