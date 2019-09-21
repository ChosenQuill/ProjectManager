import React, {useState} from "react";
import {withRouter, Route} from "react-router-dom";
import queryString from "query-string";

const baseUrl = "http://localhost:5000";

class Api {
    private data = {};
    private jwt : String = localStorage.getItem('token');

    constructor(){
        if(this.jwt){
            this.validate().then(res=>{
                if(res === false){
                    this.clearData();
                }
            })
        }
    }

    async validate() : Promise<Boolean> {
        if(!this.jwt)
            return false;
        try {
            let res = await fetch(baseUrl + '/api/auth/validate?token=' + this.jwt);
            return res.status === 200;
        } catch (err) {
            console.log(err);
            return false;
        }
    }

    public LoginComponent = withRouter(({history, ...props}) => this.LoginComponentFunc(props,history));

    private LoginComponentFunc(props,history){
        console.log("Login Component");
        console.log(props);
        let query = queryString.parse(props.location.search);
        if(query.token){
            this.setToken(query.token, true);
            history.push('/');
        } else {
            window.open(baseUrl + "/api/auth/login","_self");
        }

        return (
            <React.Fragment>Some Stuff</React.Fragment>
        );
    }

    login() {
        window.open(baseUrl + "/api/auth/login","_self");
    }


    isLoggedIn() : boolean {
        return (this.jwt !== null);
    }

    clearData() {
        localStorage.removeItem('token');
        this.data = {};
        this.jwt = null;
    }

    setToken(token, store){
        if(store)
            localStorage.setItem('token',token);
        this.jwt = token;
    }

    getData(name: string){
        return this.data[name];
    }

}

const APIInstance = new Api();

export default APIInstance;