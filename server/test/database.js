const {ObjectId} = require("mongodb");

const database = require("../database/index.ts");
const {assert, expect}= require('chai');

const {describe, it} = require("mocha");



describe('Database',()=>{
    after(()=>{
        if(database.isConnected()){
            database.client.close();
        }
    });
    describe('Connecting',()=>{
        it('should connect to the database',(done)=>{
            database.connect().then(db=>{
                done();
            });
        }).timeout(5000);
    });
    describe('User Validation',()=>{
        describe('ObjectID Comparing', ()=>{
            it('should not have a valid id',()=>{
                expect((()=>{
                    let val = 'microsoft123';
                    let oid = new ObjectId(val).toHexString();
                    console.log('OID: ' + oid);
                    return oid===val;
                })()).to.be.false;
            });
            it('should have a valid id',()=>{
                expect((()=>{
                    let val = '551137c2f9e1fac808a5f572';
                    let oid = new ObjectId(val).toHexString();
                    console.log('OID: ' + oid);
                    return oid===val;
                })()).to.be.true;
            })
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




