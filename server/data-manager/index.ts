import {Collection, ObjectID} from "mongodb";

const slugify = require('slugify');
const dbm = require('../database');
const shortid = require('shortid');

let accounts: Collection;

dbm.onceConnected((db) => {
    accounts = db.collection('accounts');
    accounts.createIndex({"projects.slug": 1});
}).catch((err) => {
    console.log(err);
    process.exit(-2);
});

async function hasProject(accountID: ObjectID, projectID: string) {
    return await accounts.countDocuments({'_id': accountID, 'projects.id': projectID}, {limit: 1}) == 1;
}

async function createProject(accountID: ObjectID, name: string): Promise<Boolean> {
    let results = await accounts.updateOne(
        {
            "_id": accountID,
        }, {
            $push: {
                projects: {
                    id: shortid.generate(),
                    name
                }
            }
        });
    if(results.modifiedCount != 1) {
        throw new Error("Error... New Project Not Created");
    }
    return true;
}

async function deleteProject(accountID: ObjectID, projectID: string): Promise<boolean> {
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
    if(results.modifiedCount != 1){
        throw new Error("This project does not exist.");
    }
    return true;
}

async function updateProject(accountID: ObjectID, projectID: string, project: ProjectData): Promise<boolean> {
    let results = await accounts.updateOne({
        '_id': accountID,
        'project.id': projectID
    }, {
        $push: {
            'projects.$': {
                id: projectID,
                ...project
            }
        }
    });
    if(results.matchedCount != 1){
        throw new Error("This project does not exist.");
    }
    return true;
}

async function getProjects(accountID: ObjectID, seeHidden: boolean) {
    if (!seeHidden)
        return accounts.find({_id: accountID, 'projects.visible': true},{projection: {projects: 1, _id: 0}}).toArray();
    else
        return accounts.find({_id: accountID},{projection: {projects: 1, _id: 0}}).toArray();
}

async function getProject(accountID: ObjectID, projectID: String, isAuth: boolean) {
    let project = await accounts.findOne({_id: accountID});
    if (!project || (!isAuth && !project.visible))
        return null;
    return project;
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
    getProjects,
    createProject,
    deleteProject,
    updateProject,
    getProject,
};