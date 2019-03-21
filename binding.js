const { Binding: GraphQLBinding } = require('graphql-binding')
const { makeRemoteExecutableSchema } = require('graphql-tools')
const makeLink = require('./makeLink')

class Binding extends GraphQLBinding {
  constructor ({ endpoint, typeDefs, token, debug, mock }) {
    const link = makeLink({ endpoint, token, typeDefs, debug, mock })
    const schema = makeRemoteExecutableSchema({ link, schema: typeDefs })

    // Invoke the constructor of `Binding` with the remote schema
    super({
      schema: schema
    })
  }
}

module.exports = Binding
