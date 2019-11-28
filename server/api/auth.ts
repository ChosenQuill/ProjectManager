import {ModuleOptions, OAuthClient} from "simple-oauth2";
import {AccountInfo} from '../data-manager';

const express = require('express');
const fetch = require('node-fetch');
const {catchAsync} = require('../utils');
const token = require('./token');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const oauth = require('simple-oauth2');
const {AccountManager} = require('../data-manager');

const authTokens = JSON.parse(fs.readFileSync('./oauth.json').toString());
export const router = express.Router();
const SITE_LOC = process.env.SITE_LOC;
const BACKEND_LOC = process.env.BACKEND_LOC;


// Router
router.use(cookieParser());


export class AuthService<ClientIdName extends string = 'client_id'> {
    public readonly name: string;
    public readonly client: OAuthClient;
    public readonly scopes: string;

    public readonly callbackUrl: string;
    public readonly redirectUrl: string;
    public readonly userInfoUrl: string;
    public readonly extractInfo: (info: any) => AccountInfo;

    private static services: Record<string, AuthService> = {};

    public static has(name: string) {
        return name in this.services;
    }

    public static get(name: string) {
        return AuthService.services[name];
    }

    constructor(name: string, options: ModuleOptions<ClientIdName>, scopes: string, userInfoUrl: string, extractInfo: (info: any) => AccountInfo) {
        this.client = oauth.create(options);
        this.scopes = scopes;
        this.name = name;
        this.callbackUrl = `${BACKEND_LOC}/auth/${name}/callback`;
        this.extractInfo = extractInfo;
        this.redirectUrl = this.client.authorizationCode.authorizeURL({
            redirect_uri: this.callbackUrl,
            scope: scopes
        });
        if (name === 'discord') {
            this.redirectUrl += '&prompt=none';
        }
        router.get(`/${name}/callback`,
            async (req, res, next) => {
                if (!req.query.code)
                    next(Error('NoCodeProvided'));
                const code = req.query.code;
                try {
                    const result = await this.client.authorizationCode.getToken({
                        code: code,
                        redirect_uri: this.callbackUrl
                    });
                    if (result.error) {
                        next(Error(result.error));
                        return;
                    }
                    const accessToken = this.client.accessToken.create(result);
                    let response = await fetch(userInfoUrl,
                        {
                            method: 'GET',
                            headers: {
                                Authorization: `Bearer ${accessToken.token.access_token}`
                            }
                        });
                    let identity = await response.json();
                    if (!identity.id) {
                        next(Error('Invalid Request'));
                    }

                    let account;
                    if (req.cookies.signUp) {
                        account = await AccountManager.create(this, identity);
                    } else {
                        account = await AccountManager.get(this.name, identity.id);
                    }

                    if (!account) {
                        res.status(200).redirect(SITE_LOC + '/signup?error=1');
                        return;
                    }
                    let jwt = token.encrypt({id: account});
                    res.status(200).redirect(SITE_LOC + '/login?token=' + jwt);
                } catch (e) {
                    next(e);
                }
            }
        );

        AuthService.services[name] = this;
    }

    public static readonly DISCORD = new AuthService<'discord'>(
        'discord',
        {
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
        },
        'identify',
        'https://discordapp.com/api/users/@me',
        user => {
            return {
                name: user.username,
                avatar: `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
            }
        }
    );

    public static readonly GITHUB = new AuthService<'github'>(
        'github',
        {
            client: {
                id: authTokens.github.client,
                secret: authTokens.github.secret
            },
            auth: {
                tokenHost: 'https://github.com',
                tokenPath: '/login/oauth/access_token',
                authorizePath: '/login/oauth/authorize',
            }
        },
        '',
        'https://api.github.com/user',
        user => {
            return {
                name: user.name,
                avatar: user.avatar_url
            };
        }
    );
}

router.get('/login', ((req, res) => {
    if (!req.query.service) {
        throw new Error('No service provided.')
    }
    let {service} = req.query;
    if (!AuthService.has(service)) {
        throw new Error('Invalid Service');
    }
    if (req.query.signUp && req.query.signUp === 'true')
        res.cookie('signUp', true);
    else if (req.cookies.signUp)
        res.clearCookie('signUp');
    res.redirect(AuthService.get(service).redirectUrl);
}));

router.get('/validate', catchAsync(async (req, res) => {
    if (!req.query.token)
        throw new Error('NoTokenProvided');
    try {
        token.verify(req.query.token);
    } catch (e) {
        throw new Error('Unauthorized');
    }
    res.status(200).send({status: "VALID"});
}));
