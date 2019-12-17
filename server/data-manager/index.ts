import {Collection, ObjectID} from "mongodb";
import {AuthService} from '../api/auth';

const slugify = require('slugify');
const dbm = require('../database');
const shortid = require('shortid');

let accounts: Collection, users: Collection, settings: Collection;

dbm.onceConnected((db) => {
    accounts = db.collection('accounts');
    accounts.createIndex({"projects.id": 1});

    users = db.collection('users');
    users.createIndex({
        "connections": 1
    });

    settings = db.collection('settings');
    settings.createIndex({
        "name": 1
    })
});

class SettingsManager {
    whitelist = new WhitelistManager();

}

class WhitelistManager {
    constructor() {
        dbm.onceConnected(()=>this.init());
    }

    private async init(){
        if (await settings.countDocuments({name: 'whitelist'},{limit: 1}) != 1)
            settings.insertOne({
                name: 'whitelist',
                status: false,
                list: []
            });
    }

    async has(id: string) : Promise<boolean> {
        return false; // TODO
    }

    async set(status: boolean){
        const results = await settings.updateOne({name: 'whitelist'},{$set: {status: status}});
        return results.matchedCount == 1;
    }

    async status(): Promise<boolean> {
        const whitelist = await settings.findOne({name:'whitelist'});
        return whitelist.status;
    }

    async add(name: string, id: string){
        const results = await settings.updateOne({name: 'whitelist'},{$push: {list: {name, id}}});
        return results.modifiedCount == 1;
    }

    async remove(id: string){
        const results = await settings.updateOne({name: 'whitelist'},{$pull: {list: {id}}});
        return results.modifiedCount == 1;
    }

    async getList(){
        const whitelist = await settings.findOne({name:'whitelist'});
        return whitelist.list;
    }
}

/// Account Management
class AccountManager {
    async has(accountID: ObjectID) {
        return await accounts.countDocuments({'_id': accountID}, {limit: 1}) == 1;
    }

    async create(service: AuthService, userInfo: any): Promise<String> {
        let accountInfo = service.extractInfo(userInfo);
        if (await this.hasUser(service.name, userInfo.id))
            return await this.get(service.name, userInfo.id);
        let accountResult = await accounts.insertOne({
            projects: [],
            role: 'USER',
            ...accountInfo
        });

        await users.insertOne({
            accountID: accountResult.insertedId,
            connections: [{type: service.name, id: userInfo.id}]
        });
        return accountResult.insertedId.toHexString();
    }

    private async hasUser(type: string, id: string) {
        return await users.countDocuments({
            connections: {
                type,
                id
            }
        }, {limit: 1}) == 1;
    }

    async get(service: string, id: string) {
        let result = await users.findOne({
            connections: {
                type: service,
                id: id,
            }
        }, {
            projection: {
                accountID: 1,
                _id: 0
            }
        });
        if (result)
            return result.accountID;
        return null;
    }

    async getProperties(accountID: ObjectID, properties: string[]) {
        let values = {};
        properties.forEach(p => values[p] = 1);
        return await accounts.findOne({
            _id: accountID
        }, {
            projection: {
                _id: 0,
                ...values
            }
        })
    }

    async getRole(accountID: ObjectID) : Promise<string> {
        const results = await accounts.findOne({_id: accountID}, {projection: {role: 1}});
        return results.role;
    }

}

export interface AccountInfo {
    name: string;
    avatar: string;
}


/// Project Management
class ProjectManager {
    async has(accountID: ObjectID, projectID: string) {
        return await accounts.countDocuments({'_id': accountID, 'projects.id': projectID}, {limit: 1}) == 1;
    }

    async create(accountID: ObjectID, name: string): Promise<Boolean> {
        let results = await accounts.updateOne(
            {
                "_id": accountID,
            }, {
                $push: {
                    projects: {
                        id: shortid.generate(),
                        name,
                        visible: false
                    }
                }
            });
        if (results.modifiedCount != 1) {
            throw new Error("Error... New Project Not Created");
        }
        return true;
    }

    async delete(accountID: ObjectID, projectID: string): Promise<boolean> {
        let results = await accounts.updateOne(
            {'_id': accountID},
            {
                $pull: {
                    'projects': {
                        id: projectID
                    }
                }
            }
        );
        if (results.modifiedCount != 1) {
            throw new Error("This project does not exist.");
        }
        return true;
    }

    async update(accountID: ObjectID, projectID: string, project: any): Promise<boolean> {
        let projChanges = {};
        Object.keys(project).forEach((key) => {
            projChanges['projects.$.' + key] = project[key];
        });
        let results = await accounts.updateOne({
            '_id': accountID,
            'projects.id': projectID
        }, {
            $set: {
                ...projChanges
            }
        });
        if (results.matchedCount != 1) {
            throw new Error("This project does not exist.");
        }
        return true;
    }

    async get(accountID: ObjectID, seeHidden: boolean) {
        if (!seeHidden) {
            let result = await accounts.aggregate([
                {
                    '$match': {
                        '_id': accountID
                    }
                }, {
                    '$project': {
                        'projects': {
                            '$filter': {
                                'input': '$projects',
                                'as': 'project',
                                'cond': {
                                    '$eq': [
                                        '$$project.visible', true
                                    ]
                                }
                            }
                        },
                        '_id': 0
                    }
                }
            ]).next();
            return result.projects;
        } else {
            let result = await accounts.findOne({_id: accountID}, {projection: {projects: 1, _id: 0}});
            return result.projects;
        }
    }

    async getOne(accountID: ObjectID, projectID: String, isAuth: boolean) {
        let result = await accounts.findOne({_id: accountID},
            {
                projection: {
                    _id: 0,
                    projects: {
                        '$elemMatch': {
                            id: projectID
                        }
                    }
                }
            }
        );
        if (!result.projects || (!isAuth && !result.projects[0].visible))
            throw new Error('Project does not exist.');

        return result.projects[0];
    }
}


class Status {
    completed: boolean;
    message: string;

    constructor(completed: boolean, message?: string) {
        this.completed = completed;
        this.message = message;
    }

}

class ProjectData {
    constructor(obj) {
        Object.assign(this, obj);
        if (!this.slug) {
            this.slug = slugify(this.name);
        }
    }

    name: string;
    description: string;
    slug: string;
    visible: boolean = false;
}


module.exports = {
    ProjectData,
    ProjectManager: new ProjectManager(),
    AccountManager: new AccountManager(),
    SettingsManager: new SettingsManager(),
};