const express = require('express');
const router = express.Router();
const passport = require('passport');
const validator = require('validator');
const { nanoid } = require("nanoid");
const { Client } = require('@elastic/elasticsearch')
const client = new Client({
  node: process.env.ELASTIC_ENDPOINT,
  auth: {
    username: process.env.ELASTIC_USERNAME,
    password: process.env.ELASTIC_PASSWORD
  }
})


router.get('/searchProduct/:fullname',passport.authenticate('jwt', {session: false, failureRedirect: '/login'}),  async(req, res) => {
  const result = await client.search({
    index: 'products',
    body: {
      query: {
        match: { fullname: req.params.fullname }
      }
    }
  })
  console.log(result.body.hits.hits);

  res.status(200).json(result.body.hits.hits)
});



router.get('/',passport.authenticate('jwt', {session: false, failureRedirect: '/login'}),  async(req, res) => {
  const name = "Inventario";
  res.render('inventory/index', {title: name, userID: req.user.user.replace("COMPANY#", "")});
});

router.get('/create',passport.authenticate('jwt', {session: false, failureRedirect: '/login'}),  async(req, res) => {
  const name = "Producto";
  res.render('inventory/create', {title: name, userID: req.user.user.replace("COMPANY#", "")});
});

module.exports = router;