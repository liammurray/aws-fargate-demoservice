import express, { Request, Response, NextFunction } from 'express'
import { v4 as uuid } from 'uuid'
import { envStr } from './util/env'
import { v1 } from './routes'
import ctx from './globals'
import bodyParser from 'body-parser'
import HttpStatus from 'http-status-codes'
import { instrumentGlobalHttps } from './instrumentation/hookHttp'
import xray from 'aws-xray-sdk'
import { annotateCurrentSegment } from './instrumentation/xrayUtil'

if (ctx.config.hookGlobalHttp) {
  ctx.logger.info('Enabling HTTP global instrumentation')
  instrumentGlobalHttps()
}

xray.config([xray.plugins.ECSPlugin])
xray.setLogger(ctx.logger)
xray.enableAutomaticMode()
xray.setContextMissingStrategy('LOG_ERROR')

function initClsMiddleware(req: Request, res: Response, next: NextFunction): void {
  ctx.run(
    () => {
      // TODO capture ids
      ctx.correlationIds.put({ demoService: uuid() })
      ctx.childLogger({ requestId: uuid() })
      next()
    },
    { emitters: [req, res] }
  )
}

function addAnnotationsMiddleware(_req: Request, res: Response, next: NextFunction): void {
  res.once('finish', () => {
    annotateCurrentSegment(ctx.correlationIds.getLogs())
  })
  next()
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

app.disable('x-powered-by')
app.use(initClsMiddleware)
// AWS_XRAY_TRACING_NAME can be set in environment to override this
app.use(xray.express.openSegment(envStr('SERVICE_NAME')))
app.use(addAnnotationsMiddleware)
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

app.use(xray.express.closeSegment())

const port = ctx.config.port
app.listen(port, () => ctx.logger.info(`Listening on port ${port}!`))
