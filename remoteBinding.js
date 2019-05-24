const fetch = require('node-fetch')
const { HttpLink } = require('apollo-link-http')
const { introspectSchema } = require('graphql-tools')
const Binding = require('./binding')

const remoteBinding = (uri, mock = false) => {
  const link = new HttpLink({
    uri,
    fetch
  })
  return introspectSchema(link)
    .then(typeDefs => {
      return new Binding({
        endpoint: uri,
        typeDefs,
        mock
      })
    })
    .catch(err => {
      throw err 
    })
}

module.exports = remoteBinding
