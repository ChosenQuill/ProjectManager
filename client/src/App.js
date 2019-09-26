import React from 'react';
import './index.css';

import 'antd/dist/antd.css';
import {Button, Typography} from "antd";
import {Route, withRouter} from "react-router-dom";
import {AuthApi, LevelCheck, AuthLevel, GraphQLClient} from './Auth';
import { ApolloProvider } from '@apollo/react-hooks';

const {Paragraph, Title} = Typography;

class App extends React.Component {
    constructor(props){
        super(props);

    }
    render() {
        return (
            <ApolloProvider client={GraphQLClient}>
                {
                    AuthApi.isLoggedIn() ? <Title level={2}>
                        You are Logged In
                    </Title> : <Button type="primary" size="large" style={{margin: "10px"}} onClick={()=>AuthApi.login()}>
                        Login
                    </Button>
                }
                <Route path="/login" render={() => <AuthApi.LoginComponent />}/>
            </ApolloProvider>
        );
    }

}


export default withRouter(App);
