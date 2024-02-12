const { default: mongoose } = require("mongoose");

const followSchema = new mongoose.Schema({
    emailUser : {
        type: String,
        required: true,
    },
    emailFriends : {
        type: String,
        required: true
        // default: []
    }
});

const userSchema = new mongoose.Schema({
    name : {
        type : String,
        required : true
    },
    email : {
        type : String,
        required : true,
        unique : true
    },
    password : {
        type : String,
        required : true
    },
    photo : {
        type : String,
        default : ''
    },
    desc : {
        type : String,
        default : ''
    },
    following : [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'collfollow'
    }]
});




const ModelUser = mongoose.model('colluser', userSchema);
const ModelFollow = mongoose.model('collfollow', followSchema);

module.exports = {ModelUser, ModelFollow};