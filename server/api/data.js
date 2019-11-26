const {User} = require("../role");
const dbm = require('../database');
const {ApolloServer, gql, AuthenticationError} = require('apollo-server-express');
const {buildSchema} = require('graphql');
const token = require('./token');
const {ProjectManager, AccountManager} = require('../data-manager');
const ObjectId = require('mongodb').ObjectId;
const {Role} = require('../role');

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
        project(projectID: String!) : ProjectData
    }


    type Mutation {
        Project(projectID: String) : ProjectOps
    }
`;

const resolvers = {
    Mutation: {
        Project: (parent, args, context) => {
            if (!context.user.roles.includes('USER') || !dbm.isConnected()) {
                throw new AuthenticationError("");
            }
            return ({hasProjectID: (args.projectID), ...args});
        }

    },
    Query: {
        me: (parent, args, context) => {
            return context.user;
        },
        projects: (parent, args, context) => {
            if (!dbm.isConnected())
                return null;
            return ProjectManager.get(context.id, context.equals(Role.USER));
        },
        project: (parent, args, context) => {
            if (!dbm.isConnected())
                return null;
            return ProjectManager.getOne(context.id, args.projectID, context.equals(Role.USER))
        }
    },
    User: {
        avatarUrl: (parent, args, context) => {
            if (context.equals(Role.USER)) {
                return "";
            } else return null;
        }
    },
    ProjectOps: {
        create: (parent, args, context) => {
            return ProjectManager.create(context.id, args.name);
        },
        remove: (parent, args, context) => {
            return ProjectManager.delete(context.id, parent.id);
        },
        update: (parent, args, context) => {
            console.log(parent);
            return ProjectManager.update(context.id, parent.id, {...args.data});
        }
    }
};
// TODO Change Projects to use ids and change authorization to check and get database user.

const server = new ApolloServer({
    typeDefs, resolvers, context: ({req}) => {
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

        // Valid OID Check
        let oid = new ObjectId(id);
        if(oid.toHexString() !== id || !AccountManager.has(oid)) {
            throw new AuthenticationError('Invalid ID')
        }
        return new User(oid, authenticated ? Role.USER : Role.GUEST);
    }
});

module.exports = server;

