const express = require('express');
const router  = express.Router();
var multer  = require('multer');
var upload = multer();
var validator = require('validator');
var db = require("../db");
const bcrypt = require('bcrypt');
const { nanoid } = require("nanoid");
const AmazonCognitoIdentity = require('amazon-cognito-identity-js')

const poolData = {
  UserPoolId: process.env.AWS_COGNITO_USERPOOLID,
  ClientId: process.env.AWS_COGNITO_CLIENTID

}

const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData)

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
      console.log(err);
      if (err == 'UserNotConfirmedException') {
        res.cookie('message', {type:'danger', content:'Correo no verificado. Por favor confirma tu correo.'});
      }
      else {
        res.cookie('message', {type:'danger', content:'Correo o contraseña incorrecto.'});
      }
      return res.redirect('/login');
    }
    req.login(user, {session: false}, (err) => {
      if (err) {
        res.send(err);
      }
      res.cookie('token', user, {maxAge: maxAge, secure: false, httpOnly: true,});
      return res.redirect('/');
    });
  })(req, res);
});

//Login route
router.get('/login', (req, res) => {
  const name = "Login";
  var message;
  var date = new Date();
  var year = date.getFullYear();
  if (req.cookies.message != '') {
    message = req.cookies.message
  }
  res.clearCookie('message');
  res.render('login', {title: name, message: message});
});

//Register route
router.get('/register', (req, res) => {
  const name = "Register";
  var message;
  if (req.cookies.message != '') {
    message = req.cookies.message
    res.clearCookie('message');
  }
  var date = new Date();
  var year = date.getFullYear();
  res.render('register', {title: name, message: message});
});

// Register POST route
router.post('/register', upload.none(), async(req, res) => {
  const name = "Register";
  var errormsg;
  console.log("BODY:");
  console.log(req.body);

  var emailData = {
    Name: 'email',
    Value: req.body.email
  }
  var updated_atData = {
    Name: 'updated_at',
    Value: Date.now().toString()
  }

  var first_nameData = {
    Name: 'custom:first_name',
    Value: req.body.firstName
  }

  var last_nameData = {
    Name: 'custom:last_name',
    Value: req.body.lastName
  }
  var company_id = await colcheck();

  var company_idData = {
    Name: 'custom:company_id',
    Value: company_id
  }

  var params_profile={
    TableName: process.env.AWS_DYNAMODB_TABLE,
    Item: {
      "PK": company_id,
      "SK": company_id.replace("COMPANY#", "PROFILE#") ,
      "companyName": "",
      "firstName": req.body.firstName,
      "lastName": req.body.lastName,
      "email": req.body.email,
      "contactNumber": 912345678,
      "companyTurn": "",
      "companyRut": "",
      "paymentData": {
        "name": "",
        "rut": "",
        "bank": "",
        "accType": "",
        "accNum": "",
        "email": ""
      },
      "createdAt": Date.now()
    }
  };
  profilePut = await db.put(params_profile);
  var emailAttribute = AmazonCognitoIdentity.CognitoUserAttribute(emailData);
  var updated_atAttribute = AmazonCognitoIdentity.CognitoUserAttribute(updated_atData);
  var first_nameAttribute = AmazonCognitoIdentity.CognitoUserAttribute(first_nameData);
  var last_nameAttribute = AmazonCognitoIdentity.CognitoUserAttribute(last_nameData);
  var company_idAttribute = AmazonCognitoIdentity.CognitoUserAttribute(company_idData);


  userPool.signUp(req.body.email, req.body.password, [emailAttribute, updated_atData, first_nameData, last_nameData, company_idData], null, (err, data)=>{
    if (err) {
      console.log(err);
      res.cookie('message', {type:'danger', content:err.message});
      return res.redirect('/register');
    }
    else {
      console.log(data);
      //Do something with the data!
      res.cookie('message', {type:'success', content:'Cuenta creada con éxito. Antes de iniciar sesión, verifica tu correo electrónico'});
      return res.redirect('/login');
    }
  })
  console.log("Cognito register!");
});

router.get('/logout', (req, res, next) => {
  res.clearCookie('token');
  return res.redirect('/login');
});

// Account verification route
router.get('/verify', (req, res) => {
  var userData = {
    Pool: userPool,
    Username: req.query.u
  }
  var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
  cognitoUser.confirmRegistration(req.query.c, true, function(err, result) {
    if (err) {
        res.cookie('message', {type:'danger', content:'El código de verificación es inválido'});
        return res.redirect('/login');
    }
    else {
      res.cookie('message', {type:'success', content:'Correo verificado. Ahora puedes iniciar sesión'});
      return res.redirect('/login');
    }
  });
})

router.get('/forgot', (req,res)=>{
  res.render('reset_password');
})

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
  check_id = await db.queryv2(params_check_id);
  if(check_id.Count >= 1){
    colcheck();
  }
  else {
    return('COMPANY#'+userID)
  }
}


module.exports = router;
