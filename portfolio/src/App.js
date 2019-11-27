import React from 'react';
import {ApolloProvider} from '@apollo/react-hooks';
import ApolloClient, {InMemoryCache} from "apollo-boost";
import './App.scss';
import logo from "./assets/logo.png";
import ProjectDisplay from "./ProjectDisplay";
import {Layout} from 'antd';

const {Header, Content, Footer, Sider} = Layout;
const SITE_LOC = 'http://localhost:5000';

export const GraphQLClient = new ApolloClient({
  uri: SITE_LOC + '/api/data/',
  cache: new InMemoryCache(),
  request: (operation) => {
    const token = localStorage.getItem('token');
    operation.setContext({
      headers: {
        id: ''
      }
    })
  }
});

function App() {
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
      <Content id='content'>
        <ProjectDisplay/>
      </Content>
    </ApolloProvider>
  );
}

export default App;
