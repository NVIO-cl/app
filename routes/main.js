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
var s3Endpoint = new aws.Endpoint(process.env.AWS_S3_ENDPOINT);
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



module.exports = router;
