const express = require('express');
const fetch = require('node-fetch');
const btoa = require('btoa');
const { catchAsync } = require('../utils');

const router = express.Router();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const redirect = encodeURIComponent('http://localhost:5000/api/discord/callback');

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
    console.log(json);
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
    if(identity.id && identity.id === "217015504932438026")
        res.status(200).send("You have been authorized");
    else
        throw new Error('Unauthorized')
}


module.exports = router;
