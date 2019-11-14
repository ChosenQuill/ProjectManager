const database = require("../database/index.ts");
const {assert, expect}= require('chai');

process.env.TS_NODE_PROJECT = './tsconfig.json';
require('ts-mocha');
const {describe, it} = require("mocha");

describe('Modify',()=>{
    it("should create a user.", async ()=>{
        await database.connect();
        expect(()=>{
            throw new Error('Random error')
        }).to.not.throw();
    })
})




