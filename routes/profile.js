const express = require('express');
const router = express.Router();
const passport = require('passport');
const validator = require('validator');
const {Client, Status} = require("@googlemaps/google-maps-services-js");
var multer  = require('multer');
var upload = multer();
var Jimp = require('jimp');

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

router.get('/',passport.authenticate('jwt', {session: false, failureRedirect: '/login'}), async (req, res, next) => {
  const name = "Profile";
  var s3 = new aws.S3({params: {Bucket: process.env.AWS_S3_BUCKET}, endpoint: s3Endpoint});
  var logo = await s3.getSignedUrl('getObject', {Key: "logos/"+req.user.user+".png", Expires: 60});
  params = {
    "TableName": process.env.AWS_DYNAMODB_TABLE,
    "KeyConditionExpression": "#cd420 = :cd420 And #cd421 = :cd421",
    "ExpressionAttributeNames": {"#cd420":"PK","#cd421":"SK"},
    "ProjectionExpression": "companyName, companyRut, companyTurn, contactNumber, firstName, lastName, paymentData, email",
    "ExpressionAttributeValues": {":cd420": {"S": req.user.user},":cd421": {"S": req.user.user.replace("COMPANY", "PROFILE")}}
  }
  profileResult = await db.query(params);
  res.render('profile', {title: name, companyData: profileResult.Items[0], logo: logo, userID: req.user.user.replace("COMPANY#", ""), userPlanID: req.user['custom:plan_id']});
});

router.post('/saveName',passport.authenticate('jwt', {session: false, failureRedirect: '/login'}),  async(req, res) => {
  var valid = true;
  var invalidItems = []
  //Validate data
  if (validator.isEmpty(req.body.companyName)) {
    invalidItems.push(["#companyName","El nombre de empresa no puede estar vacío"])
    var valid = false;
  }
  if (validator.isEmpty(req.body.firstName)) {
    invalidItems.push(["#firstName", "El nombre no puede estar vacío"])
    var valid = false;
  }
  if (validator.isEmpty(req.body.lastName)) {
    invalidItems.push(["#lastName", "El apellido no puede estar vacío"])
    var valid = false;
  }
  if (valid == false) {
    return res.json(invalidItems);
  }
  var params = {
    "TableName": process.env.AWS_DYNAMODB_TABLE,
    "Key": {
      "PK":req.user.user,
      "SK": req.user.user.replace("COMPANY", "PROFILE")
    },
    "UpdateExpression": "set #firstName = :firstName, #lastName = :lastName, #companyName = :companyName, #updatedAt = :updatedAt ",
    "ExpressionAttributeNames": {
      "#firstName":"firstName",
      "#lastName":"lastName",
      "#companyName":"companyName",
      "#updatedAt":"updatedAt"
    },
    "ExpressionAttributeValues": {
      ":firstName": req.body.firstName,
      ":lastName": req.body.lastName,
      ":companyName": req.body.companyName,
      ":updatedAt": Date.now()
    }
  }
  updateResult = await db.update(params);

  return res.json("ok");
})

router.post('/saveContact',passport.authenticate('jwt', {session: false, failureRedirect: '/login'}),  async(req, res) => {
  var valid = true;
  var invalidItems = []
  //Validate data
  if (validator.isEmpty(req.body.contactNumber)) {
    invalidItems.push(["#contactNumber","El teléfono no puede estar vacío"])
    var valid = false;
  }
  if (validator.isEmpty(req.body.email)) {
    invalidItems.push(["#email", "El correo no puede estar vacío"])
    var valid = false;
  }
  else {
    if (!validator.isEmail(req.body.email)) {
      invalidItems.push(["#email", "Debe ser un correo válido"])
      valid = false;
    }
  }
  if (valid == false) {
    return res.json(invalidItems);
  }
  var params = {
    "TableName": process.env.AWS_DYNAMODB_TABLE,
    "Key": {
      "PK":req.user.user,
      "SK": req.user.user.replace("COMPANY", "PROFILE")
    },
    "UpdateExpression": "set #contactNumber = :contactNumber, #email = :email, #updatedAt = :updatedAt ",
    "ExpressionAttributeNames": {
      "#contactNumber":"contactNumber",
      "#email":"email",
      "#updatedAt":"updatedAt"
    },
    "ExpressionAttributeValues": {
      ":contactNumber": parseInt(req.body.contactNumber),
      ":email": req.body.email,
      ":updatedAt": Date.now()
    }
  }
  updateResult = await db.update(params);

  return res.json("ok");
})

router.post('/saveTransfer',passport.authenticate('jwt', {session: false, failureRedirect: '/login'}),  async(req, res) => {
  //Validate data
  var valid = true;
  var invalidItems = []
  if (validator.isEmpty(req.body.paymentDataName)) {
    invalidItems.push(["#paymentDataName", "El nombre no puede estar vacío"])
    valid = false;
  }
  if (validator.isEmpty(req.body.paymentDataRut)) {
    invalidItems.push(["#paymentDataRut", "El RUT no puede estar vacío"])
    valid = false;
  }
  if (validator.isEmpty(req.body.paymentDataBank)) {
    invalidItems.push(["#paymentDataBank", "El banco no puede estar vacío"])
    valid = false;
  }
  if (validator.isEmpty(req.body.paymentDataAccType)) {
    invalidItems.push(["#paymentDataAccType", "El tipo de cuenta no puede estar vacío"])
    valid = false;
  }
  if (validator.isEmpty(req.body.paymentDataAccNum)) {
    invalidItems.push(["#paymentDataAccNum", "El número de cuenta no puede estar vacío"])
    valid = false;
  }
  if (validator.isEmpty(req.body.paymentDataEmail)) {
    invalidItems.push(["#paymentDataEmail", "El correo no puede estar vacío"])
    valid = false;
  }
  else {
    if (!validator.isEmail(req.body.paymentDataEmail)) {
      invalidItems.push(["#paymentDataEmail", "Debe ser un correo válido"])
      valid = false;
    }
  }
  if (valid == false) {
    return res.json(invalidItems);
  }

  var params = {
    "TableName": process.env.AWS_DYNAMODB_TABLE,
    "Key": {
      "PK":req.user.user,
      "SK": req.user.user.replace("COMPANY", "PROFILE")
    },
    "UpdateExpression": "set #paymentData.#name = :name, #updatedAt = :updatedAt, #companyTurn=:companyTurn, #companyRut=:companyRut, #paymentData.#rut=:rut, #paymentData.#bank=:bank, #paymentData.#accType=:accType, #paymentData.#accNum=:accNum, #paymentData.#email=:email ",
    "ExpressionAttributeNames": {
      "#companyTurn":"companyTurn",
      "#companyRut":"companyRut",
      "#paymentData":"paymentData",
      "#name":"name",
      "#rut":"rut",
      "#bank":"bank",
      "#accType":"accType",
      "#accNum":"accNum",
      "#email":"email",
      "#updatedAt":"updatedAt"
    },
    "ExpressionAttributeValues": {
      ":companyTurn": req.body.companyTurn,
      ":companyRut": req.body.companyRut,
      ":name": req.body.paymentDataName,
      ":rut": req.body.paymentDataRut,
      ":bank": req.body.paymentDataBank,
      ":accType": req.body.paymentDataAccType,
      ":accNum": req.body.paymentDataAccNum,
      ":email": req.body.paymentDataEmail,
      ":updatedAt": Date.now()
    }
  }
  updateResult = await db.update(params);

  return res.json("ok");
})

router.post('/saveImage', upload.single('imageUpload'),passport.authenticate('jwt', {session: false, failureRedirect: '/login'}),  async(req, res) => {
  try {
    var file = await Jimp.read(Buffer.from(req.file.buffer, 'base64'))
  } catch (e) {
    console.log(e);
    return res.status(500).send("Image error")
  }
  var scaled = await file.scaleToFit(1000,500);
  var buffer = await scaled.getBufferAsync(Jimp.AUTO);
  var s3 = new aws.S3({params: {Bucket: process.env.AWS_S3_BUCKET}, endpoint: process.env.AWS_S3_ENDPOINT});
  var params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: "logos/"+req.user.user+".png",
    ACL: 'public-read',
    Body: buffer
  }
  s3up = await s3.putObject(params, function (err, data) {
    if (err) {
      s3res = err;
    } else {
      s3res = "ok"
    }
  }).promise();
  return res.status(200).json(s3res)
})

module.exports = router;
