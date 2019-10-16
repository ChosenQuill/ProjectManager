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
const connect = (callback?: (err: Error, db) => any) => client.connect((err) => {
    if(err){
       console.log("Error connecting to the database: " + err);
       if(callback)
           callback(err,null);
    } else {
        console.log("Connected successfully to server");
        db = client.db(dbName);
        if(callback)
            callback(null,db);
    }
});

module.exports = {
    client : MongoClient,
    getDB: () => db,
    connect,
    isConnected: () => !!client && !!client.topology && client.topology.isConnected(),
};