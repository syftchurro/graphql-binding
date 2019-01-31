const fetch = require('node-fetch')
const { HttpLink } = require('apollo-link-http')
const { introspectSchema } = require('graphql-tools')
const Binding = require('./binding')

const remoteBinding = uri => {
  const link = new HttpLink({
    uri,
    fetch
  })
  return introspectSchema(link)
    .then(typeDefs => {
      return new Binding({
        endpoint: uri,
        typeDefs
      })
    })
    .catch(err => console.error(err))
}

module.exports = remoteBinding
