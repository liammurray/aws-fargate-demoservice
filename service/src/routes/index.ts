import { Router, Request, Response } from 'express'

import { router as orders } from './v1/orders'
import ctx from '~/globals'

export const v1 = Router()

v1.use('/orders', orders)

v1.get('/healthcheck', (_req, res) => {
  // ctx.logger.info('healthcheck')
  res.status(200).json({ uptime: process.uptime() })
})

v1.get('/', (req: Request, res: Response) => {
  ctx.logger.info('Echo')
  res.send('Hello!')
})
