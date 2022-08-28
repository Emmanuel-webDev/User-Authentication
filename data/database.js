const mongodb = require("mongodb");

const MongoClient = mongodb.MongoClient;

let database;

async function connection (){
    const connection = await MongoClient.connect("mongodb://127.0.0.1:27017/");
    database = connection.db('verification')
}

function getDb(){
    if(!database){
        console.log("Error establishing db")
    }
    return database;
}

module.exports = {
    connection: connection,
    getDb: getDb
}