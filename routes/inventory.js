const express = require('express');
const router = express.Router();
const passport = require('passport');
const validator = require('validator');
var multer  = require('multer');
var upload = multer();
const { nanoid } = require("nanoid");



router.get('/',passport.authenticate('jwt', {session: false, failureRedirect: '/login'}),  async(req, res) => {
  const name = "Inventario";
  res.render('inventory/index', {title: name, userID: req.user.user.replace("COMPANY#", "")});
});

router.get('/create',passport.authenticate('jwt', {session: false, failureRedirect: '/login'}),  async(req, res) => {
  const name = "Producto";
  res.render('inventory/create', {title: name, userID: req.user.user.replace("COMPANY#", "")});
});

module.exports = router;
