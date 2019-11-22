const database = require("../database/index.ts");
const {assert, expect}= require('chai');

process.env.TS_NODE_PROJECT = './tsconfig.json';
require('ts-mocha');
const {describe, it} = require("mocha");

describe('Database',()=>{
    after(()=>{
        if(database.isConnected()){
            database.getDB().close();
        }
    })
    describe('Connecting',()=>{
        it('should connect to the database',async (done)=>{
            await database.connect();
            console.log("Print");
            done();
        })
    });
    describe('Modifying',()=>{
        it("should create a user.", ()=>{
            expect(()=>{
                // throw new Error('Random error')
            }).to.not.throw();
        })
    });

});




