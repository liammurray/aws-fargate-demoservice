import { getLogger, getCorrelationIds } from './globals'
import http from 'http'

// function recordMetrics = ({ status }) => {
//   const end = Date.now()
//   const latency = end - start

//   metricTags.push(`statusCode:${status}`)

//   Metrics.histogram(`${metricName}.latency`, latency, metricTags)
//   Metrics.increment(`${metricName}.${status}`, 1, metricTags)
// }

//https://github.com/aws/aws-xray-sdk-node/blob/master/packages/core/lib/patchers/http_p.js

function hooker(hookedFunc, options, callback) {
  getLogger().info('Hooker (before)')
  // if (!options.headers) options.headers = {}

  return hookedFunc(options, res => {
    getLogger().info('Hooker (after)')
    callback(res)
  })
}

/**
 * Hook http.get and http.request
 */
function installHttpHooks(module) {
  module.__requestHooked = module.request
  module.request = function(options, callback) {
    return hooker(module.__requestHooked, options, callback)
  }

  module.__getHooked = module.get
  module.get = function getHooked(options, callback) {
    return hooker(module.__getHooked, options, callback)
  }
}

function hookHttp(module) {
  if (!module.__requestHooked) {
    installHttpHooks(module)
  }
}
hookHttp(http)
