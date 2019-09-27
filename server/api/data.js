const { ApolloServer, gql } = require('apollo-server-express');
const {buildSchema} = require('graphql');
const token = require('./token');

const typeDefs = gql`
  # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.

  # This "Book" type defines the queryable fields for every book in our data source.
  type Book {
    title: String
    author: String
  }
  
  type User {
      name: String
      id: ID
      avatarUrl: String
      roles: [Role!]!
      permissionLevel: Int!
  }
  
  enum Role {
      MEMBER,
      ADMIN
  }

  # The "Query" type is special: it lists all of the available queries that
  # clients can execute, along with the return type for each. In this
  # case, the "books" query returns an array of zero or more Books (defined above).
  type Query {
      me: User!
    books: [Book]
  }
`;

const books = [
    {
        title: 'Harry Potter and the Chamber of Secrets',
        author: 'J.K. Rowling',
    },
    {
        title: 'Jurassic Park',
        author: 'Michael Crichton',
    },
];

const resolvers = {
    Query: {
        books: () => books,
        me: (parent, args, context) =>{
            return context.user;
        },
    },
    User: {
        avatarUrl: (parent, args, context) => {
            if(context.user.roles.includes('MEMBER')){
                return `https://cdn.discordapp.com/avatars/${context.user.id}/${context.user.avatar}.png`;
            }
            else return null;
        }
    }
};

const server = new ApolloServer({ typeDefs, resolvers, context: ({req})=>{
        if(req.headers.authorization) {
            try{
                let userVals = token.verify(req.headers.authorization);
                let roles = ['MEMBER'];
                if(userVals.id === '217015504932438026')
                    roles.push('ADMIN');
                return {user: {roles,...userVals}};
            } catch(e){
                console.log(e);
            }
        }
        return {user: {roles: [], permissionLevel: 0}};
    }});

module.exports = server;