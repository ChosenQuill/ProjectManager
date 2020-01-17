# Server

**The Project Manager server side uses NodeJS and connects to a MongoDB database as part of the overall MERN stack.**

GraphQL manages the api data endpoint for gathering info and data (in ./api/data), and uses the data manager to talk to the database (located in ./database).

Users login through the login endpoint with the front-end specifying what service the user want's to login with (Oauth). Then the user is taken through the oauth route and validation scheme, and once validated, gets a jwt (containing the signed accountID) to access the GraphQL endpoint.

The plan is for external (non-signed) public id's to be used to allow the user to display public project info on website's of their choice (through the data endpoint). The beginning of the public id will begin with ``PID_`` plus the ``accountID``, and that will be used to differentiate between public and private id's.

## Database Model

1. Users | Contain all login info
    1. _id
    2. accountID | Links to Account
    3. connections [] | Oauth ID's (Discord\Github)
        1. type
        2. id
        > Index: Compound of first type, then ID.
2. Accounts | Contains all the info used by the user.
    1. _id
    2. projects []
        1. id | Short ID as String instead of ObjectID
        2. slug
        3. name
        4. visible
        5. ... Other Project Data
    > Account Info
    3. name
    4. avatar
    5. role
3. Settings | Contains Server Settings
    1. Name | Name of settings option.
    2. ... Values

#### Settings Model
1. Whitelist
     1. status | Boolean for enabled/disabled
     2. list [] | Contains array of valid ids (any social service) that is allowed to create an account plus the name.
        1. name
        2. id