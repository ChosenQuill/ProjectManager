import {ObjectId} from "mongodb";

const Permission = {
    //Projects
    CREATE_PROJECT: 'CREATE_PROJECT',
    DELETE_PROJECT: 'DELETE_PROJECT',
    UPDATE_PROJECT: 'UPDATE_PROJECT',
    VIEW_PUBLIC_PROJECTS: 'VIEW_PUBLIC_PROJECTS',
    VIEW_ALL_PROJECTS: 'VIEW_ALL_PROJECTS',

    ACCESS_PROFILE: 'ACCESS_PROFILE'
};

class Role {
    public static GUEST: Role = new Role('GUEST', [Permission.VIEW_PUBLIC_PROJECTS]);
    public static USER: Role = new Role('USER', [Permission.CREATE_PROJECT, Permission.DELETE_PROJECT, Permission.UPDATE_PROJECT, Permission.VIEW_ALL_PROJECTS, Permission.VIEW_PUBLIC_PROJECTS, Permission.ACCESS_PROFILE]);

    public readonly name: string;
    private permissions: string[];

    private constructor(name: string, permissions: string[]) {
        this.name = name;
        this.permissions = permissions;
    }

    public has(permission: string) {
        return this.permissions.includes(permission);
    }

    equals(otherRole: Role) {
        return otherRole.name === this.name;
    }
}

class User {
    public readonly id: ObjectId;
    public readonly role: Role;

    public constructor(id: ObjectId, role: Role) {
        this.id = id;
        this.role = role;
    }
}

module.exports = {
    User,
    Role,
    Permission
};