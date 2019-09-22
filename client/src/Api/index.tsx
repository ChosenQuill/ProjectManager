import React, {useState} from "react";
import {withRouter, Route} from "react-router-dom";
import queryString from "query-string";
import Enviroment from "./Enviroment";

class Api {
    public baseUrl = "http://localhost:5000";
    private data = {};
    private jwt : String = localStorage.getItem('token');

    constructor(){
        if(this.jwt){
            this.validate().then(res=>{
                if(res === false){
                    this.clearData();
                }
            }).catch(err=>{
                console.log("Error validating token, logging out.");
                this.clearData();
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
            console.log(Enviroment);

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