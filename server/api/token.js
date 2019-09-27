const jwt = require('jsonwebtoken');
const fs = require('fs');

const privateKey = fs.readFileSync('private.key');
const publicKey = fs.readFileSync('public.key');

function encrypt(data){
    return jwt.sign(data, privateKey, { algorithm: 'RS256', expiresIn: '1d'});
}

function verify(inputJWT) {
    return jwt.verify(inputJWT, publicKey , {algorithms: ['RS256']});
}

module.exports = {
    verify,
    encrypt
};
