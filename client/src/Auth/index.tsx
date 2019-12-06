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
        if(!token) {
            console.log('Error at',operation.operationName);
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
                <div style={{margin: "0 auto", width: '400px'}}>
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
                    <Card style={{margin: '4px', marginTop:'8px'}}>
                        {signUp ? 'Already have an account? ': 'New here? '}
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

    logout() {
        this.clearToken(true);
        history.push('/login');
        GraphQLClient.clearStore();
        persistor.purge();
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
    USER: 'USER',
    GUEST: 'GUEST'
};

const LevelQuery = gql`
    query getRole {
        me {
            role
        }
    }
`;

interface IRole {
    status: 'LOADING' | 'SUCCESS' | 'ERROR',
    role: 'NONE' | 'GUEST' | 'USER',
}

const RoleContext = React.createContext<IRole>({
    role: 'NONE',
    status: 'LOADING'
});

export const RoleManager = ({children}) => {
    const [fetch, {error, data, called}] = useLazyQuery(LevelQuery);
    const [role, setRole] = useState<IRole>({
        status: 'LOADING',
        role: 'NONE'
    });
    useEffect(()=>{
        // console.log('token',token,localStorage.getItem('token'));
        if(isEmpty(localStorage.getItem('token'))){
            setRole({
                status: "SUCCESS",
                role: "GUEST"
            });
        } else {
            fetch();
            console.log('fetching request sent')
        }
    },[localStorage.getItem('token')]);

    useEffect(()=>{
        console.log('fetching new role data',data,error,called,has(data,'me.role'));
        if(called) {
            if (error)
                setRole({
                    status: 'ERROR',
                    role: 'GUEST',
                });
            else if(has(data,'me.role')) {
                setRole({
                    status: 'SUCCESS',
                    role: data.me.role
                });
            } else {
                console.log('Error Getting Role');
            }
        }
    },[data,error]);

    return (
        <RoleContext.Provider value={role}>
            {children}
        </RoleContext.Provider>
    );
};

export const useRole = () : IRole => {
    return useContext(RoleContext);
};


export function LevelCheck(props) {
    console.log('get UseRole');
    const role = useRole();
    console.log('return useRole');
    if (role.status === 'LOADING') {
        return (
            <Loading/>
        );
    }
    if (role.role === props.level)
        return props.children;
    else if (props.redirect)
        AuthApi.login();
    else if (props.NoPermission)
        return (<props.NoPermission/>);
    return (
            <Row>
                <Col style={{textAlign: 'center'}}>
                    <Title level={2}>You do not have permission to view this.</Title>
                    <Button type='primary' size='large' onClick={() => AuthApi.login()}>Login</Button>
                </Col>
            </Row>
        );
}

LevelCheck.propTypes = {
    level: PropTypes.oneOf(Object.values(AuthLevel)).isRequired,
    children: PropTypes.any.isRequired,
    NoPermission: PropTypes.element,
    redirect: PropTypes.bool,
};

