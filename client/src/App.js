import React from 'react';
import './App.css';
import  { Button } from 'antd';

class App extends React.Component {
    componentDidMount() {
        fetch('api').then(value => value.text()).then(value => console.log(value));
    }

    render() {
        return (
            <div>
                <Button type='primary' onClick={()=>this.login()}>
                    Login
                </Button>
            </div>
        );
    }

    login() {
        console.log("logged in")
    }

}

export default App;
