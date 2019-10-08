import React from 'react';
import './App.scss';
import './Normalize.css';

import logo from './assets/logo.png';

import {Layout, Typography} from "antd";
import {Route, withRouter, Switch, Redirect} from "react-router-dom";
import {ApolloProvider} from '@apollo/react-hooks';

import {AuthApi, GraphQLClient, LevelManager} from './Auth';
import ProjectDisplay from './Pages/ProjectDisplay';
import Manager from './Pages/Manager';

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
                            <Route path='/login' component={AuthApi.LoginComponent}/>
                            <Route render={()=><Redirect to='/' />}/>
                        </Switch>
                    </Content>
                </LevelManager>
            </ApolloProvider>
        );
    }

}


export default withRouter(App);
