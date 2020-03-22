import { Request, Response, NextFunction, RequestHandler } from 'express'

/**
 * Catches execeptions from 'fn' and forwards them to 'next' so they
 * can be handled in default handler at end of chain (see server.ts)
 */
export default function catchExceptions(fn: RequestHandler) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
