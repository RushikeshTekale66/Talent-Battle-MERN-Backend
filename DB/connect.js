const mongoose = require('mongoose');
require('dotenv').config();

const DatabaseUrl = process.env.DatabaseUrl;

const url = DatabaseUrl;

mongoose.connect(url).then(()=>console.log("Connected to database")).catch((e)=>console.log("Error : ", e));