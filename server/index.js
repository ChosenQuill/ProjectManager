const express = require('express');
const cors = require('cors');
const {getDB, connect} = require('./database');
const app = express();

connect().catch((err) => {
    console.log(err);
    process.exit(-2);
});

// Routes
app.use(cors());

app.use('/api/auth', require('./api/auth').router);
app.use('/api/auth',(err, req, res, next) => {
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
            console.log(err)
            return res.status(500).send({
                status: 'ERROR',
                error: err.message,
            });
    }
});

require('./api/data').applyMiddleware({app, path: "/api/data"});

app.get('/', (req, res) => {
    res.status(200).send("The server is up and running.")
});


app.listen(5000, () => {
    console.info('Running on port 5000');
});

// If the Node process ends, close the Mongoose connection
process.on('SIGINT', function() {
    getDB().close(function () {
        console.log('Server default connection disconnected through app termination');
        process.exit(0);
    });
});
