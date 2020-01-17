import {ObjectId} from "mongodb";
import {flatMap} from 'lodash';

const Permission = {
    //Projects
    CREATE_PROJECT: 'CREATE_PROJECT',
    DELETE_PROJECT: 'DELETE_PROJECT',
    UPDATE_PROJECT: 'UPDATE_PROJECT',
    VIEW_PUBLIC_PROJECTS: 'VIEW_PUBLIC_PROJECTS',
    VIEW_ALL_PROJECTS: 'VIEW_ALL_PROJECTS',

    ACCESS_PROFILE: 'ACCESS_PROFILE',
    CHANGE_USER_SETTINGS: 'CHANGE_USER_SETTINGS',

    MODIFY_WHITELIST: 'MODIFY_WHITELIST'
};

class Role {
    public static GUEST: Role = new Role('GUEST', [Permission.VIEW_PUBLIC_PROJECTS]);
    public static USER: Role = new Role('USER', [Permission.CREATE_PROJECT, Permission.DELETE_PROJECT,
        Permission.UPDATE_PROJECT, Permission.VIEW_ALL_PROJECTS, Permission.ACCESS_PROFILE, Permission.CHANGE_USER_SETTINGS], [Role.GUEST]);
    public static ADMIN: Role = new Role('ADMIN',[Permission.MODIFY_WHITELIST],[Role.USER]);

    public readonly name: string;
    private readonly rolePermissions: string[];
    private readonly permissions: string[];
    private readonly inherit: Role[];
    public readonly allNames: string[];

    private constructor(name: string, rolePermissions: string[], inherit: Role[] = []) {
        this.name = name;
        this.inherit = inherit;
        this.rolePermissions = rolePermissions;
        this.permissions = this.getAllPermissions();
        this.allNames = this.getAllNames();
    }

    public has(permission: string) {
        return this.permissions.includes(permission);
    }

    private getAllPermissions(){
        return this.rolePermissions.concat(flatMap(this.inherit, (role=>role.getAllPermissions())));
    }

    private getAllNames(){
        return [this.name].concat(flatMap(this.inherit, (role=>role.getAllNames())));
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