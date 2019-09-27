const express = require('express');
const fetch = require('node-fetch');
const btoa = require('btoa');
const { catchAsync } = require('../utils');
const token = require('./token');

const router = express.Router();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const SITE_LOC = process.env.SITE_LOC;

const redirect = encodeURIComponent('http://localhost:5000/api/auth/callback');


// Router

router.get('/login', (req, res) => {
    res.redirect(`https://discordapp.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${redirect}&response_type=code&scope=identify`);
});

router.get('/callback', catchAsync(async (req, res) => {
    if (!req.query.code) throw new Error('NoCodeProvided');
    const code = req.query.code;
    const creds = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);
    const response = await fetch(`https://discordapp.com/api/oauth2/token?grant_type=authorization_code&code=${code}&redirect_uri=${redirect}`,
        {
            method: 'POST',
            headers: {
                Authorization: `Basic ${creds}`,
            },
        });
    const json = await response.json();
    if(json.scope !== 'identify')
        throw new Error('Unauthorized');
    if(!json.access_token)
        if(json.error_description && json.error)
            throw new Error(json.error + " | " + json.error_description);
        else
            throw new Error("Internal Server Error");

    let result = await authenticate(json.access_token,res);
}));

async function authenticate(access_token, res) {
    let response = await fetch(`https://discordapp.com/api/users/@me`,
        {
           method: 'GET',
            headers: {
               Authorization: `Bearer ${access_token}`
            }
        });
    let identity = await response.json();

    console.log("Identity: " + JSON.stringify(identity));
    if(identity.id) {
        let jwt = token.encrypt({id: identity.id, name: identity.username, avatar: identity.avatar});
        console.log("JWT Token: " + jwt);
        res.status(200).redirect(SITE_LOC + 'login?token=' + jwt);
    }
    else
        throw new Error('Unauthorized')
}

router.get('/validate',catchAsync(async (req,res)=> {
    if(!req.query.token)
        throw new Error('NoTokenProvided');
    try {
        token.verify(req.query.token);
    } catch (e) {
        throw new Error('Unauthorized');
    }
    res.status(200).send({status: "VALID"});
}));

module.exports = router;
