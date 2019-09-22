const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();

// Routes
app.use(cors());

app.use('/api/auth', require('./api/auth'));

app.use('/api/data',require('./api/data'))


app.get('/', (req, res) => {
    res.status(200).send("The server is up and running.")
});


app.listen(5000, () => {
    console.info('Running on port 5000');
});