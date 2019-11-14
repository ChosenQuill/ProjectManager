const database = require("../database/index.ts");
const {assert, expect}= require('chai');

process.env.TS_NODE_PROJECT = './tsconfig.json';
require('ts-mocha');
const {describe, it} = require("mocha");

database.connect().then(()=>{
    describe('Modify',()=>{
        it("should create a user.", ()=>{
            expect(()=>{
                throw new Error('Random error')
            }).to.not.throw();
        })
    })
});


