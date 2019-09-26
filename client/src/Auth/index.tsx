import React, {useState} from "react";
import {withRouter, Route} from "react-router-dom";
import queryString from "query-string";
import PropTypes from 'prop-types';
import ApolloClient, {gql, InMemoryCache} from "apollo-boost";

export const GraphQLClient = new ApolloClient({
    uri: process.env.SITE_LOC + 'api/data/',
    cache: new InMemoryCache(),
    headers: {
        authorization: localStorage.getItem('token'),
    }
});



class Api {
    public baseUrl = "http://localhost:5000";
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
        if(query.token){
            this.setToken(query.token, true);
            history.push('/');
        } else {
            //window.open(this.baseUrl + "/api/auth/login","_self");
        }

        return (
            <React.Fragment/>
        );
    }

    login() {
        window.open(this.baseUrl + "/api/auth/login","_self");
        window.open(this.baseUrl + "/api/auth/login","_self");
    }


    isLoggedIn() : boolean {
        return (this.jwt !== null);
    }

    public logout = withRouter(({history}) => {
        history.push('/');
    });

    setToken(token, store){
        if(store)
            localStorage.setItem('token',token);
        this.jwt = token;
    }

    getToken(){
        return this.jwt;
    }

}

export const AuthApi = new Api();

export const AuthLevel = {
    GUEST: 'GUEST',
    MEMBER: 'MEMBER',
    ADMIN: 'ADMIN'
};

const roles = React.createContext([]);

export class LevelManager extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            roles: null
        };
        GraphQLClient.query({
            query: gql`
                query getRoles {
                    me {
                        roles
                    }
                }
            `
        }).then(query=>{
            if(query.loading) {

            }
        }).catch(err=>console.log(err));
    }
}

export class LevelCheck extends React.Component{
    constructor(props){
        super(props);
        if(props.level) {

        }
    }


    render() {
        return (<React.Fragment>{this.props.children}</React.Fragment>);
    }

    static propTypes = {
        level: PropTypes.oneOf(Object.values(AuthLevel)).isRequired,
        children: PropTypes.element.isRequired,
    }

}

