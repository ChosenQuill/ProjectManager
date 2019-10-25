const express = require('express');
const fetch = require('node-fetch');
const btoa = require('btoa');
const { catchAsync } = require('../utils');
const token = require('./token');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const oauth = require('simple-oauth2');

const authTokens = fs.readFileSync(path.join(__dirname, '../oauth.json'));
const router = express.Router();
const SITE_LOC = process.env.SITE_LOC;

const discord = oauth.create({
    client: {
        id: authTokens.discord.client,
        secret: authTokens.discord.secret
    },
    auth: {
        tokenHost: 'https://github.com',
        tokenPath: '/login/oauth/access_token',
        authorizePath: '/login/oauth/authorize',
    }
})


const redirect = encodeURIComponent('http://localhost:5000/api/auth/callback');

// Router

router.use(cookieParser());

router.get('/discord', (req, res) => {
    console.log(req.query);
    if(req.query.redirect) {
        if(req.query.redirect === '/login')
            req.query.redirect = '/';
        res.cookie('redirect', req.query.redirect, {httpOnly: true});
    }
    else if (req.cookies.redirect)
        res.clearCookie('redirect');
    res.redirect(`https://discordapp.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${redirect}&response_type=code&scope=identify`);
});

router.get('/discord/callback', catchAsync(async (req, res) => {
    if (!req.query.code) throw new Error('NoCodeProvided');
    console.log(req);
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

    let result = await authenticate(json.access_token,req,res);
}));

async function authenticate(access_token, req,res) {
    let response = await fetch(`https://discordapp.com/api/users/@me`,
        {
           method: 'GET',
            headers: {
               Authorization: `Bearer ${access_token}`
            }
        });
    let identity = await response.json();

    // console.log("Identity: " + JSON.stringify(identity));
    if(identity.id) {
        let jwt = token.encrypt({id: identity.id, name: identity.username, avatar: identity.avatar});
        console.log("JWT Token: " + jwt);
        console.log('Cookies: ' + JSON.stringify(req.cookies));
        res.status(200).redirect(SITE_LOC + 'login?token=' + jwt + (req.cookies.redirect  ? ('&redirect=' + req.cookies.redirect) : ''));
    }
    else
        throw new Error('Unauthorized');
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
