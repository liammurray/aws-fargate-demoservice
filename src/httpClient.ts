// function recordMetrics = ({ status }) => {
//   const end = Date.now()
//   const latency = end - start

//   metricTags.push(`statusCode:${status}`)

//   Metrics.histogram(`${metricName}.latency`, latency, metricTags)
//   Metrics.increment(`${metricName}.${status}`, 1, metricTags)
// }
