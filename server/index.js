const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();

// Routes
app.use(cors());

app.use('/api/auth', require('./api/auth'));

app.use((err, req, res, next) => {
    switch (err.message) {
        case 'NoCodeProvided' || 'NoTokenProvided':
            return res.status(400).send({
                status: 'ERROR',
                error: err.message + " | " + "Bad Request",
            });
        case 'Unauthorized':
            return res.status(401).send({
                status: 'ERROR',
                error: err.message + " | " + "Not Authorized to perform this request."
            });
        default:
            return res.status(500).send({
                status: 'ERROR',
                error: err.message,
            });
    }
});


app.get('/', (req, res) => {
    res.status(200).send("The server is up and running.")
});


app.listen(5000, () => {
    console.info('Running on port 5000');
});