const express = require('express');
const router = express.Router();
const passport = require('passport');
const { nanoid } = require("nanoid");
const validator = require('validator');
const {Client, Status} = require("@googlemaps/google-maps-services-js");
var multer  = require('multer');
var upload = multer();
var Jimp = require('jimp');


//AWS Settings
var aws = require("aws-sdk");
var s3Endpoint = new aws.Endpoint(process.env.AWS_S3_ENDPOINT);
var db = require("../db");
aws.config.update({
  region: process.env.DBREGION,
  endpoint: process.env.ENDPOINT,
  accessKeyId: process.env.AKID,
  secretAccessKey: process.env.SECRET
});

router.get('/create',passport.authenticate('jwt', {session: false, failureRedirect: '/login'}),  async(req, res) => {
  res.render('order/create', { title: 'NVIO', userID: req.user.user.replace("COMPANY#", "") });
});

router.post('/create',passport.authenticate('jwt', {session: false, failureRedirect: '/login'}),  async(req, res) => {
  //Parse and validate the data
  //Shipping Cost
  var orderID;
  if (!validator.isInt(req.body.shippingCost)) {
    res.redirect('/create');
  }
  if (req.body.shippingCost < 0) {
    res.redirect('/create');
  }

  //Items
  var itemList = [];
  var cost = 0;
  req.body.items.forEach((item, i) => {
    if (!validator.isInt(item.quantity)) {
      res.redirect('/create');
    }
    if (!validator.isInt(item.price)) {
      res.redirect('/create');
    }
    itemList[i] = {}
    itemList[i].product = item.product;
    itemList[i].quantity = parseInt(item.quantity);
    if (itemList[i].quantity <=0) {
      res.redirect('/create');
    }
    itemList[i].price = parseInt(item.price);
    if (itemList[i].price <=0) {
      res.redirect('/create');
    }
    cost = parseInt(cost + item.price * item.quantity);
  });

  colcheck();

  async function colcheck(){

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
      putItem = await db.put(params);
      //Redirect back to order detail
      res.redirect('/detail/' + orderID);
    }
    else {
      //If colission, repeat process
      console.log("COLISSION. Starting over.");
      colcheck();
    }
  }
});

router.get('/edit/:id',passport.authenticate('jwt', {session: false, failureRedirect: '/login'}),  async(req, res) => {
  res.render('order/edit', { title: 'NVIO', userID: req.user.user.replace("COMPANY#", "") });
});

router.post('/edit',passport.authenticate('jwt', {session: false, failureRedirect: '/login'}),  async(req, res) => {

});

router.get('/finished', async (req,res)=> {
  res.render('order/orderconfirmed');
})

router.get('/:id',  async(req, res) => {
  if(!validator.isLength(req.params.id,{min:12, max: 12})){
    res.redirect('/404')
  }
  var companyID = "COMPANY#" + req.params.id.substring(0, 6);
  var profileID = "PROFILE#" + req.params.id.substring(0, 6);
  var orderID = "ORDER#" + req.params.id.substring(6, 12);

  var s3 = new aws.S3({params: {Bucket: process.env.AWS_S3_BUCKET}, endpoint: s3Endpoint});
  var logo = await s3.getSignedUrl('getObject', {Key: "logos/"+companyID+".png", Expires: 60});

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

  if (getOrder.Items[0].status.M.order.N > 0) {
    res.redirect('/order/finished');
  }

  params = {
    "TableName": "app",
    "KeyConditionExpression": "#cd420 = :cd420 And #cd421 = :cd421",
    "ProjectionExpression": "companyName, paymentData",
    "ExpressionAttributeNames": {"#cd420":"PK","#cd421":"SK"},
    "ExpressionAttributeValues": {":cd420": {"S":companyID},":cd421": {"S":profileID}}
  }

  getCompany = await db.query(params);

  res.render('order/client', { title: 'NVIO', logo: logo, orderData: getOrder.Items[0], orderID: req.params.id, companyData: getCompany.Items[0]});
});

router.post('/fill', upload.single('comprobante'), async(req,res)=> {
  var fullID = req.headers.referer.slice(req.headers.referer.length - 12);
  var companyID = "COMPANY#" + fullID.substring(0, 6);
  var profileID = "PROFILE#" + fullID.substring(0, 6);
  var orderID = "ORDER#" + fullID.substring(6, 12);

  //Check Terms
  if (req.body.tyc != 'on') {
    console.log("Terms and conditions NOT OK");
    res.redirect(req.headers.referer);
  }

  //Check fields
  if (await !validator.isAlpha(req.body.nombre,'es-ES')) {
    console.log("Nombre NOT OK");
    res.redirect(req.headers.referer);
  }

  if (await !validator.isAlpha(req.body.apellido,'es-ES')) {
    console.log("Apellido NOT OK");
    res.redirect(req.headers.referer);
  }

  if (await validator.isEmpty(req.body.telefono)) {
    console.log("Telefono NOT OK");
    res.redirect(req.headers.referer);
  }

  if (await !validator.isEmail(req.body.email)) {
    console.log("Correo NOT OK");
    res.redirect(req.headers.referer);
  }

  //Check image uploading and save the image
  var s3up;
  if (req.file) {
    if (await !req.file.mimetype.startsWith("image")) {
      console.log("INVALID image");
      res.redirect(req.headers.referer);
    }
    else {

      var file = await Jimp.read(Buffer.from(req.file.buffer, 'base64'))
      var scaled = await file.scaleToFit(500, 1000);
      var buffer = await scaled.getBufferAsync(Jimp.AUTO);
      var s3 = new aws.S3({params: {Bucket: process.env.AWS_S3_BUCKET}, endpoint: process.env.AWS_S3_ENDPOINT});
      var params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: "comprobantes/" + fullID.substring(0, 6) + "/" + fullID.substring(6, 12) + ".png",
        ACL: 'private',
        Body: buffer
      }
      s3up = await s3.putObject(params, function (err, data) {
        if (err) {
          console.log("Error: ", err);
        } else {
          console.log("Image uploaded OK");
        }
      }).promise();

    }
  }
  else {
    console.log("NO IMAGE");
    res.redirect(req.headers.referer);
  }
  //Save the order data
  var params = {
    "TableName": "app",
    "Key": {
      "PK":companyID,
      "SK": orderID
    },
    "UpdateExpression": "set #clientData.#firstName = :firstName, #clientData.#lastName = :lastName, #clientData.#email = :email, #clientData.#contactNumber = :contactNumber, #clientData.#address.#street = :street, #clientData.#address.#apart = :apart, #comment = :comment, #status.#order = :order, #updatedAt = :updatedAt ",
    "ExpressionAttributeNames": {
      "#clientData":"clientData",
      "#firstName":"firstName",
      "#lastName":"lastName",
      "#email":"email",
      "#contactNumber":"contactNumber",
      "#comment":"comment",
      "#status":"status",
      "#order":"order",
      "#updatedAt":"updatedAt",
      "#address":"address",
      "#street":"street",
      "#apart":"apart"
    },
    "ExpressionAttributeValues": {
      ":firstName": req.body.nombre,
      ":lastName": req.body.apellido,
      ":email": req.body.email,
      ":contactNumber": parseInt(req.body.telefono),
      ":comment": req.body.comentario,
      ":order": 1,
      ":updatedAt": Date.now(),
      ":street": req.body.direccion,
      ":apart": req.body.apart
    },
    "ReturnValues": "ALL_NEW"
  }
  updateResult = await db.update(params);

  //Add commentary
  params = {
    "TableName": "app",
    "Key": {
      "PK": companyID,
      "SK": orderID
    },
    "UpdateExpression": "set #status.#comments = list_append(#status.#comments,:comment)",
    "ExpressionAttributeNames": {
      "#status": "status",
      "#comments": "comments"
    },
    "ExpressionAttributeValues": {
      ":comment": [{
        "comment": "Datos de cliente ingresados.",
        "timestamp": Date.now()
      }]
    }
  }
  commentResult = await db.update(params);
  res.redirect('/order/finished')

});

module.exports = router;
