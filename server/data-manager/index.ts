import {Collection} from "mongodb";

const slugify = require('slugify');
const dbm = require('../database');



let projects : Collection;
dbm.connect((err,db)=>{
    projects = db.collection('projects');
});


async function hasProject(name: string) {
    return await projects.countDocuments({name}, {limit: 1}) == 1;
}

async function createProject(name: string, project: ProjectData): Promise<Status> {
    if (await hasProject(name)) {
        return new Status(false, "Project is already created. Try a different name.");
    }
    await projects.insertOne({
        name,
        ...project,
        visible: project.visible
    });
    return new Status(true);
}

async function deleteProject(name: string): Promise<Status> {
    if (await hasProject(name)) {
        return new Status(false, "Project does not exist, please try a different name.");
    }
    await projects.deleteOne({name});
    return new Status(true);
}

async function updateProject(name: string, project: ProjectData): Promise<Status> {
    if (await hasProject(name)) {
        return new Status(false, "Project does not exist, please try a different name.");
    }
    await projects.updateOne({name},{name,...project});
    return new Status(true);
}

async function renameProject(oldName: string,newName: string): Promise<Status> {
    if (!await hasProject(name)) {
        return new Status(false, "Project does not exist, please try a different name.");
    }
    if (await hasProject(newName)) {
        return new Status(false, "Project is already created. Try a different name.");
    }
    await projects.updateOne({name},{name: newName});
}

async function getProjects(seeHidden: boolean){
    if(!seeHidden)
        return projects.find({visible: true}).toArray();
    else
        return projects.find().toArray();
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
        if(!this.slug){
            this.slug = slugify(this.name);
        }
    }
    name: string;
    description: string;
    slug: string;
    visible: boolean = true;
}


module.exports = {
    ProjectData,
    getProjects,
    createProject,
    deleteProject,
    updateProject,
    renameProject,
};