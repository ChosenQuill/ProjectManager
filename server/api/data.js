const {User} = require("../role");
const dbm = require('../database');
const {ApolloServer, gql, AuthenticationError} = require('apollo-server-express');
const {buildSchema} = require('graphql');
const token = require('./token');
const {ProjectManager, AccountManager} = require('../data-manager');
const ObjectId = require('mongodb').ObjectId;
const {Role, Permission} = require('../role');

const typeDefs = gql`

    type User {
        name: String
        id: ID
        avatarUrl: String
        role: Role!
    }

    type Role {
        name: String!
        allNames: [String]!
        permissions: [String]!
    }

    input ProjectInput {
        name: String
        description: String
        visible: Boolean
    }

    type ProjectData {
        id: String!
        name: String!
        description: String
        visible: Boolean!
    }

    type ProjectOps {
        create(name: String!) : Boolean!
        update(data : ProjectInput!) : Boolean!
        remove : Boolean!
    }

    # The "Query" type is special: it lists all of the available queries that
    # clients can execute, along with the return type for each. In this
    # case, the "books" query returns an array of zero or more Books (defined above).
    type Query {
        me: User!
        projects: [ProjectData!]!
        project(projectID: String!) : ProjectData
    }


    type Mutation {
        Project(projectID: String) : ProjectOps
    }
`;

const resolvers = {
    Mutation: {
        Project: (parent, args, context) => {
            return ({hasProjectID: (args.projectID), ...args});
        }
    },
    Query: {
        me: (parent, args, context) => {
            if (!context.role.has(Permission.ACCESS_PROFILE))
                throw new AuthenticationError('You cannot perform this action.');
            return {};
        },
        projects: (parent, args, context) => {
            return ProjectManager.get(context.id, context.role.has(Permission.VIEW_ALL_PROJECTS));
        },
        project: (parent, args, context) => {
            return ProjectManager.getOne(context.id, args.projectID, context.role.has(Permission.VIEW_ALL_PROJECTS))
        }
    },
    User: {
        name: async (parent, args, context) => {
            let result = await AccountManager.getProperties(context.id, ['name']);
            console.log(result);
            return result.name;
        },
        avatarUrl: async (parent, args, context) => {
            let result = await AccountManager.getProperties(context.id, ['avatar']);
            return result.avatar;
        },
        role: (parent, args, context) => {
            return context.role;
        },
        id: (parent, args, context) => {
            return context.id.toHexString();
        }
    },
    ProjectOps: {
        create: (parent, args, context) => {
            if (!context.role.has(Permission.CREATE_PROJECT))
                throw new AuthenticationError('You cannot perform this action.');
            return ProjectManager.create(context.id, args.name);
        },
        remove: (parent, args, context) => {
            if (!context.role.has(Permission.DELETE_PROJECT))
                throw new AuthenticationError('You cannot perform this action.');
            if (!parent.hasProjectID)
                throw new Error('Invalid Request');
            return ProjectManager.delete(context.id, parent.projectID);
        },
        update: (parent, args, context) => {
            if (!context.role.has(Permission.UPDATE_PROJECT))
                throw new AuthenticationError('You cannot perform this action.');
            if (!parent.hasProjectID)
                throw new Error('Invalid Request');
            return ProjectManager.update(context.id, parent.projectID, {...args.data});
        }
    }
};


const server = new ApolloServer({
    typeDefs, resolvers, context: async ({req}) => {
        //ID Grab + Authentication Check
        let id, authenticated = false;
        if (req.headers.identity) {
            id = req.headers.identity;
        }
        if (req.headers.authorization) {
            let userVals = token.verify(req.headers.authorization);
            id = userVals.id;
            authenticated = true;
        } else {
            throw new AuthenticationError("Must either have an identity or authorization token.");
        }

        if (!dbm.isConnected()) {
            throw Error('Database Not Online');
        }

        // Valid OID Check
        let oid = new ObjectId(id);
        if (oid.toHexString() !== id || !await AccountManager.has(oid)) {
            throw new AuthenticationError('Invalid ID');
        }
        return new User(oid, authenticated ? Role.USER : Role.GUEST);
    }
});

module.exports = server;

