const dbm = require('../database');

const { ApolloServer, gql } = require('apollo-server-express');
const {buildSchema} = require('graphql');
const token = require('./token');
const {getProjects, createProject, deleteProject, updateProject, projectArray, ProjectData, renameProject} = require('../data-manager');


const typeDefs = gql`

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
        slug: String
        visible: Boolean
    }

    type ProjectData {
        name: String!
        description: String
        slug: String!
        visible: Boolean!
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
        Project(name: String!) : ProjectOps
    }
`;

const resolvers = {
    Mutation: {
        Project: (parent, args, context) =>{
            if(!context.user.roles.includes('ADMIN') || !dbm.isConnected()){
                return null;
            }
            return ({name: args.name});
        }

    },
    Query: {
        me: (parent, args, context) =>{
            return context.user;
        },
        projects: (parent,args,context)=> {
            if(!dbm.isConnected())
                return null;
            return getProjects(context.user.roles.includes('ADMIN'));
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
            return createProject(parent.name, new ProjectData({name: parent.name,...args.data}));
        },
        remove: (parent, args, context) => {
            return deleteProject(parent.name);
        },
        update: (parent, args, context) =>{
            return updateProject(parent.name, new ProjectData({name: parent.name,...args.data}));
        },
        rename: (parent, args, context) =>{
            return renameProject(parent.name, args.name);
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
            } catch(e) {
                console.log(e);
            }
        }
        return {user: {roles: [], permissionLevel: 0}};
    }});

module.exports = server;