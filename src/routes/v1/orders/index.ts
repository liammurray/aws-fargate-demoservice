import { Router, Request, Response } from 'express'
import HttpStatus from 'http-status-codes'
import { getLogger } from '../../../globals'

export const router = Router()

const orders = ['a', 'b', 'c']

function getOrders(req: Request, res: Response): void {
  res.status(HttpStatus.OK).json({
    orders,
  })
}

function getOrderById(req: Request, res: Response): void {
  getLogger().info('getOrderById', req.params)
  const idx = parseInt(req.params.id)
  if (idx >= 0 && idx < orders.length) {
    res.status(HttpStatus.OK).json({
      order: {
        id: idx,
        code: orders[idx],
      },
    })
  } else {
    res.status(HttpStatus.NOT_FOUND).end()
  }
}

router.get('/', getOrders)

router.get('/:id', getOrderById)
