const fs = require('fs');

let ProjectList = {};
let ProjectArray = {};
let changeMade : boolean = true;

try {
    if (fs.existsSync('projectList.json')) {
        ProjectList = JSON.parse(fs.readFileSync('projectList.json'));
        projectArray();
    } else {
        writeUpdate();
    }
} catch (e) {
    console.log("Error Creating ProjectList: ", e);
}

function createProject(name: string, project: ProjectData): Status {
    if (ProjectList[name]) {
        return new Status(false, "Project is already created. Try a different name.");
    }
    ProjectList[name] = project;
    changeMade = true;
    writeUpdate();
    return new Status(true);
}

function deleteProject(name: string): Status {
    if (!ProjectList[name]) {
        return new Status(false, "Project does not exist, please try a different name.");
    }
    delete ProjectList[name];
    changeMade = true;
    writeUpdate();
    return new Status(true);
}

function updateProject(name: string, project: ProjectData): Status {
    if (!ProjectList[name]) {
        return new Status(false, "Project does not exist, please try a different name.");
    }
    ProjectList[name] = project;
    changeMade = true;
    writeUpdate();
    return new Status(true);
}

function renameProject(oldName: string,newName: string): Status {
    if (!ProjectList[oldName]) {
        return new Status(false, "Project does not exist, please try a different name.");
    }
    if (ProjectList[newName]) {
        return new Status(false, "Project is already created. Try a different name.");
    }
    ProjectList[newName] = ProjectList[oldName];
    delete ProjectList[oldName];
}

function writeUpdate(){
    fs.writeFileSync('projectList.json',JSON.stringify(ProjectList));
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
    description: String;
    constructor(description?: String) {
        this.description = description;
    }
}


function projectArray(){
    if(changeMade){
        ProjectArray = Object.keys(ProjectList).map((key)=>{
            console.log({name: key,...ProjectList[key]});
            return {name: key,...ProjectList[key]}
        });
        changeMade = false;
    }
    return ProjectArray
}

module.exports = {
    ProjectData,
    ProjectList,
    createProject,
    deleteProject,
    updateProject,
    renameProject,
    projectArray
};