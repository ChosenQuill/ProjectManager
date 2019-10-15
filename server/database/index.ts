const MongoClient = require('mongodb').MongoClient;

const url = 'mongodb://localhost:27017';

// Database Name
const dbName = 'pm';

// Create a new MongoClient
const client = new MongoClient(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

let db : IDBDatabase;
const connect = (callback: (err: Error, db: IDBDatabase) => any) => client.connect((err) => {
    if(err){
       console.log("Error connecting to the database: " + err);
       callback(err,null);
    } else {
        console.log("Connected successfully to server");
        db = client.db(dbName);
        callback(null,db);
    }
});

module.exports = {
    client : MongoClient,
    getDB: () => db,
    connect,
    isConnected: () => client && client.topology && client.topology.isConnected,
};