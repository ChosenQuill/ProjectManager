import React from 'react';
import './App.scss';
import './Normalize.css';

import logo from './assets/logo.png';

import {Card, Layout, Typography} from "antd";
import {Redirect, Route, Switch, withRouter} from "react-router-dom";
import {ApolloProvider} from '@apollo/react-hooks';

import {AuthApi, GraphQLClient, RoleManager} from './Auth';
import Manager from './Pages/Manager';
import Intro from "./Pages/Intro";
import Profile from "./Components/Profile";

const {Paragraph, Title, Text} = Typography;
const {Header, Content, Footer, Sider} = Layout;

class App extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <ApolloProvider client={GraphQLClient}>
                <RoleManager>
                    <Header className='header'>
                        <a className='logo' href='https://www.suredroid.com'>
                            <img src={logo} style={{height: '65%'}}/>
                            <span className='logoText link'>
                                SUREDROID
                            </span>
                        </a>
                        <Profile/>
                    </Header>
                    <Layout>
                        <Switch>
                            <Route path='/' exact component={Intro}/>
                            <Route path={['/home', '/settings', '/project', '/billing']} component={Manager}/>
                            <Route path={['/login', '/signup']} component={AuthApi.LoginComponent}/>
                            {/*---- ToDo (Billing, Pricing) ----*/}
                            <Route path='/pricing'/>

                            <Route path='/tos' component={Tos}/>
                            <Route path='/terms' render={() => <Redirect to='/tos'/>}/>

                            <Route render={() => <Redirect to='/'/>}/>
                        </Switch>
                    </Layout>
                    <Footer style={{textAlign: 'center'}}>Copyright © SureDroid</Footer>
                </RoleManager>
            </ApolloProvider>
        );
    }

}

function Tos(props) {
    return (
        <Card className='card'>
            <Title level={2}>
                Terms And Conditions
            </Title>
            <Paragraph>
                Hello, and thank you for using our project management service! We are glad that you are here. Please
                read this terms of service agreement carefully before creating an accessing or using the Project Manager
                service.

                ("Service"). SureDroid ("SureDroid", "we", "us", "our") provides the service to you (the user), subject
                to the following terms of service (TOS), which may be updated at any time without notice.
            </Paragraph>
            <Title level={4}>Definitions:</Title>
            <Paragraph>
                The "Service", "Project Management Service", "SureDroid Project Manager" refers to the service provided
                on this website by SureDroid.

                "SureDroid", "We", and "Us" refers to SureDroid.

                “The User,” “You,” and “Your” refer to the individual person, company, or organization that has visited
                or is using the Website or Service; that accesses or uses any part of the Account; or that directs the
                use of the Account in the performance of its functions. A User must be at least 13 years of age.

                An "Account" represents your legal relationship with GitHub. A “User Account” represents an individual
                User’s authorization to log in to and use the Service and serves as a User’s identity on SureDroid
                Project Manager. “Organizations” are shared workspaces that may be associated with a single entity or
                with one or more Users where multiple Users can collaborate across many projects at once. A User Account
                can be a member of any number of Organizations.
            </Paragraph>
            <Paragraph>
                Don’t misuse our Services. For example, don’t interfere with our Services or try to access them using a
                method other than the interface and the instructions that we provide. You may use our Services only as
                permitted by law, including applicable export and re-export control laws and regulations. We may suspend
                or stop providing our Services to you if you do not comply with our terms or policies or if we are
                investigating suspected misconduct.

                Using our Services does not give you ownership of any intellectual property rights in our Services or
                the content you access. You may not use content from our Services unless you obtain permission from its
                owner or are otherwise permitted by law. These terms do not grant you the right to use any branding or
                logos used in our Services. Don’t remove, obscure, or alter any legal notices displayed in or along with
                our Services.
            </Paragraph>
            <Paragraph>
                Our <a href='https://pm.suredroid.com/privacy'>Privacy Policy
                (https://pm.suredroid.com/privacy)</a> describes how we handle the information you provide to us when
                you use our Services. You understand that through your use of the Services you consent to the collection
                and use (as set forth in the Privacy Policy) of this information.
            </Paragraph>
        </Card>
    )
}


export default withRouter(App);
