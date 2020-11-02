const express = require('express');
const router = express.Router();
const passport = require('passport');
const { nanoid } = require("nanoid");
const validator = require('validator');
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

router.get('/create',passport.authenticate('jwt', {session: false, failureRedirect: '/login'}),  async(req, res) => {
  res.render('order/create', { title: 'NVIO' });
});

router.post('/create',passport.authenticate('jwt', {session: false, failureRedirect: '/login'}),  async(req, res) => {
  console.log("Order creation request");
  //Parse and validate the data
  //Shipping Cost
  if (!validator.isInt(req.body.shippingCost)) {
    console.log("INVALID SHIPPING COST");
    res.redirect('/create');
  }
  //Items
  var itemList = [];
  var cost = 0;
  req.body.items.forEach((item, i) => {
    if (!validator.isInt(item.quantity)) {
      console.log("INVALID QUANTITY");
      res.redirect('/create');
    }
    if (!validator.isInt(item.price)) {
      console.log("INVALID PRICE");
      res.redirect('/create');
    }
    itemList[i] = {}
    itemList[i].product = item.product;
    itemList[i].quantity = parseInt(item.quantity);
    itemList[i].price = parseInt(item.price);
    cost = parseInt(cost + item.price * item.quantity);
  });

  colcheck();

  async function colcheck(){
    console.log("BODY:");
    console.log(req.body);

    //Generate ID
    orderID = nanoid(6);
    params = {
      "TableName": "app",
      "KeyConditionExpression": "#cd420 = :cd420 And #cd421 = :cd421",
      "ExpressionAttributeNames": {"#cd420":"PK","#cd421":"SK"},
      "ExpressionAttributeValues": {":cd420": {"S": req.user.user},":cd421": {"S": "ORDER#"+orderID}}
    }
    orderQuery = await db.query(params);
    //Check for colission
    if (orderQuery.Count == 0) {
      //If no colission, create order
      params = {
        TableName:'app',
        Item:{
          "PK": req.user.user,
          "SK": "ORDER#"+orderID,
          "createdAt": Date.now(),
          "clientData": {
            "address": {
              "locality": req.body.locality,
            }
          },
          "cost": {
            "order": cost,
            "shipping": parseInt(req.body.shippingCost)
          },
          "items": itemList,
          "status": {
            "payment": 0,
            "order": 0,
            "comments": [
              {
                "timestamp": Date.now(),
                "comment": "Orden creada."
              }
            ]
          },
          "shippingMethod": req.body.shippingMethod
        }
      };
      console.log(params);
      putItem = await db.put(params);
      console.log(putItem);
    }
    else {
      //If colission, repeat process
      console.log("COLISSION. Starting over.");
      colcheck();
    }
  }
  //Redirect back to ??
  res.redirect('/');
});

router.get('/edit/:id',passport.authenticate('jwt', {session: false, failureRedirect: '/login'}),  async(req, res) => {
  res.render('order/edit', { title: 'NVIO' });
});

router.post('/edit',passport.authenticate('jwt', {session: false, failureRedirect: '/login'}),  async(req, res) => {

});

router.get('/:id',  async(req, res) => {
  if(!validator.isAlphanumeric(req.params.id) || !validator.isLength(req.params.id,{min:12, max: 12})){
    res.redirect('/404')
  }
  var companyID = "COMPANY#" + req.params.id.substring(0, 6);
  var profileID = "PROFILE#" + req.params.id.substring(0, 6);
  var orderID = "ORDER#" + req.params.id.substring(6, 12);

  var params = {
    "TableName": "app",
    "KeyConditionExpression": "#cd420 = :cd420 And #cd421 = :cd421",
    "ExpressionAttributeNames": {"#cd420":"PK","#cd421":"SK"},
    "ExpressionAttributeValues": {":cd420": {"S":companyID},":cd421": {"S":orderID}}
  }

  getOrder = await db.query(params);
  if (getOrder.Count != 1) {
    res.redirect('/404');
  }

  params = {
    "TableName": "app",
    "KeyConditionExpression": "#cd420 = :cd420 And #cd421 = :cd421",
    "ProjectionExpression": "companyName, paymentData",
    "ExpressionAttributeNames": {"#cd420":"PK","#cd421":"SK"},
    "ExpressionAttributeValues": {":cd420": {"S":companyID},":cd421": {"S":profileID}}
  }

  getCompany = await db.query(params);

  res.render('order/client', { title: 'NVIO', orderData: getOrder.Items[0], orderID: req.params.id, companyData: getCompany.Items[0]});
});

router.post('/fill', upload.single('comprobante'), async(req,res)=> {

  //Check Terms
  if (req.body.tyc != 'on') {
    console.log("Terms and conditions NOT OK");
    res.redirect(req.headers.referer);
  }
  else {
    console.log("Terms and condition OK");
  }

  //Check fields first
  if (!validator.isAlpha(req.body.nombre,'es-ES')) {
    console.log("Nombre NOT OK");
    res.redirect(req.headers.referer);
  }
  else {
    console.log("Nombre OK");
  }

  if (!validator.isAlpha(req.body.apellido,'es-ES')) {
    console.log("Apellido NOT OK");
    res.redirect(req.headers.referer);
  }
  else {
    console.log("Apellido OK");
  }

  if (!validator.isMobilePhone(req.body.telefono, 'es-CL')) {
    console.log("Telefono NOT OK");
    res.redirect(req.headers.referer);
  }
  else {
    console.log("Telefono OK");
  }

  if (!validator.isEmail(req.body.email)) {
    console.log("Correo NOT OK");
    res.redirect(req.headers.referer);
  }
  else {
    console.log("Correo OK");
  }

  //Check image uploading and save the image
  if (req.file) {
    if (!req.file.mimetype.startsWith("image")) {
      console.log("INVALID image");
      res.redirect(req.headers.referer);
    }
    else {
      var s3 = new aws.S3({params: {Bucket: process.env.AWS_S3_BUCKET}, endpoint: process.env.AWS_S3_ENDPOINT});
      var mimetype = req.file.mimetype.split("/");
      var params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: 'COMPROBANTE'+req.headers.referer.substr(req.headers.referer.length - 12)+"."+mimetype[mimetype.length - 1],
        ACL: 'public-read',
        Body: req.file.buffer
      }
      s3.putObject(params, function (err, data) {
        if (err) {
          console.log("Error: ", err);
        } else {
          //console.log(data);
          //return res.json("ok");
        }
      });
    }
  }
  else {
    console.log("NO IMAGE");
    res.redirect(req.headers.referer);
  }

  //Save the order order data
  var params = {
    "TableName": "app",
    "Key": {
      "PK": {"S": "COMPANY#123456"},
      "SK": {"S": "ORDER#ZnnG-0"}
    },
    "UpdateExpression": "SET clientData = :9e6f0",
    "ExpressionAttributeValues": {
      ":9e6f0": {"S": "Eduardo"}
    },
  }
  updateResult = await db.update(params);
  console.log(updateResult);


  //Add commentary


  //Change state

});

module.exports = router;
