const express = require('express');
const router  = express.Router();
var multer  = require('multer');
var upload = multer();
var validator = require('validator');

const jwt = require('jsonwebtoken');
const passport = require("passport");

router.post('/login', upload.none(), function (req, res, next) {
  console.log("Logging in");
  var maxAge = 86400000;
  var expiresIn = "1d";
  if (req.body.remember_me) {
    maxAge = 2629746000;
    expiresIn = "1m";
  }

  if (!validator.isEmail(req.body.email)){
    return res.redirect('/login');
  }

  if (validator.isEmpty(req.body.password)){
    return res.redirect('/login');
  }
  console.log("Data validated");

  //Passport Authentication
  passport.authenticate('local', {session: false}, (err, user, info) => {
    console.log("Passport Auth");
    if (err || !user) {
      res.cookie('error', true);
      return res.redirect('/login');
    }
    req.login(user, {session: false}, (err) => {
      if (err) {
        res.send(err);
      }
      if (user.includes("ADMIN")){
        return res.redirect('/login');
      }
      else if (user.includes("USER")) {
        return res.redirect('/login');
      }
      else if (user.includes("COMPANY")){
        const token = jwt.sign({user, iat: Math.floor(Date.now()/1000)}, process.env.JWT_SECRET, {expiresIn: expiresIn, });
        res.cookie('token', token, {maxAge: maxAge, secure: false, httpOnly: true,});
        return res.redirect('/');
      }
    });
  })(req, res);
});

router.get('/logout', (req, res, next) => {
  res.clearCookie('token');
  return res.redirect('/login');
})

module.exports = router;
