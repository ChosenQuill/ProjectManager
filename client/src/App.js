import React from 'react';
import './index.css';

import 'antd/dist/antd.css';
import {Button, Typography} from "antd";
import {Route, withRouter} from "react-router-dom";
import Api from './Api';
import ApolloClient, {gql} from 'apollo-boost';
import { ApolloProvider } from '@apollo/react-hooks';

const {Paragraph, Title} = Typography;

const baseUrl = process.env.SITE_LOC;

const client = new ApolloClient({
    uri: baseUrl + 'api/data/',
});

class App extends React.Component {

    render() {
        return (
            <ApolloProvider client={client}>
                {
                    Api.isLoggedIn() ? <Title level={2}>
                        You are Logged In
                    </Title> : <Button type="primary" size="large" style={{margin: "10px"}} onClick={()=>Api.login()}>
                        Login
                    </Button>
                }
                <Route path="/login" render={() => <Api.LoginComponent />}/>
            </ApolloProvider>
        );
    }

}


export default withRouter(App);
