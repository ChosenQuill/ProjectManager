import React from 'react';
import './index.css';

import 'antd/dist/antd.css';
import {Button, Typography} from "antd";
import {Switch, Route, Redirect, withRouter} from "react-router-dom";
import PropTypes from "prop-types";
import Api from './Api';

const {Paragraph, Title} = Typography;

const baseUrl = process.env.SITE_LOC;

class App extends React.Component {

    render() {

        return (
            <React.Fragment>
                {
                    Api.isLoggedIn() ? <Title level={2}>
                        You are Logged In
                    </Title> : <Button type="primary" size="large" style={{margin: "10px"}} onClick={()=>Api.login()}>
                        Login
                    </Button>
                }
                <Route path="/login" render={() => <Api.LoginComponent />}/>
            </React.Fragment>
        );
    }

}


export default withRouter(App);
