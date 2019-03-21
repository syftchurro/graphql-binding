const { print } = require('graphql')
const { ApolloLink, split } = require('apollo-link')
const { WebSocketLink } = require('apollo-link-ws')
const { onError } = require('apollo-link-error')
const { SchemaLink } = require('apollo-link-schema')
const {
  makeExecutableSchema,
  addMockFunctionsToSchema
} = require('graphql-tools')
const ws = require('ws')
const { HTTPLinkDataloader } = require('http-link-dataloader')

module.exports = function makeLink ({ endpoint, typeDefs, token, debug, mock }) {
  let backendLink
  if (mock) {
    console.log()
    const schema = makeExecutableSchema({ typeDefs })
    addMockFunctionsToSchema({
      schema,
      mocks: {
        // random string
        ID: () => {
          return (
            Math.random()
              .toString(36)
              .substring(2, 15) +
            Math.random()
              .toString(36)
              .substring(2, 15)
          )
        }
      }
    })
    backendLink = new SchemaLink({
      schema
    })
  } else {
    const httpLink = new HTTPLinkDataloader({
      uri: endpoint,
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })

    // also works for https/wss
    const wsEndpoint = endpoint.replace(/^http/, 'ws')
    const wsLink = new WebSocketLink({
      uri: wsEndpoint,
      options: {
        reconnect: true,
        connectionParams: token
          ? {
            Authorization: `Bearer ${token}`
          }
          : {},
        lazy: true,
        inactivityTimeout: 30000
      },
      webSocketImpl: ws
    })

    backendLink = split(op => isSubscription(op), wsLink, httpLink)
  }
  const reportErrors = onError(({ graphQLErrors, networkError }) => {
    if (graphQLErrors) {
      graphQLErrors.map(({ message, locations, path }) =>
        console.log(
          `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
        )
      )
    }
    if (networkError) console.log(`[Network error]: ${networkError}`)
  })

  if (debug) {
    const debugLink = new ApolloLink((operation, forward) => {
      console.log(`Request to ${endpoint}:`)
      console.log(`query:`)
      console.log(print(operation.query).trim())
      console.log(`operationName: ${operation.operationName}`)
      console.log(`variables:`)
      console.log(JSON.stringify(operation.variables, null, 2))

      return forward(operation).map(data => {
        console.log(`Response from ${endpoint}:`)
        console.log(JSON.stringify(data.data, null, 2))
        return data
      })
    })

    return ApolloLink.from([debugLink, reportErrors, backendLink])
  } else {
    return ApolloLink.from([reportErrors, backendLink])
  }
}

function isSubscription (operation) {
  const selectedOperation = getSelectedOperation(operation)
  if (selectedOperation) {
    return selectedOperation.operation === 'subscription'
  }
  return false
}

function getSelectedOperation (operation) {
  if (operation.query.definitions.length === 1) {
    return operation.query.definitions[0]
  }

  return operation.query.definitions.find(
    d =>
      d.kind === 'OperationDefinition' &&
      !!d.name &&
      d.name.value === operation.operationName
  )
}
