import React, {useState} from 'react';
import './App.css';

import {Button, Card, Col, Layout, message, Row, Typography} from "antd";
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
        <Row type='flex' justify='center' align='middle' style={{marginBottom:'24px'}}>
            <Col span={6}>
                <img src={data.me.avatarUrl} alt='Image Here'
                     style={{float: 'left', marginRight: '30px', width: '25%', borderRadius: '20%'}}/>
                <Title level={1} style={{margin: 0}}>Welcome {data.me.name}!</Title>
            </Col>
        </Row>
    );
}

class App extends React.Component {
    constructor(props) {
        super(props);

    }

    render() {
        return (
            <ApolloProvider client={GraphQLClient}>
                <LevelManager>
                    <Layout className='layout'>
                        <Content>
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
                                            tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
                                            quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
                                            consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse
                                            cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat
                                            non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
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
