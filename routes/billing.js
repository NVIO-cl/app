const express = require('express');
const router = express.Router();
const passport = require('passport');
const validator = require('validator');
const { nanoid } = require("nanoid");
var db = require("../db");

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

module.exports = router;
