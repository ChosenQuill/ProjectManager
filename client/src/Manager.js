import React from "react";

import {AuthLevel, LevelCheck} from "./Auth";
import {Switch, Route, Redirect} from 'react-router-dom';

function Manager(){
    return (
        <LevelCheck level={AuthLevel.ADMIN} redirect={true}>
            <Switch>
                <Route exact path='/admin' render={()=><Redirect to='/admin/home'/>} />
                <Route path='/admin/home' component={Home}/>
            </Switch>
        </LevelCheck>
    );
}

function Home(){
    return (
        <React.Fragment>

        </React.Fragment>
    )
}

export default Manager;