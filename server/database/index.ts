import {Db} from "mongodb";

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
                connectionList.forEach(func=>func(db));
                connectionList = [];
                resolve(db);
            }
        });
    }))
};


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
    client,
    getDB: () => db,
    connect,
    isConnected,
    onceConnected
};