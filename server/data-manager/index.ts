import {Collection, ObjectID} from "mongodb";
const slugify = require('slugify');
const dbm = require('../database');

let accounts: Collection, users: Collection;

dbm.onceConnected((db) => {
    accounts = db.collection('accounts');
    accounts.createIndex({"projects.slug": 1});
}).catch((err)=>{
    console.log(err);
    process.exit(-2);
});

async function hasProject(userID: string, projectID: string) {
    return await accounts.countDocuments({name}, {limit: 1}) == 1;
}

async function createProject(userID: string, projectID: string): Promise<Boolean> {
    if (await hasProject(userID, projectID)) {
        throw new Error("Project is already created. Try a different name.");
    }
    await accounts.updateOne({"_id": new ObjectID(projectID)},{

    });
    // await projects.insertOne({
    //     ...new ProjectData({name})
    // });
    return true;
}

async function deleteProject(userID: string, projectID: string): Promise<boolean> {
    if (!await hasProject(name)) {
        throw new Error("Project does not exist, please try a different name.");
    }
    await projects.deleteOne({name});
    return true;
}

async function updateProject(userID: string, projectID: string, project: ProjectData): Promise<boolean> {
    if (await hasProject(name)) {
        throw new Error("Project does not exist, please try a different name.");
    }
    await projects.updateOne({name}, {$set: {name, ...project}});
    return true;
}

async function renameProject(userID: string, projectID: string, newName: string): Promise<boolean> {
    if (!await hasProject(oldName)) {
        throw new Error("Project does not exist, please try a different name.");
    }
    if (await hasProject(newName)) {
        throw new Error("Project is already created. Try a different name.");
    }
    await projects.updateOne({name: oldName}, {$set: {name: newName, slug: slugify(newName)}});
    return true;
}

async function getProjects(userID: string, seeHidden: boolean) {
    if (!seeHidden)
        return projects.find({visible: true}).toArray();
    else
        return projects.find().toArray();
}

async function getProject(userID: string, projectID: String, isAuth: boolean) {
    let project = await projects.findOne({slug: slug});
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

function getUsers(): Collection {
    return users;
}


module.exports = {
    ProjectData,
    getProjects,
    createProject,
    deleteProject,
    updateProject,
    renameProject,
    getProject,
};