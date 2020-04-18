/* eslint-disable @typescript-eslint/no-var-requires */
import * as xray from 'aws-xray-sdk'
import ctx from '~/globals'

// Use require to get reference to module (import * as http won't work)
const http = require('http')
const https = require('https')

type HttpModule = typeof http | typeof https

/**
 * patches the HTTP and HTTPS node built-in libraries and returns a copy of the module with tracing enabled
 */

function hooker(hookedFunc, options, callback) {
  if (!options.headers) {
    options.headers = {}
  }

  // Inject correlation ids into outgoing request
  const ids = ctx.correlationIds.getHeaders()
  options.headers = { ...ids, ...options.headers }

  return hookedFunc(options, res => {
    callback(res)
  })
}

// Names we add to module and map to hooked functions
const HOOKED_GET = '__getNod15c'
const HOOKED_REQ = '__requestNod15c'

/**
 * Hook http.get and http.request
 */
function installHttpHooks(module: HttpModule): void {
  module[HOOKED_REQ] = module.request
  module.request = function (options, callback) {
    return hooker(module[HOOKED_REQ], options, callback)
  }

  // Hook 'get'
  module[HOOKED_GET] = module.get
  module.get = function getHooked(options, callback) {
    return hooker(module[HOOKED_GET], options, callback)
  }
}

function hook(module: HttpModule): HttpModule {
  if (!module[HOOKED_REQ]) {
    // Not hooked yet so install now
    installHttpHooks(module)
  }
  return module
}

/**
 * Use this to instrument all http requests (instruments the http/https modules directly)
 *
 * Adds xray and correlation IDs
 */
export function instrumentGlobalHttps(): void {
  // https://forums.aws.amazon.com/thread.jspa?messageID=923601
  // https://docs.aws.amazon.com/xray-sdk-for-nodejs/latest/reference/module-http_p.html
  const traceDownstream = false
  for (const mod of [http, https]) {
    xray.captureHTTPsGlobal(mod, traceDownstream)
    hook(mod)
  }
}

/**
 * Use this to instrument at a finer-grained level (only for certain HTTP calls).
 *
 * If you are using a library like Axios you have to hook https globally or write
 * a wrapper around axios.
 *
 * Returns and instrumented copy of https module.
 *
 * Adds xray and correlation IDs
 *
 */
export function getInstrumentedHttps(): typeof https {
  // https://forums.aws.amazon.com/thread.jspa?messageID=923601
  // https://docs.aws.amazon.com/xray-sdk-for-nodejs/latest/reference/module-http_p.html
  const traceDownstream = false
  const httpsCopy = xray.captureHTTPs(https, traceDownstream)
  hook(https)
  return httpsCopy
}
