const {AuthenticationError} = "apollo-server-errors";

const dbm = require('../database');

const { ApolloServer, gql } = require('apollo-server-express');
const {buildSchema} = require('graphql');
const token = require('./token');
const {getProject, getProjects, createProject, deleteProject, updateProject, ProjectData, renameProject} = require('../data-manager');


const typeDefs = gql`

    type User {
        name: String
        id: ID
        avatarUrl: String
        roles: [Role!]!
    }

    enum Role {
        USER,
        GUEST
    }

    input ProjectInput {
        description: String
        slug: String
        visible: Boolean
        name: String
    }

    type ProjectData {
        name: String!
        description: String
        slug: String!
        visible: Boolean!
    }

    type ProjectOps {
        create : Boolean!
        update(data : ProjectInput!) : Boolean!
        remove : Boolean!
    }

    # The "Query" type is special: it lists all of the available queries that
    # clients can execute, along with the return type for each. In this
    # case, the "books" query returns an array of zero or more Books (defined above).
    type Query {
        me: User!
        projects: [ProjectData!]!
        project(userID: String!, projectID: String!) : ProjectData
    }


    type Mutation {
        Project(userID : String!, projectID: String) : ProjectOps
    }
`;

const resolvers = {
    Mutation: {
        Project: (parent, args, context) =>{
            if(!context.user.roles.includes('USER') || !dbm.isConnected()){
                throw new AuthenticationError("");
            }
            return ({hasProjectID: (args.projectID),...args});
        }

    },
    Query: {
        me: (parent, args, context) =>{
            return context.user;
        },
        projects: (parent,args,context)=> {
            if(!dbm.isConnected())
                return null;
            return getProjects(context.user.roles.includes('USER'));
        },
        project: (parent, args, context) =>{
            if(!dbm.isConnected())
                return null;
            return getProject(args.slug,context.user.roles.includes('USER'))
        }
    },
    User: {
        avatarUrl: (parent, args, context) => {
            if(context.user.roles.includes('USER')){
                return `https://cdn.discordapp.com/avatars/${context.user.id}/${context.user.avatar}.png`;
            }
            else return null;
        }
    },
    ProjectOps: {
        create: (parent, args, context) => {
            return createProject(context.user.id, args.name);
        },
        remove: (parent, args, context) => {
            return deleteProject(context.user.id, parent.id);
        },
        update: (parent, args, context) =>{
            console.log(parent);
            return updateProject(context.user.id, parent.id,{...args.data});
        }
    }
};
// TODO Change Projects to use ids and change authorization to check and get database user.

const server = new ApolloServer({ typeDefs, resolvers, context: ({req})=>{
        if(req.headers.authorization) {
            try{
                let userVals = token.verify(req.headers.authorization);
                let roles = ;
                if(userVals.id === '217015504932438026')
                    roles.push('USER');
                return {user: {roles,...userVals}};
            } catch(e) {
                console.log(e);
            }
        }
        return {user: {roles: [], permissionLevel: 0}};
    }});

module.exports = server;

class Role {
    
}