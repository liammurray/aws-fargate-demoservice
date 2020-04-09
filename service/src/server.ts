import express, { Request, Response, NextFunction } from 'express'
import { v4 as uuid } from 'uuid'
import { envPort } from './util/env'
import { v1 } from './routes'
import ctx from './globals'
import bodyParser from 'body-parser'
import HttpStatus from 'http-status-codes'

function initClsMiddleware(req: Request, res: Response, next): void {
  ctx.run(() => {
    // TODO capture ids
    ctx.correlationIds.put({ demoservice: uuid() })
    ctx.childLogger({ 'x-request-id': uuid() })
    next()
  }, { emitters: [req, res] })
}

function setDefaultHeadersMiddleware(req: Request, res: Response, next): void {
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
  res.set('Cache-Control', 'no-store')
  res.set('X-Content-Type-Options', 'nosniff')
  res.set('X-XSS-Protection', '1; mode=block')
  res.set('Access-Control-Allow-Headers', 'Content-type,Accept,X-Real-IP,Authorization')
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  next()
}

const app = express()
const port = envPort('PORT')

app.use(initClsMiddleware)
app.use(setDefaultHeadersMiddleware)
app.use(bodyParser.json())

app.use('/v1', v1)

/**
 * Catch unhandled errors and return JSON with default 500
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  ctx.logger.warn({
    message: err?.message || 'error',
    stack: err?.stack || 'no stack',
  })
  res.status(err.status || err.statusCode || HttpStatus.INTERNAL_SERVER_ERROR).end()
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
