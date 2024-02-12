const authjs = require('./middleware/auth.js');
const ModelSosmed = require('./models/sosmed.js');
const User = require('./models/users.js');
const ModelUser = User.ModelUser;
// Method Override for handling PUT and DELETE requests from forms
const methodOverride = require('method-override');
const express = require('express');
// Untuk Handle FOrmData
const mutler = require('multer');
const sharp = require('sharp');
const upload = mutler({dest: 'uploads/'});
const moment = require('moment-timezone');
const fs = require('fs');
// End Handle Form Data

// Buat Bypass CORS Error
const cors = require('cors');
// End

module.exports = function(app){
    // Kedua fungsi ini supaya bisa isi req.body. bisa lewat json/urlencoded
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    // end Kedua fungsi

    // Pakai Ini supaya bisa baca url /uploads utk Foto
    app.use('/uploads', express.static('uploads'));
    // End Pakai

    app.use(cors());

    app.get('/api/posts', authjs.authenticateToken, async (req, res) => {
        const sosmed = await ModelSosmed.find({}).sort({date:-1});
        res.send(sosmed);
    });

    app.get('/api/posts/profile', authjs.authenticateToken, async (req, res) => {
        const sosmed = await ModelSosmed.find({
            'author.email' : req.user.email
        }).sort({date:-1});
        
        res.send(sosmed);
    });

    // app.get('/api/posts/otherProfile', authjs.authenticateToken, async(req, res) => {
    //     const {idProfile} = req.query;
    //     const Usernya = await ModelUser.findById(idProfile);

    //     const sosmed = await ModelSosmed.find({
    //         'author.email' : Usernya.email
    //     }).sort({date:-1});
        
    //     res.send(sosmed);
    // });

    app.put('/api/comment/:slug', authjs.authenticateToken, async (req,res) => {
        const sosmed = await ModelSosmed.findOne({slug : req.params.slug });
        let comment = sosmed.comment;

        // Returns a random integer from 1 to 1000:
        const randomize = Math.floor(Math.random() * 1000) + 1;

        comment.push({
            id : req.body.isicomment.split(' ').join('_').substr(0, 6) + randomize,
            // name : req.user.name,
            email : req.user.email,
            // profilePhoto : req.user.photo,
            isicomment : req.body.isicomment,
            date : Date.now()
        });

        const newComment = await ModelSosmed.findOneAndUpdate({slug : req.params.slug}, {
            comment : comment
        });

        if(newComment){
            const loadMenu = await ModelSosmed.find({}).sort({date:-1});
            res.send({
                menu : loadMenu,
                sosmed : sosmed
            });
        }else{
            return res.status(404).send({
                message: 'Gagal menyimpan data'
            });
        }
    });

    app.put('/api/updatelike/:slug', authjs.authenticateToken, async (req, res) => {
        // let updateLike = null;

        let checkLike = req.body.liked;

        const sosmed = await ModelSosmed.findOne({ slug: req.params.slug });

        if(checkLike){            
            const randomize = Math.floor(Math.random() * 1000) + 1;

            let arrliked = sosmed.liked;

            // Unshift sama kaya push. kalo unshift dia isi ke array paling pertama
            arrliked.unshift({
                idlike: req.user.name.split(' ').join('_').substr(0, 6) + randomize,
                email: req.user.email,
                name: req.user.name,
                status: true
            })

            const like = await ModelSosmed.findOneAndUpdate({ slug: req.params.slug },
                { liked : arrliked }
            );

            if (like) {
                const loadMenu = await ModelSosmed.find({}).sort({ date: -1 });
                res.send({
                    menu: loadMenu,
                    sosmed : sosmed
                });
            }

        }else{
            let liked = sosmed.liked;
            const cariIndex = liked.findIndex(item => item.email === req.user.email);

            liked.splice(cariIndex, 1);
    
            const newLiked = await ModelSosmed.findOneAndUpdate({ slug : req.params.slug }, {
                liked : liked
            });

            if(newLiked){
                const loadMenu = await ModelSosmed.find({}).sort({date:-1});
                res.send({
                    menu : loadMenu,
                    sosmed : sosmed
                });

            }else{
                return res.status(404).send({
                    message: 'Gagal menyimpan data'
                });
            }


        }


    
        // try {
        //     const sosmed = await ModelSosmed.findOne({ slug: req.params.slug });
        //     const checkLike = sosmed.liked.filter(item => item.email === req.user.email);
    
        //     if (checkLike.length === 0) {
        //         updateLike = true;
        //     } else {
        //         updateLike = false;
        //     }
    
        //     if (updateLike) {
        //         const randomize = Math.floor(Math.random() * 1000) + 1;
    
        //         const like = await ModelSosmed.findOneAndUpdate(
        //             { slug: req.params.slug },
        //             {
        //                 liked: [
        //                     {
        //                         idlike: req.user.name.split(' ').join('_').substr(0, 6) + randomize,
        //                         email: req.user.email,
        //                         name: req.user.name,
        //                         status: true
        //                     }
        //                 ]
        //             }
        //         );
    
        //         if (like) {
        //             const loadMenu = await ModelSosmed.find({}).sort({ date: -1 });
        //             res.send({
        //                 menu: loadMenu
        //             });

        //         }

        //         console.log('Sudah Ke Like');
        //     } else {
        //         console.log('Batal Like');
        //     }
        // } catch (err) {
        //     console.warn(err);
        // }
    });

    // app.put('/api/updatelike/:slug', authjs.authenticateToken, async (req, res) => {    
    //     // res.send(req.user);
    //     let updateLike = null;

    //     ModelSosmed.findOne({ slug: req.params.slug }).then((res) => {
    //         const checkLike = res.liked.filter(item => item.email === req.user.email);
    
    //         if (checkLike.length === 0) {
    //             updateLike = true;
    //         } else {
    //             updateLike = false;
    //         }
    //     }).catch((err) => {
    //         console.warn(err);
    //     });
    
    //     if (updateLike) {
    //         const like = await ModelSosmed.findOneAndUpdate(
    //             { slug: req.params.slug },
    //             {
    //                 liked: [
    //                     {
    //                         idlike: req.user.name.split(' ').join('_').substr(0, 6) + randomize,
    //                         email: req.user.email,
    //                         name: req.user.name,
    //                         status: true
    //                     }
    //                 ]
    //             }
    //         );
    
    //         if (like) {
    //             const loadMenu = await ModelSosmed.find({}).sort({ date: -1 });
    //             res.send({
    //                 menu: loadMenu
    //             });
    //         }
    //     } else {
    //         const sosmed = await ModelSosmed.findOne({ slug: req.params.slug });

    //         let getLike = sosmed.liked;
    //         console.log('Kena');
    //     }

    //     // console.log(updateLike);

    //     // const checkLike = sosmed.liked.filter((item) => item.email === req.user.email);

    //     // // Returns a random integer from 1 to 1000:
    //     // const randomize = Math.floor(Math.random() * 1000) + 1;

    //     // if(checkLike.length === 0){
    //     //     const like = await ModelSosmed.findOneAndUpdate({ slug : req.params.slug}, {
    //     //        liked : [
    //     //             {
    //     //                 idlike :  req.user.name.split(' ').join('_').substr(0, 6) + randomize,
    //     //                 email : req.user.email,
    //     //                 name : req.user.name,
    //     //                 status : true

    //     //             }
    //     //         ]
    //     //     });
    //     //     if(like){
    //     //         const loadMenu = await ModelSosmed.find({}).sort({date:-1});
    //     //         res.send({
    //     //             menu : loadMenu,
    //     //         });
    //     //     }
    //     // }else{
    //     //     let getLike = sosmed.liked;
    //     //     console.log(getLike)
    //     // }
    // });

    app.put('/api/updateComment/:slug', authjs.authenticateToken, async (req, res) => {
        const sosmed = await ModelSosmed.findOne({ slug : req.params.slug });
        let getcomment = sosmed.comment;

        const cariIndex = getcomment.findIndex(params => params.id === req.body.id);

        // console.log(cariIndex);
        //urutan params = (mau taruh diindex brp, ada yg mw diilangin? klo gk ad = 0 else 1 utk update, isi kontennya); kalo params tengah isi 1 maka dia update 1 konten array, kalo isi 0 maka dia nambah konten array ke variable cariIndex.
        // Selengkapnya cari di folder belajar JS Pemula

        getcomment.splice(cariIndex, 1, {
            id : req.body.id,
            // name : req.user.name,
            email : req.user.email,
            // profilePhoto : req.user.photo,
            isicomment : req.body.isicomment,
            date : Date.now()
        });

        const newComment = await ModelSosmed.findOneAndUpdate({ slug : req.params.slug }, {
            comment : getcomment
        });

        if(newComment){
            const loadMenu = await ModelSosmed.find({}).sort({date:-1});
            res.send({
                menu : loadMenu,
                sosmed : sosmed
            });
        }else{
            return res.status(404).send({
                message: 'Gagal menyimpan data'
            });
        }
    });

    app.put('/api/deleteComment/:slug', authjs.authenticateToken, async (req, res) => {
        const sosmed = await ModelSosmed.findOne({ slug : req.params.slug });
        let comment = sosmed.comment;

        let filterComment = comment.filter(params => params.id !== req.body.id);

        const newComment = await ModelSosmed.findOneAndUpdate({ slug : req.params.slug }, {
            comment : filterComment
        });

        if(newComment){
            const loadMenu = await ModelSosmed.find({}).sort({date:-1});
            const sosmed2 = await ModelSosmed.findOne({ slug : req.params.slug });
            res.send({
                menu : loadMenu,
                sosmed : sosmed2
            });
        }else{
            return res.status(404).send({
                message: 'Gagal menyimpan data'
            });
        }
    });


    app.get('/api/posts/:slug', authjs.authenticateToken, async (req, res) => {
        const { slug } = req.params;
        const sosmed = await ModelSosmed.findOne({ slug : slug});
        res.send(sosmed);
    });

    app.delete('/api/posts/:slug', authjs.authenticateToken, async (req, res) => {
        const slug = req.params.slug;
        const find = await ModelSosmed.findOne({slug: slug});

        for (let i = 0; i < find.image.length; i++) {
            const gbr = find.image[i];
            const gbrMentah = gbr.replace(".png", "");

            try {
                fs.unlinkSync(gbr);
                fs.unlinkSync(gbrMentah);
            } catch (error) {
                console.error(error);
                return res.status(500).send('Server Error');
            }
            
        }

        const del = await ModelSosmed.findOneAndDelete({ slug : slug });

        if(del){
            const sosmed = await ModelSosmed.find({}).sort({date:-1});
            res.send(sosmed);
        }
    });

    app.post('/api/posts', upload.array('image', 8), authjs.authenticateToken, async (req, res) => {
        // upload.array('image',12); image itu adalah name dari input:file. 12 adalah length arrnya.
        // Req user diambil dari middleware authjs
        // console.log(req.files);

        const filePaths = req.files.map( async (paramsFile) => {
            const { path } = paramsFile;
            const newPath = `${path}.png`; // Change the extension to .png

            await sharp(path).toFile(newPath); // Convert the image to PNG


            fs.unlinkSync(path); // Ngehapus File mentah
            return newPath;
        });

        // Returns a random integer from 1 to 1000:
        const randomize = Math.floor(Math.random() * 1000) + 1;

        const newSosmed = new ModelSosmed({
            title : req.body.title,
            body : req.body.body,
            image : await Promise.all(filePaths),
            author : {
                name : req.user.name,
                email : req.user.email,
                // photo : req.user.photo
            },
            // comment : {
            //     name : req.user.name,
            //     email : req.user.email,
            //     isicomment : req.body.comment
            // },
            // liked : 0,
            date : Date.now(),
            tags : '#' + req.body.tags,
            slug : req.body.title.split(/[ /]/).join('_') + '_' + req.user.name.substr(0, 3) + randomize 
        });

        const result = await newSosmed.save();

        if(result){
            const sosmed = await ModelSosmed.find({}).sort({date:-1});
            res.send(sosmed);
        }else{
            return res.status(404).send({
                message: 'Gagal menyimpan data'
            });
        }
    })
}