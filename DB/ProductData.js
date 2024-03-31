const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    id:{
        type:Number
    },
    title:{
        type:String
    },
    price:{
        type:String
    },
    description:{
        type:String
    },
    category:{
        type:String
    },
    image:{
        type:String
    },
    sold:{
        type:Boolean
    },
    dateOfSale:{
        type:Date
    }

})

module.exports = mongoose.model('Productinfo', productSchema);