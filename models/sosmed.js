const { default: mongoose } = require("mongoose");
const moment = require('moment-timezone');

const sosmedSchema = new mongoose.Schema({
    title : {
        type : String,
        required : true
    },
    body : {
        type : String,
        required : true
    },
    image : {
        type : Array,
        default : []
    },
    author : {
        type : Object,
        required : true
    },
    comment : {
        type : Array,
        default : []
    },
    liked : {
        type : Array,
        default : []
    },
    date : {
        type : Date,
        default : Date.now()
    },
    tags : {
        type : String,
        default : ''
    },
    slug : {
        type : String,
        required : true
    }
});

const ModelSosmed = mongoose.model('collsosmed', sosmedSchema);

module.exports = ModelSosmed;