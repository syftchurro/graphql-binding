const { Binding: GraphQLBinding } = require('graphql-binding')
const { makeRemoteExecutableSchema } = require('graphql-tools')
const makeLink = require('./makeLink')

class Binding extends GraphQLBinding {
  constructor ({ endpoint, typeDefs, token, debug }) {
    const link = makeLink({ endpoint, token, debug })
    const schema = makeRemoteExecutableSchema({ link, schema: typeDefs })

    // Invoke the constructor of `Binding` with the remote schema
    super({
      schema: schema
    })
  }
}

module.exports = Binding
