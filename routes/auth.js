const express = require('express');
const router  = express.Router();
var multer  = require('multer');
var upload = multer();
var validator = require('validator');
var db = require("../db");
const bcrypt = require('bcrypt');
const { nanoid } = require("nanoid");

const jwt = require('jsonwebtoken');
const passport = require("passport");

router.post('/login', upload.none(), function (req, res, next) {
  var maxAge = 86400000;
  var expiresIn = "1d";
  if (req.body.remember) {
    maxAge = 2629746000;
    expiresIn = "30d";
  }

  if (!validator.isEmail(req.body.email)){
    return res.redirect('/login');
  }

  if (validator.isEmpty(req.body.password)){
    return res.redirect('/login');
  }

  //Passport Authentication
  passport.authenticate('local', {session: false}, (err, user, info) => {
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
});

//Login route
router.get('/login', (req, res) => {
  const name = "Login";
  var errormsg;
  var date = new Date();
  var year = date.getFullYear();
  if (req.cookies.error == true) {
    errormsg = "Correo o contraseña incorrectos";
  }
  res.clearCookie('error');
  res.render('login', {title: name, error: errormsg});
});

//Register route
router.get('/register', (req, res) => {
  const name = "Register";
  var errormsg;
  var date = new Date();
  var year = date.getFullYear();
  res.render('register', {title: name, error: errormsg});
});

router.post('/register', upload.none(), async(req, res) => {

  if (!validator.isEmail(req.body.email)){
    return res.redirect('/register');
  }

  const name = "Register";
  var errormsg;
  var date = new Date();
  var year = date.getFullYear();
  const saltRounds = 10;
  var email = req.body.email;
  var password = req.body.password;
  var password_repeat = req.body.password_repeat;
  // Check if email is already taken
  var params_check_email = {
    "TableName": process.env.AWS_DYNAMODB_TABLE,
    "ScanIndexForward": false,
    "ConsistentRead": false,
    "KeyConditionExpression": "#cd420 = :cd420 And #cd421 = :cd421",
    "ExpressionAttributeValues": {
      ":cd420": "EMAIL",
      ":cd421": "EMAIL#" + email
    },
    "ExpressionAttributeNames": {
      "#cd420": "PK",
      "#cd421": "SK"
    }
  };
  check_email = await db.queryv2(params_check_email);
  if(check_email.Count == 1){
    res.cookie('error', 'Ya existe una cuenta con ese email');
    return res.redirect('/register');
    //res.redirect('register', {title: name, error: errormsg});
  }
  else{
    // CHeck if password is double ok
    if(password == password_repeat){
      var hashed_pw = bcrypt.hashSync(password, saltRounds);
      //Run colcheck
      colcheck();

      async function colcheck(){
        // Generate ID
        userID = nanoid(6);
        // Check if colission
        var params_check_id = {
          "TableName": process.env.AWS_DYNAMODB_TABLE,
          "ScanIndexForward": false,
          "ConsistentRead": false,
          "KeyConditionExpression": "#cd420 = :cd420 And #cd421 = :cd421",
          "ExpressionAttributeValues": {
            ":cd420": "COMPANY#" + userID,
            ":cd421": "PROFILE#" + userID
          },
          "ExpressionAttributeNames": {
            "#cd420": "PK",
            "#cd421": "SK"
          }
        };
        check_id = await db.queryv2(params_check_email);
        if(check_id.Count >= 1){
          colcheck();
        }
        else {
          var params_profile={
            TableName: process.env.AWS_DYNAMODB_TABLE,
            Item: {
              "PK": "COMPANY#" + userID,
              "SK": "PROFILE#" + userID,
              "companyName": " ",
              "firstName": " ",
              "lastName": " ",
              "email": " ",
              "contactNumber": 912345678,
              "password": hashed_pw,
              "companyTurn": " ",
              "companyRut": " ",
              "paymentData": {
                "name": " ",
                "rut": " ",
                "bank": " ",
                "accType": " ",
                "accNum": " ",
                "email": " "
              },
              "resetToken": "Null",
              "tokenExp": "Null",
              "createdAt": Date.now()
            }
          };

          var params_email={
            TableName: process.env.AWS_DYNAMODB_TABLE,
            Item: {
              "PK": "EMAIL",
              "SK": "EMAIL#" + email,
              "userID": "COMPANY#" + userID
            }
          };

          profilePut = await db.put(params_profile);
          emailPut = await db.put(params_email);
          return res.redirect('/login');
        }
      }
    }else{
      console.log("Contraseñas no son idénticas")
      return res.redirect('/register');
    }
  }
});

module.exports = router;
