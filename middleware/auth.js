const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

// Panggil Env
dotenv.config();

// access config var
process.env.TOKEN_SECRET;

// Ini Middleware Login
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
  
    if (token == null) return res.sendStatus(401);
  
    jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {
    //   console.log(user);
  
      if (err) return res.sendStatus(403);
  
      req.user = user;
  
      next();
    });
}

function destroyToken(req, res, next){
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if(token == null) return res.sendStatus(401);

    try {
        jwt.verify(token, process.env.TOKEN_SECRET);
        // If the token is valid, you can destroy it here
        // For example, you could set it to an empty string or null
        // req.user = '';
        // or
        req.user = null;
        next();
    }catch(err) {
        res.sendStatus(403);
    }
}

// End Middleware 

module.exports = {
    authenticateToken,
    destroyToken
}