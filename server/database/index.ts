import {Db} from "mongodb";

// const {Db} = require("mongodb");


const MongoClient = require('mongodb').MongoClient;

const url = 'mongodb://localhost:27017';

// Database Name
const dbName = 'pm';

// Create a new MongoClient
const client = new MongoClient(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

let db : Db;
const connect = () : Promise<Db> => {
    return new Promise(((resolve, reject) => {
        client.connect((err) => {
            if(err){
                console.log("Error connecting to the database: " + err);
                    reject(err);
            } else {
                console.log("Connected successfully to server");
                db = client.db(dbName);
                resolve(db);
                connectionList.forEach(func=>func(db));
                connectionList = [];
            }
        });
    }))
};

/*  Database Model
    Users - Contain all login info
        _id
        AccountID
        connections
            discord
            github

    If login and confirmed through social service, accountid is signed using private key and given. Else if the accountid is in plain text with a unique identifier before it (such as ID_), then we can determine that the id is from a public source.

    Accounts - Contain all info about the account
        _id
        Name
        Email
        Avatar
        Projects []
            Slug
            Name
            Visible
            ... Other Project Data
 */

const isConnected = () : boolean => !!client && !!client.topology && client.topology.isConnected();

let connectionList = [];
function onceConnected(resolve : (db: Db) => any) {
    if(isConnected())
        resolve(db);
    else {
        connectionList.push(resolve);
    }
}

module.exports = {
    client : MongoClient,
    getDB: () => db,
    connect,
    isConnected,
    onceConnected
};