// const schemaHooks = ['save', 'update', 'findOneAndUpdate']

// export const plugin: Mongoose$SchemaPlugin<void> = schema => {
//   if (WRAP_CALLBACK) {
//     schema.statics.$wrapCallback = wrapCallback
//   }

//   schemaHooks.forEach(hook => {
//     schema.pre(hook, async function() {
//       if (tracingEnabled) {
//         tracePre(this, hook)
//       }
//     })
//     schema.post(hook, async function() {
//       if (tracingEnabled) {
//         tracePost(this, hook)
//       }
//     })
//   })
// }
