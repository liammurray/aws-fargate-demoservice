/* eslint-disable @typescript-eslint/no-var-requires */
import ctx from '~/globals'

/**
 * patches the HTTP and HTTPS node built-in libraries and returns a copy of the module with tracing enabled
 */

function hooker(hookedFunc, options, callback) {
  // ctx.logger.info('Hooker (before)')

  if (!options.headers) {
    options.headers = {}
  }

  // Inject correlation IDS into outgoing request
  const ids = ctx.correlationIds.getHeaders()
  options.headers = { ...ids, ...options.headers }

  return hookedFunc(options, res => {
    // ctx.logger.info('Hooker (after)')
    callback(res)
  })
}

// Names we add to module and map to hooked functions
const HOOKED_GET = '__getNod15c'
const HOOKED_REQ = '__requestNod15c'

/**
 * Hook http.get and http.request
 */
function installHttpHooks(module): void {
  // Hook 'request'
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

function hook(module) {
  if (!module[HOOKED_REQ]) {
    // Not hooked yet so install now
    installHttpHooks(module)
  }
  return module
}

export default function hookHttp() {
  hook(require('http'))
  hook(require('https'))
}
