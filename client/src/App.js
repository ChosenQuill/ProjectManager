import React, {useState} from 'react';
import './App.css';

import {Button, Card, Col, Icon, Layout, Menu, message, Row, Typography} from "antd";
import {Route, withRouter} from "react-router-dom";
import {AuthApi, AuthLevel, GetRoles, GraphQLClient, LevelCheck, LevelManager} from './Auth';
import {ApolloProvider, useQuery} from '@apollo/react-hooks';
import {gql} from 'apollo-boost';
import Loading from "./Components/Loading";

const {Paragraph, Title, Text} = Typography;
const {Header, Content, Footer, Sider} = Layout;

const ProfileQuery = gql`
    query getProfile {
        me {
            name,
            avatarUrl,
        }
    }
`;

function Profile() {
    const {loading, error, data} = useQuery(ProfileQuery);
    const [errorDisplayed, setErrorDisplayed] = useState(false);
    if (loading)
        return (<Loading/>)
    if (error && !errorDisplayed) {
        console.log(error.message);
        message.error(error.message, 20);
        setErrorDisplayed(true);
    }
    console.log(data);
    return (
        <Row type='flex' justify='center' align='middle' style={{marginBottom: '20px'}}>
            <img src={data.me.avatarUrl} alt='Image Here'
                 style={{float: 'left', marginRight: '30px', width: '90px', borderRadius: '20%'}}/>
            <Title level={1} style={{margin: 0}}>Welcome<br/>{data.me.name}!</Title>
        </Row>
    );
}


class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            sideBarCollapsed: false,
        }
    }

    toggleSidebar() {
        this.setState({sideBarCollapsed: !this.state.sideBarCollapsed})
    }

    render() {
        return (
            <ApolloProvider client={GraphQLClient}>
                <LevelManager>
                    <Layout>
                        <Sider trigger={null} collapsible collapsed={this.state.collapsed}>
                            <div className="logo"/>
                            <Menu theme="dark" mode="inline" defaultSelectedKeys={['1']}>
                                <Menu.Item key="1">
                                    <Icon type="user"/>
                                    <span>nav 1</span>
                                </Menu.Item>
                                <Menu.Item key="2">
                                    <Icon type="video-camera"/>
                                    <span>nav 2</span>
                                </Menu.Item>
                                <Menu.Item key="3">
                                    <Icon type="upload"/>
                                    <span>nav 3</span>
                                </Menu.Item>
                            </Menu>
                        </Sider>
                        <Header style={{background: '#fff', padding: 0}}>
                            <Icon
                                className="trigger"
                                type={this.state.collapsed ? 'menu-unfold' : 'menu-fold'}
                                onClick={this.toggle}
                            />
                        </Header>
                        <Content style={{height: '100%'}}>
                            <Card style={{margin: '20px'}}>
                                <GetRoles children={({roles, status}) => {
                                    let loggedIn = false;
                                    if (roles.includes('MEMBER'))
                                        loggedIn = true;
                                    return (
                                        <div>
                                            <Title level={4} type={"secondary"}>
                                                Logged In: {loggedIn ? 'True' : 'False'} | Auth Status: {status}
                                            </Title>
                                            {
                                                loggedIn ?
                                                    <Button onClick={() => AuthApi.logout()} type='primary'>Log
                                                        Out</Button> :
                                                    <Button type='primary' onClick={() => AuthApi.login()}>Log
                                                        In</Button>
                                            }
                                        </div>

                                    )
                                }}/>

                                <Route path="/login" render={() => <AuthApi.LoginComponent/>}/>
                                <LevelCheck level={AuthLevel.MEMBER}>
                                    <Profile/>
                                    <Row>
                                        <Paragraph style={{fontSize: '24px'}}>
                                            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
                                            tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
                                            veniam,
                                            quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
                                            consequat. Duis aute irure dolor in reprehenderit in voluptate velit
                                            esse
                                            cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
                                            cupidatat
                                            non proident, sunt in culpa qui officia deserunt mollit anim id est
                                            laborum.
                                        </Paragraph>
                                    </Row>
                                </LevelCheck>
                            </Card>
                        </Content>

                    </Layout>
                </LevelManager>
            </ApolloProvider>
        );
    }

}


export default withRouter(App);
