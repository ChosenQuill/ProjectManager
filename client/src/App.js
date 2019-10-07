import React from 'react';
import './App.scss';
import './Normalize.css';

import logo from './logo.png';

import {Layout, Typography} from "antd";
import {Route, withRouter, Switch} from "react-router-dom";
import {ApolloProvider} from '@apollo/react-hooks';

import {AuthApi, GraphQLClient, LevelManager} from './Auth';
import ProjectDisplay from './ProjectDisplay';
import Manager from './Manager';

const {Paragraph, Title, Text} = Typography;
const {Header, Content, Footer, Sider} = Layout;


class App extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <ApolloProvider client={GraphQLClient}>
                <LevelManager>
                    <Route path="/login" render={() => <AuthApi.LoginComponent/>}/>
                    <Header className='header'>
                        <a className='logo' href='https://www.suredroid.com'>
                            <img src={logo} style={{height: '65%'}}/>
                            <span className='logoText link'>
                                    SUREDROID
                            </span>
                        </a>
                    </Header>
                    <Content id='content'>
                        <Switch>
                            <Route path='/' exact component={ProjectDisplay}/>
                            <Route path='/admin' component={Manager}/>
                        </Switch>
                    </Content>
                </LevelManager>
            </ApolloProvider>
        );
    }

}


export default withRouter(App);
