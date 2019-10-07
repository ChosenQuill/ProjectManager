import React, {useState} from "react";
import {withRouter, Route} from "react-router-dom";
import queryString from "query-string";
import PropTypes from 'prop-types';
import ApolloClient, {gql, InMemoryCache} from "apollo-boost";
import {useQuery} from '@apollo/react-hooks';
import {Button, Card, Col, message, Row, Spin} from 'antd';
import history from '../History';
import { Typography } from 'antd';
import Loading from "../Components/Loading";

const { Text, Title } = Typography;

export const SITE_LOC = "http://localhost:5000";


export const GraphQLClient = new ApolloClient({
    uri: SITE_LOC + '/api/data/',
    cache: new InMemoryCache(),
    request: (operation) => {
        const token = localStorage.getItem('token');
        operation.setContext({
            headers: {
                authorization: token ? token : ''
            }
        })
    }
});



class Api {
    public baseUrl = SITE_LOC;
    private data = {};
    private jwt : String = localStorage.getItem('token');

    constructor(){
        if(this.jwt){
            this.validate().then(res=>{
                if(res === false){
                    this.logout();
                }
            }).catch(err=>{
                console.log("Error validating token, logging out.");
                this.logout();
            })
        }


    }

    async validate() : Promise<Boolean> {
        if(!this.jwt)
            return false;
        try {
            let res = await fetch(this.baseUrl + '/api/auth/validate?token=' + this.jwt);
            return res.status === 200;
        } catch (err) {
            console.log(err);
            return false;
        }
    }

    public LoginComponent = withRouter(({location,history}) => this.LoginComponentFunc(location,history));

    private LoginComponentFunc(location,history){
        let query = queryString.parse(location.search);
        console.log(query.redirect);
        if(query.token){
            this.setToken(query.token, true);
            history.push('/');
        }

        return (
            <React.Fragment />
        );
    }

    login() {
        window.open(this.baseUrl + "/api/auth/login","_self");
    }

    logout(){
        this.clearToken(true);
        GraphQLClient.resetStore().then(()=>history.push('/'));
        console.log("Logging Out");
    }

    setToken(token, store){
        if(store)
            localStorage.setItem('token', token);
        this.jwt = token;

    }

    clearToken(store){
        if(store)
            localStorage.removeItem('token');
        this.jwt = null;
    }

    getToken(){
        return this.jwt;
    }

}

export const AuthApi = new Api();

export const AuthLevel = {
    MEMBER: 'MEMBER',
    ADMIN: 'ADMIN'
};

const LevelQuery = gql`
    query getRoles {
        me {
            roles
        }
    }
`;

const RolesContext = React.createContext({status: 'ERROR', roles:[]});

export const GetRoles = RolesContext.Consumer;

export function LevelManager(props){
    const {loading, error, data} = useQuery(LevelQuery);
    const [errorDisplayed, setErrorDisplayed] = useState(false);
    let value = {status: 'LOADING', roles: []};
    if(!loading) {
        if(error)
            value.status = 'ERROR';
        else {
            value.status = 'SUCCESS';
            value.roles = data.me.roles;
        }
    }

    if(error && !errorDisplayed){
        console.log("DataConnection Error: " + error);
        if(error.message == "Network error: Failed to fetch")
            message.error("There was an issue connecting you to our servers.",10);
        else
            message.error("There was an error authenticating you.",10);
        setErrorDisplayed(true);
    } else if (errorDisplayed && !error){
        setErrorDisplayed(false);
    }

    return (<RolesContext.Provider value={value}>
        {props.children}
    </RolesContext.Provider>);
}

export function LevelCheck(props) {
    return <GetRoles children={({roles, status})=>{
        if(status === 'LOADING'){
            return (
                <Loading />
            );
        }
        if(roles.includes(props.level))
            return props.children;
        else if(props.redirect)
            AuthApi.login();
        else if(props.NoPermission)
            return (<props.NoPermission />);
        else return (
                <Row>
                    <Col style={{textAlign:'center'}}>
                        <Title level={2}>You do not have permission to view this.</Title>
                        <Button type='primary' size='large' onClick={()=>AuthApi.login()}>Login</Button>
                    </Col>
                </Row>
            );
    }}/>;




}

LevelCheck.context = RolesContext;

LevelCheck.propTypes = {
    level: PropTypes.oneOf(Object.values(AuthLevel)).isRequired,
    children: PropTypes.element.isRequired,
    NoPermission: PropTypes.element,
    redirect: PropTypes.bool,
};

// export function GetLevels(props) {
//     if(props.)
// }
// GetLevels.context = Roles;
