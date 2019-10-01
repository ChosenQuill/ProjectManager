import React, {useEffect, useRef, useState} from 'react';
import './App.css';

import {Button, Card, Col, Icon, Layout, Menu, message, Row, Typography} from "antd";
import {motion, useAnimation} from 'framer-motion';
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

const slidingVariants = {
    main: {
        opacity: [0, 1, 0],
        y: [-50, 0, 50]
    },
    finish: {
        opacity: [0, 1, 1],
        y: [-50, 0, 0]
    },
    empty: {
        // opacity: 0
    },
};

const text = [
    'Director',
    'Developer',
    'Designer',
    'Video Editor',
    'Content Producer',
    'Creator'
];

function SlidingText(props) {
    const controls = useAnimation();
    const [cPos, setCPos] = useState(-1);
    const latestPos = useRef(null);
    const stopText = useEffect(() => {
        const loopCode = (interval) => {
            setCPos(c => {
                latestPos.current = c + 1;
                return c + 1;
            });
            if (latestPos.current >= text.length - 1 && interval) {
                clearInterval(interval);
                controls.start('finish');
            } else {
                controls.start('main');
            }

        };
        loopCode();
        const interval = setInterval(() => {
            loopCode(interval);
        }, 5000);
        return () => {
            clearInterval(interval);
        };
    }, []);

    return (
        <div style={{width: '100vw', textAlign: 'center', outlineStyle: 'solid', height: '200px'}}>
            <div style={{
                fontSize: '48px',
                fontFamily: '\'IBM Plex Sans\', sans-serif',
                position: 'absolute',
                width: '700px',
                // outlineStyle: 'solid',
                textAlign: 'left',
                display: 'inline-block',
                transform: 'translateX(-40%)',
            }}>
                <div>
                    Hi, my name is Rithvik.
                </div>
                <div style={{marginLeft: '100px'}}>
                    <div style={{float: 'left', display: 'inline-block'}}>
                        I am a&nbsp;
                    </div>
                    <motion.div style={{display: 'inline-block'}} initial='empty' animate={controls}
                                transition={{duration: 5, ease: 'anticipate'}} variants={slidingVariants}>
                        {text[cPos]}.
                    </motion.div>
                </div>
            </div>
        </div>

    );
}


class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            sideBarCollapsed: false,
        };
        this.toggleSidebar = this.toggleSidebar.bind(this);
    }

    toggleSidebar() {

        this.setState({sideBarCollapsed: !this.state.sideBarCollapsed})
    }

    render() {
        return (
            <ApolloProvider client={GraphQLClient}>
                <LevelManager>
                    <div id='page'>
                        <Header style={{background: '#fff'}} className='header'>
                            <Icon
                                className="sideBarTrigger"
                                type={this.state.sideBarCollapsed ? 'menu-unfold' : 'menu-fold'}
                                onClick={this.toggleSidebar}
                            />
                        </Header>
                        <div className='content'>
                            <SlidingText/>
                            <Card className='card'>
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
                                    <div>
                                        <Profile/>
                                        <Row>
                                            <Paragraph style={{fontSize: '24px'}}>
                                                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                                                eiusmod
                                                tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
                                                veniam,
                                                quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
                                                commodo
                                                consequat. Duis aute irure dolor in reprehenderit in voluptate velit
                                                esse
                                                cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
                                                cupidatat
                                                non proident, sunt in culpa qui officia deserunt mollit anim id est
                                                laborum.
                                            </Paragraph>
                                        </Row>
                                    </div>
                                </LevelCheck>
                            </Card>

                        </div>
                    </div>
                </LevelManager>
            </ApolloProvider>
        );
    }

}


export default withRouter(App);
