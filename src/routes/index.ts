import { Router, Request, Response } from 'express'

import { router as orders } from './v1/orders'
import { getLogger } from '../globals'

export const v1 = Router()

v1.use('/orders', orders)

v1.get('/healthcheck', (_req, res) => {
  getLogger().info('healthcheck')
  res.status(200).json({ uptime: process.uptime() })
})

v1.get('/', (req: Request, res: Response) => {
  getLogger().info('Echo')
  res.send('Hello!')
})
