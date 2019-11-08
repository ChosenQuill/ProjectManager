const {onceConnected} = require("../database");
import {Collection, Db} from "mongodb";
const express = require('express');
const fetch = require('node-fetch');
const { catchAsync } = require('../utils');
const token = require('./token');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const oauth = require('simple-oauth2');
const {getDb} = require('../database');

const authTokens = JSON.parse(fs.readFileSync('./oauth.json').toString());
const router = express.Router();
const SITE_LOC = process.env.SITE_LOC;


const redirect = encodeURIComponent('http://localhost:5000/api/auth/callback');

// Router

router.use(cookieParser());


const discord = oauth.create({
    client: {
        id: authTokens.discord.client,
        secret: authTokens.discord.secret
    },
    auth: {
        tokenHost: 'https://discordapp.com/',
        tokenPath: '/api/oauth2/token',
        revokePath: '/api/oauth2/token/revoke',
        authorizePath: '/api/oauth2/authorize',
    },
});

const discordUrl = discord.authorizationCode.authorizeURL({
    redirect_uri: 'http://localhost:5000/api/auth/discord/callback',
    scope: 'identify'
});


const github = oauth.create({
    client: {
        id: authTokens.github.client,
        secret: authTokens.github.secret
    },
    auth: {
        tokenHost: 'https://github.com',
        tokenPath: '/login/oauth/access_token',
        authorizePath: '/login/oauth/authorize',
    }
});

const githubUrl = github.authorizationCode.authorizeURL({
    redirect_uri: 'http://localhost:5000/api/auth/github/callback',
    scope: ""
});


router.get('/login',((req, res) => {
    if(!req.query.service){
        throw new Error('No service provided.')
    }
    let {service} = req.query;
    let url;
    if(service === 'discord'){
        url = discordUrl;
    } else if (service === 'github'){
        url = githubUrl;
    } else
        throw new Error('Invalid Service')
    if(req.query.signUp && req.query.signUp === 'true')
        res.cookie('signUp',true);
    else if(req.cookies.signUp)
        res.clearCookie('signUp');
    res.redirect(url);
}));

let users : Collection;
onceConnected((db)=>{
    users = db.collection('users');
    users.createIndexes([
        {
            key: {
                "connection.discord": 1
            }
        }, {
            key: {
                "connection.github": 1
            }
        }
    ])
});

router.get('/discord/callback', catchAsync(async (req, res, next) => {
    if (!req.query.code) throw next(Error('NoCodeProvided'));
    const code = req.query.code;

    try {
        const result = await discord.authorizationCode.getToken({code: code, redirect_uri: 'http://localhost:5000/api/auth/discord/callback'});
        if (result.error) {
            next(Error(result.error));
            return;
        }
        const accessToken = discord.accessToken.create(result);
        let response = await fetch(`https://discordapp.com/api/users/@me`,
            {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken.token.access_token}`
                }
            });
        let identity = await response.json();
        console.log(identity);


        res.status(200).send({status: "VALID"});
        // await authenticate(accessToken.token.access_token,req,res);
    } catch (e) {
        next(e);
    }
}));


router.get('/github/callback',async (req, res, next) => {
    if (!req.query.code) throw new Error('NoCodeProvided');
    const tokenConfig = {
        code: req.query.code,
        redirect_uri: 'http://localhost:5000/api/auth/github/callback',
    };
    try {
        const result = await github.authorizationCode.getToken(tokenConfig);
        if (result.error) {
            next(Error(result.error));
            return;
        }
        const accessToken = github.accessToken.create(result);
        // console.log("Error: ", result.error);
        // console.log(result,accessToken);

        let response = await fetch(`https://api.github.com/user`,
            {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken.token.access_token}`
                }
            });
        let value = await response.json();
        console.log(value);
        res.status(200).send({status: "VALID"});
    } catch (e) {
        console.log(e);
        next(e);
    }


});

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
