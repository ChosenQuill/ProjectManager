import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import * as serviceWorker from './serviceWorker';
import {Router} from "react-router-dom";
import index from './History';

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1)
};

ReactDOM.render(<Router history={index}><App /></Router>, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
