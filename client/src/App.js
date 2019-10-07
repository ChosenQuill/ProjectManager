import React, {useEffect, useRef, useState} from 'react';
import './App.css';
import './Normalize.css';

import logo from './logo.png';

import {Button, Card, Icon, Layout, message, Row, Typography} from "antd";
import {Route, withRouter} from "react-router-dom";
import {ApolloProvider, useQuery} from '@apollo/react-hooks';
import {gql} from 'apollo-boost';
import {motion, useAnimation} from 'framer-motion';

import {AuthApi, AuthLevel, GetRoles, GraphQLClient, LevelCheck, LevelManager} from './Auth';
import Loading from "./Components/Loading";
import ParticleBackground from './Components/ParticleBackground'

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
        return (<Loading/>);
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
        <div style={{height: '80vh', width: '100vw', display: 'flex', justifyContent: 'center', alignItems: 'center', pointerEvents: 'none'}}>
            <div style={{
                fontSize: '3vw',
                fontFamily: '\'IBM Plex Sans\', sans-serif',
                width: '40vw',
                textAlign: 'left',
                transform: 'translate(15%,5%)',
                margin: 0
            }}>
                <div>
                    Hi, my name is Rithvik.
                </div>
                <div>
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
                        <ParticleBackground/>
                        <SlidingText/>
                    </Content>
                </LevelManager>
            </ApolloProvider>
        );
    }

}


export default withRouter(App);
