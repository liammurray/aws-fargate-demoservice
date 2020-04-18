import { Router, Request, Response } from 'express'
import HttpStatus from 'http-status-codes'
import ctx from '~/globals'

import { ListOrdersResponse } from '@liammurray/orders-client-axios'

import getOrdersApiClient from '~/clients/getOrdersApiClient'

import catchExceptions from '~/util/catchExceptions'

export const router = Router()

const AXIOS_OPTS = {
  // So we get 404, etc. instead of throw
  validateStatus: (): boolean => true,
}

async function getOrders(_req: Request, res: Response): Promise<void> {
  const client = await getOrdersApiClient()
  ctx.logger.info('getOrders')

  const result = await client.listOrders('0', 'ordered', '3', AXIOS_OPTS)
  switch (result.status) {
    case HttpStatus.OK: {
      const ordersResponse: ListOrdersResponse = result.data
      res.status(HttpStatus.OK).json({
        ...ordersResponse,
      })
      break
    }
    default:
      res.status(HttpStatus.BAD_REQUEST).json({
        error: `Unexpected ${result.status} response from backend service`,
      })
      break
  }
}

async function deleteOrderById(req: Request, res: Response): Promise<void> {
  ctx.logger.info('deleteOrderById', { params: req.params })

  const client = await getOrdersApiClient()

  const result = await client.deleteOrderById(req.params.id, AXIOS_OPTS)

  switch (result.status) {
    case HttpStatus.NOT_FOUND:
    case HttpStatus.OK:
      res.status(result.status)
      if (result.data) {
        res.json(result.data)
      } else {
        res.end()
      }
      break
    default:
      res.status(HttpStatus.BAD_REQUEST).json({
        error: `Unexpected ${result.status} response from backend service`,
      })
  }
}

async function getOrderById(req: Request, res: Response): Promise<void> {
  ctx.logger.info('getOrderById', req.params)

  const client = await getOrdersApiClient()

  const result = await client.getOrderById(req.params.id, AXIOS_OPTS)

  switch (result.status) {
    case HttpStatus.NOT_FOUND:
    case HttpStatus.OK:
      res.status(result.status)
      if (result.data) {
        res.json(result.data)
      } else {
        res.end()
      }
      break
    default:
      res.status(HttpStatus.BAD_REQUEST).json({
        error: `Unexpected ${result.status} response from backend service`,
      })
  }
}

router.get('/', catchExceptions(getOrders))

router.get('/:id', catchExceptions(getOrderById))

router.delete('/:id', catchExceptions(deleteOrderById))
