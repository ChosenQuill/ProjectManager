const fs = require('fs');


let ProjectList = {};

try{
    if(fs.existsSync('projectList.json')){
        ProjectList = JSON.parse(fs.readFileSync('projectList.json'));
    } else {
        fs.writeFileSync('projectList.json',ProjectList);
    }
} catch (e){
    console.log("Error Creating ProjectList: ", e);
}

function createProject(name: string, project: Project) : Status {
    if(ProjectList[name]){
        return new Status(false,"Project is already created. Try a different name.");
    }
    ProjectList[name] = project;
    return new Status(true);
}

function deleteProject(name: string) : Status {
    if(ProjectList[name]) {
        delete ProjectList[name];
        return new Status(true);
    }
    return new Status(false, "Project does not exist, please try a different name.");
}

function updateProject(name: string, project: Project) : Status {
    if(!ProjectList[name]) {
        return new Status(false,"Project does not exist, please try a different name.");
    }
    ProjectList[name] = project;
    return new Status(true);
}


class Status {
    completed: boolean;
    message: string;
    constructor(completed : boolean, message? : string) {
        this.completed = completed;
        this.message = message;
    }

}

class Project {
    description: String;

    constructor(name: String, description: String) {
        this.description = description;
    }
}


module.exports = {
    Project,
    ProjectList,
    createProject,
    deleteProject,
    updateProject,
};