//import 'module-alias/register'
import express, { Request, Response } from 'express'
import { v4 as uuid } from 'uuid'
import CorrelationIds from './correlationIds'
import { envPort } from './util'
import { v1 } from './routes'
import { getRootLogger, getNamespace } from './globals'
import bodyParser from 'body-parser'

function initClsMiddleware(req: Request, res: Response, next): void {
  const ns = getNamespace()
  ns.run(() => {
    const ids = new CorrelationIds()
    ids.put('default', uuid())
    ns.set('correlationIds', ids)

    const context = {
      'x-request-id': uuid(),
      ...ids.get(),
    }
    const child = getRootLogger().child(context)
    ns.set('logger', child)

    next()
  })
}

function setDefaultHeadersMiddleware(req: Request, res: Response, next) {
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
  res.set('Cache-Control', 'no-store')
  res.set('X-Content-Type-Options', 'nosniff')
  res.set('X-XSS-Protection', '1; mode=block')
  res.set('Access-Control-Allow-Headers', 'Content-type,Accept,X-Real-IP,Authorization')
  if (req.method === 'OPTIONS') {
    res.status(200).end()
  } else {
    next()
  }
}

const app = express()
const port = envPort('PORT')

app.use(initClsMiddleware)
app.use(setDefaultHeadersMiddleware)
app.use(bodyParser.json())

app.use('/v1', v1)

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
