const express = require('express');
require('./DB/connect')

const app = express();

const port = 5000;

app.get('/', (req, res)=>{
    res.send("App is live");
})

app.listen(port);