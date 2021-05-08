const express = require('express');
const router = express.Router();
const passport = require('passport');
const validator = require('validator');
const { nanoid } = require("nanoid");
var db = require("../db");

router.get('/', passport.authenticate('jwt', {session: false, failureRedirect: '/login'}),  async(req, res) => {
  const name = "Billing";
  res.render('billing/billing', {title: name, userID: req.user.user.replace("COMPANY#", "")});
});

module.exports = router;
