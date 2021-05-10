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
      else if (err == 'NotAuthorizedException'){
        res.cookie('message', {type:'danger', content:'Cuenta deshabilitada. Por favor contactar a soporte@aliachile.com'});
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
  if (!validator.isEmail(req.body.email)){
    return res.redirect('/register');
  }

  const name = "Register";
  var errormsg;

  var emailData = {
    Name: 'email',
    Value: req.body.email
  }
  var updated_atData = {
    Name: 'updated_at',
    Value: Date.now().toString()
  }

  var first_nameData = {
    Name: 'given_name',
    Value: req.body.firstName
  }

  var last_nameData = {
    Name: 'family_name',
    Value: req.body.lastName
  }
  var company_id = await colcheck();

  var company_idData = {
    Name: 'custom:company_id',
    Value: company_id
  }
  var plan_idData = {
    Name: 'custom:plan_id',
    Value: '0'
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
      "referral": req.body.referral,
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
  var emailAttribute = AmazonCognitoIdentity.CognitoUserAttribute(emailData);
  var updated_atAttribute = AmazonCognitoIdentity.CognitoUserAttribute(updated_atData);
  var first_nameAttribute = AmazonCognitoIdentity.CognitoUserAttribute(first_nameData);
  var last_nameAttribute = AmazonCognitoIdentity.CognitoUserAttribute(last_nameData);
  var company_idAttribute = AmazonCognitoIdentity.CognitoUserAttribute(company_idData);
  var plan_idAttribute = AmazonCognitoIdentity.CognitoUserAttribute(plan_idData);

  userPool.signUp(req.body.email, req.body.password, [emailAttribute, updated_atData, first_nameData, last_nameData, company_idData, plan_idData], null, async (err, data)=>{
    if (err) {
      console.log(err);
      if (err.message == "1 validation error detected: Value at 'password' failed to satisfy constraint: Member must have length greater than or equal to 6") {
        res.cookie('message', {type:'danger', content:'La contraseña debe tener 6 o más caracteres'});
      }
      else if (err.message == "An account with the given email already exists."){
        res.cookie('message', {type:'danger', content:'Ya existe una cuenta con este correo.'});
      }
      else {
        res.cookie('message', {type:'danger', content:"Error: " + err.message + ". Por favor contactar a soporte@aliachile.com"});
      }
      return res.redirect('/register');
    }
    else {
      profilePut = await db.put(params_profile);
      res.cookie('message', {type:'success', content:'Cuenta creada con éxito. Antes de iniciar sesión, verifica tu correo electrónico. Si no lo encuentras, revisa tu carpeta de correo no deseado.'});
      return res.redirect('/login');
    }
  })
});

router.get('/logout', (req, res, next) => {
  res.clearCookie('token');
  return res.redirect('/login');
});

// Account verification route
router.get('/verify', async (req, res) => {
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

router.post('/forgot', upload.none(), async (req, res, next)=>{
  var userData = {
    Pool: userPool,
    Username: req.body.email
  }
  var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
  cognitoUser.forgotPassword({
  	onSuccess: function(data) {
      res.cookie('message', {type:'success', content:'Hemos enviado un correo a tu cuenta con las instrucciones'});
      return res.redirect('/login');
  	},
  	onFailure: function(err) {
      res.cookie('message', {type:'danger', content:'Error al enviar correo de recuperación.'});
      return res.redirect('/login');
  	}
  })
})

router.get('/resetPassword', async (req,res)=>{
  res.render('new_password', {code: req.query.c, user: req.query.u});
})

router.post('/resetPassword', upload.none(), async (req, res, next)=>{
  var userData = {
    Pool: userPool,
    Username: req.body.user
  }
  var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
  cognitoUser.confirmPassword(req.body.code, req.body.password, {
			onSuccess() {
        res.cookie('message', {type:'success', content:'Contraseña cambiada con éxito. Por favor vuelve a iniciar sesión.'});
        return res.redirect('/login');
			},
			onFailure(err) {
        res.cookie('message', {type:'danger', content:'Error al cambiar la contraseña.'});
        return res.redirect('/login');
			},
		});
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


router.get('/resetPassword', async (req,res)=>{
  res.render('new_password', {code: req.query.c, user: req.query.u});
})

router.get('/forgot', (req,res)=>{
  res.render('reset_password');
})

module.exports = router;
