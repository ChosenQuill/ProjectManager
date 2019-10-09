const { ApolloServer, gql } = require('apollo-server-express');
const {buildSchema} = require('graphql');
const token = require('./token');
const {ProjectList, createProject, deleteProject, updateProject, projectArray, ProjectData} = require('../data-manager');

const typeDefs = gql`
    # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.

    # This "Book" type defines the queryable fields for every book in our data source.
    type Book {
        title: String
        author: String
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
    }

    enum Role {
        MEMBER,
        ADMIN
    }

    input ProjectInput {
        description: String
    }

    type ProjectData {
        name: String
        description: String
    }

    type ProjectOps {
        rename(name : String) : Status!
        create(data : ProjectInput) : Status!
        update(data : ProjectInput) : Status!
        remove : Status!
    }

    # The "Query" type is special: it lists all of the available queries that
    # clients can execute, along with the return type for each. In this
    # case, the "books" query returns an array of zero or more Books (defined above).
    type Query {
        me: User!
        projects: [ProjectData!]!
    }


    type Mutation {
        Project(name: String) : ProjectOps
    }
`;

const resolvers = {
    Mutation: {
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
        projects: ()=> {
            return projectArray();
        },
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
            return createProject(parent.name, new ProjectData(args.data.description));
        },
        remove: (parent, args, context) => {
            return deleteProject(parent.name);
        },
        update: (parent, args, context) =>{
            return updateProject(parent.name, new ProjectData(args.data.description));
        },
        rename: (parent, args, context) =>{
            return renameProject(parent.name, args.name);
        }
    },
    ProjectData: (parent, args, context) =>{
        console.log(parent,args,context);
        return null;
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
            } catch(e) {
                console.log(e);
            }
        }
        return {user: {roles: [], permissionLevel: 0}};
    }});

module.exports = server;