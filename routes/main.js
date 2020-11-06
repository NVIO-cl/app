const express = require('express');
const router = express.Router();
const passport = require('passport');
const validator = require('validator');
const {Client, Status} = require("@googlemaps/google-maps-services-js");
var multer  = require('multer');
var upload = multer();

//AWS Settings
var aws = require("aws-sdk");
var db = require("../db");
aws.config.update({
  region: process.env.DBREGION,
  endpoint: process.env.ENDPOINT,
  accessKeyId: process.env.AKID,
  secretAccessKey: process.env.SECRET
});

/* GET home page. */
router.get('/',passport.authenticate('jwt', {session: false, failureRedirect: '/login'}),  async(req, res) => {
  res.render('index', { title: 'NVIO' });
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

router.get('/profile',passport.authenticate('jwt', {session: false, failureRedirect: '/login'}), async (req, res, next) => {
  const name = "Profile";
  var errormsg;
  console.log(req.user.user);
  params = {
    "TableName": "app",
    "KeyConditionExpression": "#cd420 = :cd420 And #cd421 = :cd421",
    "ExpressionAttributeNames": {"#cd420":"PK","#cd421":"SK"},
    "ProjectionExpression": "companyName, companyRut, companyTurn, contactNumber, firstName, lastName, paymentData, email",
    "ExpressionAttributeValues": {":cd420": {"S": req.user.user},":cd421": {"S": req.user.user.replace("COMPANY", "PROFILE")}}
  }
  profileResult = await db.query(params);
  res.render('profile', {title: name, error: errormsg, companyData: profileResult.Items[0]});
});

module.exports = router;
