const express = require('express');
// Method Override for handling PUT and DELETE requests from forms
const methodOverride = require('method-override');
const { default: mongoose } = require('mongoose');
const jwt = require('jsonwebtoken')
const dotenv = require('dotenv');
const CryptoJS = require('crypto-js');
const authjs = require('./middleware/auth.js');
// Untuk Handle FOrmData
const mutler = require('multer');
const sharp = require('sharp');
const upload = mutler({dest: 'uploads/profilePhoto'});
// End Handle Form Data
const cors = require('cors');

// Panggil Env
dotenv.config();

// access config var
process.env.TOKEN_SECRET;

const app = express();
// ini require route posts.js supaya ga nyemak di index.js
require('./posts.js')(app);
// end require

// Mengabaikan CORS Error
// Cara 1
// app.use((req, res, next) => {
//     res.setHeader('Access-Control-Allow-Origin', '*');
//     res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
//     res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
//     next();
// });
// Cara 2
app.use(cors());
// End Mengabaikan



// Panggil Model
const User = require('./models/users.js');
const ModelSosmed = require('./models/sosmed.js');

const ModelUser = User.ModelUser;
const ModelFollow = User.ModelFollow;

// Connect DB
mongoose.connect('mongodb://127.0.0.1/db_sosmed').then((result) => {
    console.log('Connected to MongoDB');
}).catch((error) => {
    console.log(error);
});

// Fungsi Sign Token
// Referensi https://www.digitalocean.com/community/tutorials/nodejs-jwt-expressjs
function generateAccessToken(user){
    return jwt.sign(user, process.env.TOKEN_SECRET, { expiresIn : '1800s'});
}

// Utk timpa method form biar bisa PUT/PATCH/DELETE
app.use(methodOverride('_method'));
// End

// Supaya Bisa CRUD di Frontend pakai React
// Pas di React axios, passing header content type application/json
// Referensi https://stackoverflow.com/questions/24543847/req-body-empty-on-posts
// Kalo Ga pake ini, isi dari req.body bakal kosong
app.use(express.json());
// End

// Ambil CRUD dari Body Request method form-urlencoded di postman
app.use(express.urlencoded({ extended: true }));
// End

// Encrypt Decrypt Pass pake Base64 Encoding with JavaScript
// Dalam Parameternya wajib ada key juga isi apapun bebas, tapi wajib sama antara enc dan decrypt.
// cth key bebas saya isi 'share'. idk kenapa akwkwwkwk
// Referensi :
// https://www.labnol.org/code/encrypt-decrypt-javascript-200307 
// https://github.com/brix/crypto-js/issues/271
const encrypt = (pass, key = 'share') => {
    let encJson = CryptoJS.AES.encrypt(JSON.stringify(pass), key).toString();
    let encData = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(encJson));
    return encData;
}

const decrypt = (pass, key = 'share') => {
    let decData = CryptoJS.enc.Base64.parse(pass);
    let bytes = CryptoJS.enc.Utf8.stringify(decData);
    let decJson = CryptoJS.AES.decrypt(bytes, key).toString(CryptoJS.enc.Utf8);
    return JSON.parse(decJson);
}
// End Encrypt Decrypt

app.post('/api/login', (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    ModelUser.findOne({email : email}).then((result) => {
        if(password === decrypt(result.password, 'share')){
            // generate token berdasarkan Email & Name.
            const token = generateAccessToken({ 
                email : email, 
                name : result.name, 
                photo : result.photo ? result.photo : null 
            });

            res.send({ 
                email : email, 
                name : result.name, 
                photo: result.photo, 
                token : token 
            });
        }else{
            // res.send('Cek Kembali Email / Pass Anda', 401);
            return res.status(403).send({
                message: 'Cek Kembali Email / Pass Anda'
            });
        }
    }).catch((error) => {
        // res.send(error, 401);
        return res.status(404).send({
            message: 'Email Tidak Ditemukan!'
        });
    });

});

app.post('/api/register', async (req, res) => {
    // console.log(req.body);
    
    const user = new ModelUser({
        name: req.body.name,
        email: req.body.email,
        password: encrypt(req.body.password)
    });

    const result = await user.save();
    if(result){
        res.send({result: result});
    }
});

app.get('/api/me', authjs.authenticateToken, async (req, res) => {
    // console.log(req.user);
    const getUser = await ModelUser.findOne({ email : req.user.email }).populate('following');
    res.send(getUser);

    // res.send({user : req.user.name, email : req.user.email});
});

app.get('/api/users', authjs.authenticateToken, async(req, res) => {
    const getUser = await ModelUser.find({});
    res.send(getUser);
});

app.post('/api/addFriend', authjs.authenticateToken, async(req, res) => {
    try {
        const user = await ModelUser.findOne({ email: req.user.email }).populate('following');
        const cekFollow = await ModelFollow.findOne({ 
            emailFriends: req.body.emailFriends,
            emailUser: req.user.email 
        });

        let isFollow;
        let isFollBack = false; // awalnya ku true kan, lalu di ifnya ku falsekan. ini logikany ku balik aj  biar sinkron sm index.jsx

        if(!cekFollow){
            const follow = new ModelFollow({
                emailUser: req.user.email,
                emailFriends: req.body.emailFriends
            });
    
            await follow.save();
    
            // Masukkin objectId dari ModelFollow ke field collusers.following
            user.following.push(follow._id);
            await user.save();

            isFollow = true;


        }else{
            let index = 0;
            user.following.map((items, i) => {
                if(items.emailFriends === cekFollow.emailFriends){
                    index = i;
                }
            });
            let delFollow = user.following;
            delFollow.splice(index, 1);

            await ModelUser.findOneAndUpdate({ email: req.user.email }, 
                { following: delFollow });

            await ModelFollow.deleteOne({ _id: cekFollow._id});
            
            isFollow = false;
        }

        // Code Berarray. Ini Sudah Jalan, Tapi Ku Ubah
        // if(!cekFollow){
        //     // Logika Follow kalau collusers baru pertamakali follow orang & collfollows msh kosong
        //     const follow = new ModelFollow({
        //         emailUser: req.user.email,
        //         emailFriends: [
        //             req.body.emailFriends
        //         ]
        //     });
    
        //     await follow.save();
    
        //     // Masukkin objectId dari ModelFollow ke field collusers.following
        //     user.following.push(follow._id);
        //     await user.save();
        // }else{
        //     // Logika Follow ketika collusers sudah ada follow orng, lalu mw di push lg ke collfollows.
        //     let arrFollow = cekFollow.emailFriends;

        //     if(!arrFollow.includes(req.body.emailFriends)){
        //         arrFollow.push(req.body.emailFriends);

        //         await ModelFollow.findOneAndUpdate({ emailUser: req.user.email}, 
        //             { emailFriends : arrFollow});
    
        //         if(!user.following.includes(cekFollow._id)){
        //             user.following.push(cekFollow._id);
        //             await user.save();
        //         }
        //     }else{
        //         // Logika Unfoll
        //         let cariIndex = arrFollow.findIndex(item => item === req.body.emailFriends);

        //         //urutan params = (mau taruh diindex brp, ada yg mw diilangin? klo gk ad = 0 else 1 utk update, isi kontennya); kalo params tengah isi 1 maka dia hapus array awal lalu update 1 konten array, kalo isi 0 maka dia nambah konten array ke variable cariIndex.
        //         // Selengkapnya cari di folder belajar JS Pemula
        //         arrFollow.splice(cariIndex, 1);

        //         await ModelFollow.findOneAndUpdate({ emailUser: req.user.email}, 
        //             { emailFriends : arrFollow});
                    
        //         // return res.status(404).send({
        //         //     message: "Double Woi"
        //         // });
        //     }


        // }
        const another = await ModelUser.find({ email : { $nin : req.user.email }}).populate('following');
        const relasi = await ModelUser.findOne({email : req.user.email}).populate('following');
        const targetUser = await ModelUser.findOne({ email: req.body.emailFriends }).populate('following');
        const targetUserNotIn = await ModelUser.find({ email : { $nin : req.body.emailFriends }}).populate('following');

        if(targetUser.following.some((items) => items.emailFriends === req.user.email && items.emailUser === req.body.emailFriends)){
            isFollBack = true; // ini awalnya ku falsekan. lalu di variable line 167 ku truekan.
        }

        res.send({
            userlain : another, 
            relasi: relasi,
            otherPeople : {
                targetUser: targetUser,
                targetUserNotIn: targetUserNotIn
            },
            isFollow: isFollow,
            isFollBack: isFollBack // ini untuk viewOtherPeople
        });

    } catch (err) {
        return res.status(404).send({
            message: err
        });
    }
});

app.get('/api/getUser', authjs.authenticateToken, async(req, res) => {
    // Get Email dan Id Dulu
    const { idProfilenya } = req.query;
    const target = await ModelUser.findById(idProfilenya);
    // console.log(idProfilenya);
    
    // Dari Api/me    
    const getUserTarget = await ModelUser.findOne({ email : target.email }).populate('following');
    const getUserLogin = await ModelUser.findOne({email: req.user.email}).populate('following');

    // Ini Bener, ceritanya mau cari following dari user yg login, 
    // lalu ngecek apkh emailfriendsnya sesuai dgn targetemail
    // let isFollow = false;
    // getUserLogin.following.map((items, i) => {
    //     if(items.emailFriends == target.email){
    //         isFollow = true;
    //     }
    // });
    // Ku Komen karena logikany udh dpt di React.. ini salah bodo smpe tdr jam 3 subuh
    // 27/12/2023

    let isFollBack = false; // awalnya ku truekan.

    if(getUserTarget.following.some((items) => items.emailFriends === req.user.email && items.emailUser === target.email)){
        isFollBack = true; // Untuk ViewOtherPeople. awalny ku falsekan.
    }

    // Dari Api/Posts/Profile
    const sosmed = await ModelSosmed.find({
        'author.email' : target.email
    }).sort({date:-1});
    
    // Dari api/anotherpeople
    const targetUserNotIn = await ModelUser.find({ email : { $nin : target.email }}).populate('following');
    // Relasi sama dgn getUser, makanya tak komen.
    // const relasi = await ModelUser.findOne({email : target.email }).populate('following');

    // ResSend Semuanya
    res.send({
        getUser : getUserTarget,
        sosmed : sosmed,
        otherPeople : {
            targetUser: getUserTarget,
            targetUserNotIn: targetUserNotIn
        },
        getUserLogin: getUserLogin,
        // isFollow: isFollow,
        isFollBack : isFollBack
    })
})


app.put('/api/updateProfile', upload.single('photo'), authjs.authenticateToken, async (req, res) => {
    if(req.file !== undefined){
        // Fungsi Convert jadi PNG;
        const { path } = req.file;
        const newPath = `${path}.png`; // Ubah Extensi ke .png

        await sharp(path).toFile(newPath); // Convert gbr ke png

        const filePaths = newPath; // Hasil Konversi gbr ke png
        // End Fungsi

        const updateUser = await ModelUser.findOneAndUpdate({ email : req.user.email} , {
            name : req.body.name,
            desc : req.body.desc,
            photo : filePaths
        });

        if(updateUser){
            const getUser = await ModelUser.findOne({ email : req.user.email });
            res.send(getUser);
        }else{
            return res.status(404).send({
                message: 'Error'
            });
        }
    }else{
        const updateUser = await ModelUser.findOneAndUpdate({ email : req.user.email} , {
            name : req.body.name,
            desc : req.body.desc
        });

        if(updateUser){
            const getUser = await ModelUser.findOne({ email : req.user.email });
            res.send(getUser);
        }else{
            return res.status(404).send({
                message: 'Error'
            });
        }
    }

});

app.get('/api/anotherpeople', authjs.authenticateToken, async (req, res) => {
    const another = await ModelUser.find({ email : { $nin : req.user.email }}).populate('following');
    const relasi = await ModelUser.findOne({email : req.user.email}).populate('following');
    res.send({userlain : another, relasi: relasi});
}); 

app.post('/api/logout', authjs.destroyToken, (req, res) => {
    res.send(`Logged out ${req.user}`);
});

app.listen(3000, function() {
    console.log('Berhasil');
});

