const express = require('express');
const router = express.Router();

const graphqlHTTP = require('express-graphql');
const {buildSchema} = require('graphql');

let schema = buildSchema(`
    type Query {
        hello: String
    }
`);

var root = {
    hello: () =>{
        return "Hello World";
    }
};

router.use(graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true,
}));

module.exports = router;