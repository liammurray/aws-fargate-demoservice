import AsyncHooks from 'async_hooks'
import util from 'util'
import fs from 'fs'

export function logAsyncHook(types?: string[]): void {
  const tracked = {}
  const fileOut: number | string = 1 // stdout = 1

  /**
   * Use instead of console.log since that is async and causes
   * infinite recursion if called within async hook callback
   */
  function log(arg, ...args): void {
    fs.writeFileSync(fileOut, `${util.format(arg, ...args)}\n`, { flag: 'a' })
  }

  function trace(name: string, asyncId): void {
    const meta = tracked[asyncId]
    if (!meta) {
      return
    }
    log(
      `[${name}] id=${meta.asyncId}, ` +
        `type=${meta.type}, trigger=${meta.triggerAsyncId}, ` +
        `res type=${meta.resource.constructor.name}`
    )
  }

  class AsyncCallbacks {
    init(asyncId, type, triggerAsyncId, resource): void {
      if (types && !types.includes(type)) {
        // skip
        // log(`Skipping type ${type}`)
        return
      }
      log(`init: tracking ${triggerAsyncId} => ${asyncId} ${type}`)
      const meta = {
        asyncId,
        type,
        triggerAsyncId,
        resource,
      }
      // Store what we saw
      tracked[asyncId] = meta
    }
    before(asyncId): void {
      trace('before', asyncId)
    }
    after(asyncId): void {
      trace('after', asyncId)
    }
    destroy(asyncId): void {
      trace('destroy', asyncId)
      delete tracked[asyncId]
    }
    promiseResolve(asyncId): void {
      trace('promiseResolve', asyncId)
    }
  }

  const asyncHook = AsyncHooks.createHook(new AsyncCallbacks())
  asyncHook.enable()
}

export function dump(context: string): void {
  const id = AsyncHooks.executionAsyncId()
  console.log(`${id}: ${context}`)
}

/**
 * Enables async hook for a couple types to show how it works
 */
export function testAsyncHook(): void {
  logAsyncHook(['Timeout', 'PROMISE'])

  Promise.resolve().then(() => {
    dump('promise then')
  })

  setTimeout(() => {
    dump('timeout')
  }, 1000)
}
