const {User} = require("../role");
const dbm = require('../database');
const {ApolloServer, gql, AuthenticationError} = require('apollo-server-express');
const {buildSchema} = require('graphql');
const token = require('./token');
const {ProjectManager, AccountManager, SettingsManager} = require('../data-manager');
const ObjectId = require('mongodb').ObjectId;
const {Role, Permission} = require('../role');

const typeDefs = gql`

    type Query {
        me: User!
        projects: [ProjectData!]!
        project(projectID: String!) : ProjectData
    }

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

    type ProjectData {
        id: String!
        name: String!
        description: String
        visible: Boolean!
    }

    # Mutations
    type Mutation {
        Project(projectID: String) : ProjectOps!
        User: UserOps!
        Server : ServerOps!
    }

    type ProjectOps {
        create(name: String!) : Boolean!
        update(data : ProjectInput!) : Boolean!
        remove : Boolean!
    }

    input ProjectInput {
        name: String
        description: String
        visible: Boolean
    }

    type ServerOps {
        Whitelist: WhitelistOps!
    }

    type WhitelistOps {
        set(status: Boolean!) : Boolean!
        add(name: String!, userID: String!) : Boolean!
        remove(userID: String!) : Boolean!
        list : [WhitelistEntry!]!
    }
    
    type WhitelistEntry {
        name: String!
        id: String!
    }
    
    type UserOps {
        delete(confirm: Boolean!) : Boolean!
    }
`;

const resolvers = {
    Mutation: {
        Project: (parent, args, context) => {
            return ({hasProjectID: (args.projectID), ...args});
        },
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
    },
    WhitelistOps: (parent, args, context) => {
        if(!context.role.has(Permission.MODIFY_WHITELIST))
            throw new AuthenticationError('You cannot perform this action.');
        return {
            set: (parent, args) => SettingsManager.whitelist.set(args.status),
            add: (parent, args) => SettingsManager.whitelist.add(args.name,args.userID),
            remove: (parent, args) => SettingsManager.whitelist.remove(args.userID),
            list: () => SettingsManager.whitelist.getList()
        };
    },
    UserOps: (parent, args, context) => {
        if(!context.role.allNames.includes('USER'))
            throw new AuthenticationError('You cannot perform this action.');
        return {
            delete: (parent, args) => AccountManager.deleteAccount(context.accountID, args.confirm),
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
        if (oid.toHexString() !== id) {
            throw new AuthenticationError('Invalid ID');
        }
        let role = await AccountManager.getRole(oid);
        if(!role){
            console.log('invalid id')
            throw new AuthenticationError('Invalid ID');
        }

        return new User(oid, authenticated ? Role[role] : Role.GUEST);
    }
});

module.exports = server;

