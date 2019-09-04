import React from 'react';
import logo from './logo.svg';
import './App.css';

class App extends React.Component {
    componentDidMount() {
        fetch('api').then(value => value.text()).then(value => console.log(value));
    }

    render() {
        return (
            <div className="App">
                <header className="App-header">
                    <img src={logo} className="App-logo" alt="logo"/>
                    <p>

                    </p>
                    <a
                        className="App-link"
                        href="https://reactjs.org"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Learn React
                    </a>
                </header>
            </div>
        );
    }

}

export default App;
