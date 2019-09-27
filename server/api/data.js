const { ApolloServer, gql } = require('apollo-server-express');
const {buildSchema} = require('graphql');
const token = require('./token');
const {ProjectList} = require('../data-manager');

const typeDefs = gql`
    # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.

    # This "Book" type defines the queryable fields for every book in our data source.
    type Book {
        title: String
        author: String
    }

    type Project {
        name: String
        description: String
    }
    
    type Status {
        completed: Boolean!
        message: String
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
        projects: [Project!]!
    }
    
    input ProjectData {
        description: String
    }

    type ProjectOps {
        create(data : ProjectData) : Status!
        update(data : ProjectData) : Status!
        remove : Status!
    }

    type Mutation {
        Project(name: String) : ProjectOps
        test(var: String) : String
    }
`;

const resolvers = {
    Mutation: {
        test: (parent, args, context) => {
            console.log(parent,args,context);
            return args.var;
        },
        Project: (parent, args, context) =>{
            if(!context.user.roles.includes('ADMIN')){
                return null;
            }
            return ({name: args.name});
        }

    },
    Query: {
        me: (parent, args, context) =>{
            return context.user;
        },
        projects: ()=> ProjectList,
    },
    User: {
        avatarUrl: (parent, args, context) => {
            if(context.user.roles.includes('MEMBER')){
                return `https://cdn.discordapp.com/avatars/${context.user.id}/${context.user.avatar}.png`;
            }
            else return null;
        }
    },
    ProjectOps: {
        create: (parent, args, context) => {
            return createProject(parent.name, new Project(...args.data));

        },
        remove: (parent, args, context) => {
            return true;
        }
    },
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