import React, {useContext, useEffect, useState} from "react";
import {Link, withRouter} from "react-router-dom";
import queryString from "query-string";
import PropTypes from 'prop-types';
import ApolloClient, {gql, InMemoryCache} from "apollo-boost";
import {CachePersistor, persistCacheSync} from 'apollo-cache-persist-dev'
import {useLazyQuery} from '@apollo/react-hooks';
import {Button, Card, Checkbox, Col, message, Row, Typography} from 'antd';
import {has, isEmpty} from 'lodash';

import history from '../History';
import Loading from "../Components/Loading";
import {createButton, createSvgIcon, GithubLoginButton} from 'react-social-login-buttons'
import discordIcon from '../assets/discord-logo.svg'

const {Text, Title, Paragraph} = Typography;

export const SITE_LOC = process.env.REACT_APP_SITE_LOC;

const cache = new InMemoryCache();

const persistor = new CachePersistor({
    cache,
    storage: window.localStorage
});

persistCacheSync({
    cache,
    storage: window.localStorage
});

export const GraphQLClient = new ApolloClient({
    uri: SITE_LOC + '/data/',
    cache: cache,
    request: (operation) => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.log('Error at', operation.operationName);
            throw Error('Not Logged In (Please Report)');
        }
        operation.setContext({
            headers: {
                authorization: token ? token : ''
            }
        })
    }
});

export const DiscordLoginButton = createButton(
    {
        icon: createSvgIcon((size) => <img src={discordIcon} style={size}/>),
        style: {background: "#7289DA"},
        activeStyle: {background: "#5970C1"}
    }
);


class Api {
    public baseUrl = SITE_LOC;
    private jwt: string = localStorage.getItem('token');
    public loginLoc: string;

    constructor() {
        if (this.jwt) {
            this.validate().then(res => {
                if (res === false) {
                    this.logout();
                } else if (history.location.pathname === '/') {
                    history.replace('/home');
                }
            }).catch(err => {
                console.log("Error validating token, logging out.");
                this.logout();
            })
        }

    }

    async validate(): Promise<Boolean> {
        if (!this.jwt)
            return false;
        try {
            let res = await fetch(this.baseUrl + '/auth/validate?token=' + this.jwt);
            return res.status === 200;
        } catch (err) {
            console.log(err);
            return false;
        }
    }

    public LoginComponent = withRouter(({location, history}) => this.LoginComponentFunc(location, history));

    private readonly errors = {
        "1": "You must create an account before you can log in.",
    };

    private LoginComponentFunc(location, history) {
        let query = queryString.parse(location.search);
        let signUp = location.pathname === '/signup';
        let [tos, setTos] = useState(!signUp);
        let [errorDisplayed, setED] = useState(false);

        let login = (service) => {
            if (tos) {
                window.open(this.serviceUrl(service, signUp), '_self');
            } else {
                message.error("You must agree to the terms and conditions before continuing.")
            }
        };

        if (query.token && !signUp) {
            this.setToken(query.token, true);
            history.push(this.loginLoc == null ? '/home' : this.loginLoc);
            this.loginLoc = null;
        }

        if (query.error && !errorDisplayed) {
            message.error(this.errors[query.error.toString()]);
            setED(true);
        }


        return (
            <Card className='card'>
                <div style={{margin: "0 auto", width: '400px', maxWidth: '100%'}}>
                    <Title style={{textAlign: 'center'}}>
                        {
                            signUp ? "Sign Up" : "Log In"
                        }
                    </Title>
                    <GithubLoginButton text={(signUp ? 'Sign Up' : 'Login') + ' With Github'}
                                       onClick={() => login('github')}/>
                    <DiscordLoginButton text={(signUp ? 'Sign Up' : 'Login') + ' With Discord'}
                                        onClick={() => login('discord')}/>
                    {
                        signUp &&
                        <Checkbox onChange={e => setTos(e.target.checked)} style={{margin: '5px'}}>
                            I agree to the <a href={'/tos'}>terms and conditions</a>.
                        </Checkbox>

                    }
                    <Card style={{margin: '4px', marginTop: '8px'}}>
                        {signUp ? 'Already have an account? ' : 'New here? '}
                        <Link to={signUp ? '/login' : '/signup'}>{signUp ? 'Login' : 'Signup'}</Link>
                    </Card>

                </div>
            </Card>
        );
    }

    private serviceUrl(service: string, signUp: boolean): string {
        return SITE_LOC + '/auth/login?service=' + service + (signUp ? '&signUp=true' : '');
    }

    login() {
        if (history.location.pathname == '/login')
            this.loginLoc = null;
        else
            this.loginLoc = history.location.pathname;
        history.push('/login');
    }

    logout(displayMessage = true) {
        this.clearToken(true);
        history.push('/login');
        GraphQLClient.clearStore();
        persistor.purge();
        if(displayMessage)
            message.success("Logged Out");
        console.log("Logging Out");
    }

    setToken(token, store) {
        if (store)
            localStorage.setItem('token', token);
        console.log('setting token')
        this.jwt = token;
    }

    clearToken(store) {
        if (store)
            localStorage.removeItem('token');
        this.jwt = null;
    }

    getToken() {
        return this.jwt;
    }
}

export const AuthApi = new Api();

export const AuthLevel = {
    ADMIN: 'ADMIN',
    USER: 'USER',
    GUEST: 'GUEST',
};

const LevelQuery = gql`
    query getRole {
        me {
            role {
                name,
                permissions,
                allNames
            }
        }
    }
`;

interface IRole {
    status: 'LOADING' | 'SUCCESS' | 'ERROR',
    name: 'NONE' | 'GUEST' | 'USER' | 'ADMIN',
    permissions: string[],
    allNames: string[]
}

const RoleContext = React.createContext<IRole>({
    name: 'NONE',
    status: 'LOADING',
    permissions: [],
    allNames: [],
});

export const RoleManager = ({children}) => {
    const [fetch, {error, data, called}] = useLazyQuery(LevelQuery);
    const [role, setRole] = useState<IRole>({
        status: 'LOADING',
        name: 'NONE',
        permissions: [],
        allNames: [],
    });
    useEffect(() => {
        // console.log('token',token,localStorage.getItem('token'));
        if (isEmpty(localStorage.getItem('token'))) {
            setRole({
                status: "SUCCESS",
                name: "GUEST",
                permissions: [],
                allNames: ['GUEST'],
            });
        } else {
            fetch();
            console.log('fetching request sent')
        }
    }, [localStorage.getItem('token')]);

    useEffect(() => {
        console.log('fetching new role data', data, error, called, has(data, 'me.role'));
        if (called) {
            if (error)
                setRole({
                    status: 'ERROR',
                    name: 'GUEST',
                    permissions: [],
                    allNames: ['GUEST'],
                });
            else if (has(data, 'me.role.name') && has(data, 'me.role.permissions') && has(data, 'me.role.allNames')) {
                setRole({
                    status: 'SUCCESS',
                    name: data.me.role.name,
                    permissions: data.me.role.permissions,
                    allNames: data.me.role.allNames
                });
            } else {
                console.log('Error Getting Role');
            }
        }
    }, [data, error]);

    return (
        <RoleContext.Provider value={role}>
            {children}
        </RoleContext.Provider>
    );
};

export const useRole = (): IRole => {
    return useContext(RoleContext);
};

const NoPermissionBlock = (
    <Row>
        <Col style={{textAlign: 'center'}}>
            <Title level={2}>You do not have permission to view this.</Title>
            <Button type='primary' size='large' onClick={() => AuthApi.login()}>Login</Button>
        </Col>
    </Row>
);

export function PermissionCheck({permission, children, NoPermission = NoPermissionBlock, showDenied = false, showLoading = false, redirect = true}) {
    const userRole = useRole();
    switch (userRole.status) {
        case "LOADING":
            if (showLoading)
                return (
                    <Loading/>
                );
            else return null;
        case "SUCCESS":
            if(userRole.permissions.includes(permission))
                return children;
            if(redirect)
                AuthApi.login();
        case "ERROR":
            if(showDenied)
                return NoPermission;
            else
                return null;
    }
}

PermissionCheck.protoTypes = {
    permission: PropTypes.string.isRequired,
    children: PropTypes.any.isRequired,
    NoPermission: PropTypes.element,
    showDenied: PropTypes.bool,
    showLoading: PropTypes.bool,
    redirect: PropTypes.bool,
};

export function RoleCheck({name, children, NoPermission = NoPermissionBlock, showDenied = false, showLoading = false, redirect = false}) {
    const userRole = useRole();
    switch (userRole.status) {
        case "LOADING":
            if (showLoading)
                return (
                    <Loading/>
                );
            else return null;
        case "SUCCESS":
            if(userRole.allNames.includes(name))
                return children;
            if(redirect)
                AuthApi.login();
        case "ERROR":
            if(showDenied)
                return NoPermission;
            else
                return null;
    }
}

RoleCheck.protoTypes = {
    name: PropTypes.string.isRequired,
    children: PropTypes.any.isRequired,
    NoPermission: PropTypes.element,
    showDenied: PropTypes.bool,
    showLoading: PropTypes.bool,
    redirect: PropTypes.bool,
};
