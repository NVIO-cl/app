const express = require('express');
const router = express.Router();
const passport = require('passport');
const validator = require('validator');
const { nanoid } = require("nanoid");
var db = require("../db");
var aws = require("aws-sdk");
aws.config.update({
  region: process.env.DBREGION,
  endpoint: process.env.ENDPOINT,
  accessKeyId: process.env.AKID,
  secretAccessKey: process.env.SECRET
});

router.get('/', passport.authenticate('jwt', {session: false, failureRedirect: '/login'}),  async(req, res) => {
  const name = "Billing";
  res.render('billing/billing', {title: name, userID: req.user.user.replace("COMPANY#", ""), planID: req.user['custom:plan_id']});
});

router.get('/plans', passport.authenticate('jwt', {session: false, failureRedirect: '/login'}),  async(req, res) => {
  const name = "Plans";
  res.render('billing/plans', {title: name, userID: req.user.user.replace("COMPANY#", ""), planID: req.user['custom:plan_id']});
});

router.get('/plans/:id', passport.authenticate('jwt', {session: false, failureRedirect: '/login'}),  async(req, res) => {
  var name = "Selección de plan";
  console.log(req.params);
  res.render('billing/payment', {title: name, userID: req.user.user.replace("COMPANY#", ""), planID: req.user['custom:plan_id'], selectedPlanId: parseInt(req.params.id)});
});

router.post('/setPlan/', passport.authenticate('jwt', {session: false, failureRedirect: '/login'}), async(req, res) => {
  console.log("SET PLAN!");
  // Set the new plan




  // If successful, set the new claim
  // Shitty amazon-cognito-identity-js library doesn't have this functionality
  // https://github.com/aws-amplify/amplify-js/issues/6704
  // so we have to use the more shittier aws-sdk. yay.
  var cognitoidentityserviceprovider = new aws.CognitoIdentityServiceProvider();
  let params = {
    UserAttributes: [
      {
        Name: "custom:plan_id",
        Value: "2"
      }
    ],
    UserPoolId: process.env.AWS_COGNITO_USERPOOLID,
    Username: req.user.email
  };
  update = cognitoidentityserviceprovider.adminUpdateUserAttributes(params, function(err, data) {
    if (err) {
      console.log(err.code);
      return res.json(err.code);
    }
    else {
      // If refresh token exists, refresh the token. If not, log out.
      if (req.cookies.refresh) {
        console.log(req.cookies.refresh);
        let params = {
          AuthFlow: "REFRESH_TOKEN_AUTH",
          ClientId: process.env.AWS_COGNITO_CLIENTID,
          AuthParameters: {
            REFRESH_TOKEN: req.cookies.refresh
          }
        };
        cognitoidentityserviceprovider.initiateAuth(params, function(err,data){
          if (err) {
            console.log(err);
            return res.json(err);
          }
          else {
            res.clearCookie('token');
            return res.json("ok");

          }
        });
      }
      else {
        res.cookie('message', {type:'success', content:'Plan cambiado con éxito. Por favor vuelve a inicar sesión.'});
        res.clearCookie('token');
      }

    }
  });


    // If not, delete cookie and log out.

  // If unsuccessful, redirect back
});

module.exports = router;
