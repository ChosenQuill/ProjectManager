import React, {useState} from "react";
import {withRouter} from "react-router-dom";
import queryString from "query-string";
import PropTypes from 'prop-types';
import ApolloClient, {gql, InMemoryCache} from "apollo-boost";
import {persistCacheSync} from 'apollo-cache-persist-dev'
import {useQuery} from '@apollo/react-hooks';
import {Button, Card, Checkbox, Col, message, Row, Typography} from 'antd';
import history from '../History';
import Loading from "../Components/Loading";
import {createButton, createSvgIcon, GithubLoginButton} from 'react-social-login-buttons'
import discordIcon from '../assets/discord-logo.svg'

const {Text, Title} = Typography;

export const SITE_LOC = process.env.REACT_APP_SITE_LOC;

const cache = new InMemoryCache();

persistCacheSync({
    cache,
    storage: window.localStorage,
});

export const GraphQLClient = new ApolloClient({
    uri: SITE_LOC + '/data/',
    cache: cache,
    request: (operation) => {
        const token = localStorage.getItem('token');
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
    private jwt: String = localStorage.getItem('token');
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
        GraphQLClient.resetStore().then(() => history.push('/login'));
        console.log("Logging Out");
    }

    setToken(token, store) {
        if (store)
            localStorage.setItem('token', token);
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


const RoleContext = React.createContext({status: 'ERROR', role: 'GUEST'});

export const GetRole = RoleContext.Consumer;

export function LevelManager(props) {
    const {loading, error, data} = useQuery(LevelQuery);
    const [errorDisplayed, setErrorDisplayed] = useState(false);
    let value = {status: 'LOADING', role: ''};
    if (!loading) {
        if (error)
            value.status = 'ERROR';
        else {
            value.status = 'SUCCESS';
            value.role = data.me.role;
        }
    }

    if (error && !errorDisplayed) {
        console.log("DataConnection Error: " + error);
        console.log(JSON.stringify(error));
        if (error.message == "Network error: Failed to fetch")
            message.error("There was an issue connecting you to our servers.", 10);
        else
            message.error("There was an error authenticating you.", 10);
        setErrorDisplayed(true);
    } else if (errorDisplayed && !error) {
        setErrorDisplayed(false);
    }

    return (<RoleContext.Provider value={value}>
        {props.children}
    </RoleContext.Provider>);
}

export function LevelCheck(props) {
    return <GetRole children={({role, status}) => {
        if (status === 'LOADING') {
            return (
                <Loading/>
            );
        }
        if (role === props.level)
            return props.children;
        else if (props.redirect)
            AuthApi.login();
        else if (props.NoPermission)
            return (<props.NoPermission/>);
        else return (
                <Row>
                    <Col style={{textAlign: 'center'}}>
                        <Title level={2}>You do not have permission to view this.</Title>
                        <Button type='primary' size='large' onClick={() => AuthApi.login()}>Login</Button>
                    </Col>
                </Row>
            );
    }}/>;
}

LevelCheck.context = RoleContext;

LevelCheck.propTypes = {
    level: PropTypes.oneOf(Object.values(AuthLevel)).isRequired,
    children: PropTypes.any.isRequired,
    NoPermission: PropTypes.element,
    redirect: PropTypes.bool,
};

