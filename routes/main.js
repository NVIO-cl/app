const express = require('express');
const passport = require('passport');
const router = express.Router();

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

router.get('/profile',passport.authenticate('jwt', {session: false, failureRedirect: '/login'}),  async(req, res) => {
  res.render('profile', { title: 'NVIO' });
});

/* GET historial. */
router.get('/historial',passport.authenticate('jwt', {session: false, failureRedirect: '/login'}),  async(req, res) => {
  console.log("Historial requested")
  const name = "Historial";
  var params={
    "TableName": "app",
    "ScanIndexForward": false,
    "ConsistentRead": false,
    "KeyConditionExpression": "#cd420 = :cd420 And begins_with(#cd421, :cd421)",
    "ExpressionAttributeValues": {
      ":cd420": {
        "S": req.user.user
      },
      ":cd421": {
        "S": "ORDER"
      }
    },
    "ExpressionAttributeNames": {
      "#cd420": "PK",
      "#cd421": "SK"
    }
  };
  historialQuery = await db.query(params);
  res.render('historial', {title: name, orders: historialQuery.Items, companyId: req.user.user.replace("COMPANY#","")});
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
