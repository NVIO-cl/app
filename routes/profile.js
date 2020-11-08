const express = require('express');
const router = express.Router();
const passport = require('passport');
const validator = require('validator');
const {Client, Status} = require("@googlemaps/google-maps-services-js");
var multer  = require('multer');
var upload = multer();

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
  var logo = await s3.getSignedUrl('getObject', {Key: req.user.user+".png", Expires: 60});
  console.log(logo);
  params = {
    "TableName": "app",
    "KeyConditionExpression": "#cd420 = :cd420 And #cd421 = :cd421",
    "ExpressionAttributeNames": {"#cd420":"PK","#cd421":"SK"},
    "ProjectionExpression": "companyName, companyRut, companyTurn, contactNumber, firstName, lastName, paymentData, email",
    "ExpressionAttributeValues": {":cd420": {"S": req.user.user},":cd421": {"S": req.user.user.replace("COMPANY", "PROFILE")}}
  }
  profileResult = await db.query(params);
  res.render('profile', {title: name, companyData: profileResult.Items[0]});
});

router.post('/saveName',passport.authenticate('jwt', {session: false, failureRedirect: '/login'}),  async(req, res) => {

  var params = {
    "TableName": "app",
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

  return res.json(updateResult);
})

router.post('/saveContact',passport.authenticate('jwt', {session: false, failureRedirect: '/login'}),  async(req, res) => {
  console.log(req.body);
  var params = {
    "TableName": "app",
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

  return res.json(updateResult);
})

router.post('/saveTransfer',passport.authenticate('jwt', {session: false, failureRedirect: '/login'}),  async(req, res) => {
  console.log(req.body);
  /*
  paymentDataRut:paymentDataRut,
  paymentDataBank:paymentDataBank,
  paymentDataAccType:paymentDataAccType,
  paymentDataAccNum:paymentDataAccNum,
  paymentDataEmail:paymentDataEmail
  */
  var params = {
    "TableName": "app",
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

  return res.json(updateResult);
})

router.post('/saveImage', upload.single('imageUpload'),passport.authenticate('jwt', {session: false, failureRedirect: '/login'}),  async(req, res) => {
  console.log("SAVE IMAGE");
  console.log(req.file);
  return res.json("ok");
})



module.exports = router;
