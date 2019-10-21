import React from 'react';
import './App.scss';
import './Normalize.css';

import logo from './assets/logo.png';

import {Layout, Typography} from "antd";
import {Route, withRouter, Switch, Redirect} from "react-router-dom";
import {ApolloProvider} from '@apollo/react-hooks';

import {AuthApi, GraphQLClient, LevelManager} from './Auth';
import Manager from './Pages/Manager';
import Intro from "./Pages/Intro";

const {Paragraph, Title, Text} = Typography;
const {Header, Content, Footer, Sider} = Layout;


class App extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <ApolloProvider client={GraphQLClient}>

                    <Header className='header'>
                        <a className='logo' href='https://www.suredroid.com'>
                            <img src={logo} style={{height: '65%'}}/>
                            <span className='logoText link'>
                                    SUREDROID
                            </span>
                        </a>
                    </Header>
                    <Layout>
                        <Switch>
                            <Route path='/' exact component={Intro}/>
                            <Route path={['/home','/settings','/project','/billing']} component={Manager}/>
                            <Route path='/login' component={AuthApi.LoginComponent}/>

                            {/*---- ToDo (Billing, Pricing) ----*/}
                            <Route path='/pricing' />

                            <Route render={()=><Redirect to='/' />}/>
                        </Switch>
                    </Layout>
            </ApolloProvider>
        );
    }

}


export default withRouter(App);
