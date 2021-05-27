const express = require('express');
const router = express.Router();
const passport = require('passport');
const validator = require('validator');
const { nanoid } = require("nanoid");
var db = require("../db");
const AmazonCognitoIdentity = require('amazon-cognito-identity-js');
const poolData = {
  UserPoolId: process.env.AWS_COGNITO_USERPOOLID,
  ClientId: process.env.AWS_COGNITO_CLIENTID
};
const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

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
    // If refresh token exists, refresh the token

    // If not, delete cookie and log out.

  // If unsuccessful, redirect back


  console.log(req.cookies);
  console.log(req.body);
});

module.exports = router;
