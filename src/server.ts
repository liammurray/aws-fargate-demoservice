import express, { Request, Response } from 'express'
import { v4 as uuid } from 'uuid'
import CorrelationIds from './correlationIds'
import { envPort } from './util'
import { v1 } from './routes'
import ctx, { getRootLogger } from './globals'
import bodyParser from 'body-parser'

function initClsMiddleware(req: Request, res: Response, next): void {
  const ns = ctx.namespace
  ns.run(() => {
    ns.bindEmitter(req)
    ns.bindEmitter(res)

    const ids = new CorrelationIds()
    ids.put('default', uuid())
    ctx.correlationIds = ids

    const context = {
      'x-request-id': uuid(),
      ...ids.get(),
    }
    ctx.logger = getRootLogger().child(context)

    next()
  })
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

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
