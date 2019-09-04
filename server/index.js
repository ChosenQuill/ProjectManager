const express = require('express');
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
const base = "/api/";


app.use(cors);

// console.log that your server is up and running
app.listen(port, () => console.log(`Listening on port ${port}`));

app.get(base, (req, res) => {
    res.send('Api is functional and ready');
});


// create a GET route
