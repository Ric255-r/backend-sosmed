
// const { default: mongoose } = require('mongoose');
// const ModelUser = require('./users.js');

// // mongoose.connect('mongodb://127.0.0.1/db_sosmed').then((result) => {
// //     console.log('Connected to MongoDB');
// // }).catch((error) => {
// //     console.log(error);
// // });

// const followSchema = new mongoose.Schema({
//     emailUser : {
//         type: String,
//         required: true
//     },
//     emailFriends : {
//         type: Array,
//         default: []
//     }
// });

// const ModelFollow = mongoose.model('collfollow', followSchema);

// // ModelFollow.insertMany([
// //     {
// //         emailUser: "Ricardo",
// //         emailFriends: [
// //             "lala"
// //         ]
// //     }
// // ]);

// module.exports = ModelFollow;