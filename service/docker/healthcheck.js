const http = require('http')
const path = require('path')
const url = require('url')

//
// Checks for 200 status code
//
// Example usage:
//
// node healthcheck.js localhost:<PORT>/healthcheck
//
// This is intended to be run by docker HEALTHCHECK.
//
// https://docs.docker.com/engine/reference/builder/#healthcheck
//

const args = process.argv.slice(2)
if (args.length < 1) {
  const app = path.basename(process.argv[1])
  console.log('Performs simple healthcheck (looks for 200 response within timeout)')
  console.error('Usage: node ${app} <url>')
  process.exit(-1)
}

//let options = new URL(args[0])
let options = url.parse(args[0])
// Timeout should be longer than anything we reasonable set for the healthcheck
options.timeout = 2000

//console.log(JSON.stringify(options, null, 2))
const request = http.request(options, res => {
  console.log(`STATUS: ${res.statusCode}`)
  if (res.statusCode == 200) {
    process.exit(0)
  } else {
    process.exit(1)
  }
})

request.on('error', function(err) {
  console.log('ERROR')
  process.exit(1)
})

request.end()
