import {useState} from "react";

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

}

const ApiInstance : Api = new Api();

export default ApiInstance;