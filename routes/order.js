const express = require('express');
const router = express.Router();
const passport = require('passport');
const { nanoid } = require("nanoid");
const validator = require('validator');
//const {Client, Status} = require("@googlemaps/google-maps-services-js");
const { Client } = require('@elastic/elasticsearch')
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

//Elasticsearch Settings
const client = new Client({
  node: process.env.ELASTIC_ENDPOINT,
  auth: {
    username: process.env.ELASTIC_USERNAME,
    password: process.env.ELASTIC_PASSWORD
  }
})

router.get('/create',passport.authenticate('jwt', {session: false, failureRedirect: '/login'}),  async(req, res) => {
  //Get user data
  var noTransfer = false;
  var params = {
    "TableName": process.env.AWS_DYNAMODB_TABLE,
    "KeyConditionExpression": "#cd420 = :cd420 And #cd421 = :cd421",
    "ExpressionAttributeNames": {"#cd420":"PK","#cd421":"SK"},
    "ExpressionAttributeValues": {":cd420": req.user.user,":cd421": req.user.user.replace("COMPANY", "PROFILE")}
  }

  userData = await db.queryv2(params);
  paymentData = userData.Items[0].paymentData
  if (paymentData.accNum == '' || paymentData.accType == '' || paymentData.bank == '' || paymentData.email == '' || paymentData.name == '' || paymentData.rut == '' || paymentData.accNum == ' ' || paymentData.accType == ' ' || paymentData.bank == ' ' || paymentData.email == ' ' || paymentData.name == ' ' || paymentData.rut == ' ' ) {
    noTransfer = true;
  }

  res.render('order/create', { title: 'NVIO', userID: req.user.user.replace("COMPANY#", ""), noTransfer:noTransfer, userPlanID: req.user['custom:plan_id'] });
});

router.post('/create',passport.authenticate('jwt', {session: false, failureRedirect: '/login'}),  async(req, res) => {
  //Parse and validate the data
  var valid = true;
  var payment = 0;

  if (req.body.payment == 'efectivo') {
    payment = 3;
  }

  if (req.body.shipping == 'local') {
    req.body.shippingDate = ''
    req.body.locality = 'Retiro en tienda'
    req.body.shippingMethod = req.body.pickupAddress
  }
  else if(req.body.shipping == 'domicilio') {
    req.body.pickupDate = '';
  }

  //Shipping Cost
  var orderID;
  if(req.body.shipping != 'local'){
    if (!validator.isInt(req.body.shippingCost)) {
      req.body.shippingCost = req.body.shippingCost.replace('.',"");
    }
    if (req.body.shippingCost < 0) {
      valid = false;
      res.redirect('/order/create');
    }
  }
  else {
    req.body.shippingCost = 0;
  }

  //Items
  var itemList = [];
  var cost = 0;
  req.body.items.forEach((item, i) => {
    if (!validator.isInt(item.quantity)) {
      valid = false;
      res.redirect('/order/create');
    }
    if (!validator.isInt(item.price)) {
      valid = false;
      res.redirect('/order/create');
    }
    itemList[i] = {}
    itemList[i].product = item.product;
    itemList[i].quantity = parseInt(item.quantity.replace('.',""));
    if (itemList[i].quantity <=0) {
      valid = false;
      res.redirect('/order/create');
    }
    itemList[i].price = parseInt(item.price.replace('.',""));
    if (itemList[i].price <=0) {
      valid = false;
      res.redirect('/order/create');
    }
    cost = parseInt(cost + item.price * item.quantity);

    if (item.regProduct) {
      itemList[i].inventoryId = item.regProduct;
    }
  });
  if (valid) {
    colcheck();
  }


  async function colcheck(){

    //Generate ID
    orderID = nanoid(6);
    params = {
      "TableName": process.env.AWS_DYNAMODB_TABLE,
      "KeyConditionExpression": "#cd420 = :cd420 And #cd421 = :cd421",
      "ExpressionAttributeNames": {"#cd420":"PK","#cd421":"SK"},
      "ExpressionAttributeValues": {":cd420": {"S": req.user.user},":cd421": {"S": "ORDER#"+orderID}}
    }
    orderQuery = await db.query(params);
    //Check for colission
    if (orderQuery.Count == 0) {
      //If no colission, create order
      params = {
        TableName:process.env.AWS_DYNAMODB_TABLE,
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
            "payment": payment,
            "order": 0,
            "shippingDate": req.body.shippingDate,
            "comments": [
              {
                "timestamp": Date.now(),
                "comment": "Orden creada."
              }
            ]
          },
          "shippingMethod": req.body.shippingMethod,
          "shippingDate": req.body.shippingDate,
          "pickupAddress": req.body.pickupAddress,
          "pickupDate": req.body.pickupDate
        }
      };
      //Save the order in DynamoDB
      putItem = await db.put(params);

      //Save the order in Elasticsearch
      result = await client.index({
        index: 'orders',
        id: req.user.user.replace("COMPANY#", "") + orderID,
        body: {
          "owner": req.user.user.replace("COMPANY#", ""),
          "cost": {
            "shipping": parseInt(req.body.shippingCost),
            "order": cost
          },
          "shippingMethod": req.body.shippingMethod,
          "locality": req.body.locality,
          "createdAt": Date.now(),
          "pickupAddress": req.body.pickupAddress,
          "items": itemList,
          "paymentType": payment,
        }
      })

      // Check if items are in the inventory and subtract the quantity
      for (var item of itemList) {
        if (item.inventoryId) {
          //subtract the quantity in Elasticsearch (subproduct or single). If it goes below zero, cap it to 0. (should warn the user in frontend)
          updateResult = await client.update({
            index:'products',
            id: item.inventoryId,
            body: {
              script: {
                lang: "painless",
                source: "if(ctx._source.stock != null){if(ctx._source.stock - params.count < 0){ctx._source.stock = 0}else{ctx._source.stock -= params.count}}",
                params: {
                  count: item.quantity
                }
              }
            }
          })
          // Get the product data in DynamoDB
          var paramsProduct = {
            "TableName": process.env.AWS_DYNAMODB_TABLE,
            "KeyConditionExpression": "#cd420 = :cd420 And #cd421 = :cd421",
            "ExpressionAttributeNames": {"#cd420":"PK","#cd421":"SK"},
            "ExpressionAttributeValues": {":cd420": req.user.user,":cd421": "PRODUCT#"+item.inventoryId.substring(6,12)}
          }
          // Do the query
          productQuery = await db.queryv2(paramsProduct);
          var params = {}
          // If it's a subproduct, we have to subtract to the master product too
          if (item.inventoryId.length == 18) {
            //subtract the quantity to the main product in Elasticsearch. If it goes below zero, cap it to 0. (should warn the user in frontend)
            updateResult = await client.update({
              index:'products',
              id: item.inventoryId.substring(0,12),
              body: {
                script: {
                  lang: "painless",
                  source: "if(ctx._source.stock != null){if(ctx._source.stock - params.count < 0){ctx._source.stock = 0}else{ctx._source.stock -= params.count}}",
                  params: {
                    count: item.quantity
                  }
                }
              }
            })
            // subtract the quantity on the main and subproduct in DynamoDB
            // If main product stock is not null, then it uses stock control
            if (productQuery.Items[0].stock != null) {
              // Get the subproduct index
              subproductIndex = productQuery.Items[0].subproduct.findIndex(x=>x.id===item.inventoryId.substring(12,18))
              // Set the parameters for updating the product
              params = {
                "TableName": process.env.AWS_DYNAMODB_TABLE,
                "Key": {
                  "PK":req.user.user,
                  "SK": "PRODUCT#"+item.inventoryId.substring(6,12)
                },
                "UpdateExpression": "set stock = stock - :val, subproduct["+subproductIndex+"].stock = subproduct["+subproductIndex+"].stock - :val",
                "ExpressionAttributeValues": {":val":item.quantity},
                "ReturnValues": "UPDATED_NEW"
              }
              // Do the update
              updateResult = await db.update(params);
            }
          }
          else {
            if (productQuery.Items[0].stock != null) {
            params = {
              "TableName": process.env.AWS_DYNAMODB_TABLE,
              "Key": {
                "PK":req.user.user,
                "SK": "PRODUCT#"+item.inventoryId.substring(6,12)
              },
              "UpdateExpression": "set stock = stock - :val",
              "ExpressionAttributeValues": {":val":item.quantity},
              "ReturnValues": "UPDATED_NEW"
            }
            // Do the update
            updateResult = await db.update(params);
          }

        }
        }
      }
      //Redirect back to order detail
      res.redirect('/detail/' + orderID);
    }
    else {
      //If colission, repeat process
      colcheck();
    }
  }
});

router.get('/edit/:id',passport.authenticate('jwt', {session: false, failureRedirect: '/login'}),  async(req, res) => {
  var companyID = req.user.user;
  var orderID = "ORDER#" + req.headers.referer.slice(req.headers.referer.length - 6);
  var noTransfer = false;
  var paramsUser = {
    "TableName": process.env.AWS_DYNAMODB_TABLE,
    "KeyConditionExpression": "#cd420 = :cd420 And #cd421 = :cd421",
    "ExpressionAttributeNames": {"#cd420":"PK","#cd421":"SK"},
    "ExpressionAttributeValues": {":cd420": req.user.user,":cd421": req.user.user.replace("COMPANY", "PROFILE")}
  }

  userData = await db.queryv2(paramsUser);
  paymentData = userData.Items[0].paymentData
  if (paymentData.accNum == '' || paymentData.accType == '' || paymentData.bank == '' || paymentData.email == '' || paymentData.name == '' || paymentData.rut == '' || paymentData.accNum == ' ' || paymentData.accType == ' ' || paymentData.bank == ' ' || paymentData.email == ' ' || paymentData.name == ' ' || paymentData.rut == ' ' ) {
    noTransfer = true;
  }

  var paramsOrder = {
    "TableName": process.env.AWS_DYNAMODB_TABLE,
    "KeyConditionExpression": "#cd420 = :cd420 And #cd421 = :cd421",
    "ExpressionAttributeNames": {"#cd420":"PK","#cd421":"SK"},
    "ExpressionAttributeValues": {":cd420": companyID,":cd421": orderID}
  }
  getOrder = await db.queryv2(paramsOrder);
  var order = getOrder.Items[0];

  var message
  if (req.cookies.message) {
    message = req.cookies.message
    res.clearCookie('message');
  }

  res.render('order/edit', { title: 'Alia', editOrderInfo: order, userID: req.user.user.replace("COMPANY#", ""), noTransfer:noTransfer, message:message, userPlanID: req.user['custom:plan_id']});
});

router.post('/edit',passport.authenticate('jwt', {session: false, failureRedirect: '/login'}),  async(req, res) => {

  if (req.body.shipping == 'local') {
    req.body.shippingDate = ''
    req.body.locality = 'Retiro en tienda'
    req.body.shippingMethod = req.body.pickupAddress
  }
  else if(req.body.shipping == 'domicilio') {
    req.body.pickupDate = '';
  }

  //Shipping Cost
  if (!validator.isInt(req.body.shippingCost)) {
    res.redirect('/order/edit/'+req.headers.referer.slice(req.headers.referer.length - 6));
  }
  if (req.body.shippingCost < 0) {
    res.redirect('/order/edit/'+req.headers.referer.slice(req.headers.referer.length - 6));
  }

  // Parse the new items
  var itemList = [];
  var cost = 0;
  req.body.items.forEach((item, i) => {
    if (!validator.isInt(item.quantity)) {
      res.redirect('/order/edit/'+req.headers.referer.slice(req.headers.referer.length - 6));
    }
    if (!validator.isInt(item.price)) {
      res.redirect('/order/edit/'+req.headers.referer.slice(req.headers.referer.length - 6));
    }
    itemList[i] = {}
    itemList[i].product = item.product;
    itemList[i].quantity = parseInt(item.quantity);
    if (itemList[i].quantity <=0) {
      res.redirect('/order/edit/'+req.headers.referer.slice(req.headers.referer.length - 6));
    }
    itemList[i].price = parseInt(item.price);
    if (itemList[i].price <=0) {
      res.redirect('/order/edit/'+req.headers.referer.slice(req.headers.referer.length - 6));
    }
    cost = parseInt(cost + item.price * item.quantity);
    if (item.regProduct) {
      itemList[i].inventoryId = item.regProduct;
    }
  });

  // Get the original order to compare products.
  var orderID = "ORDER#" + req.headers.referer.slice(req.headers.referer.length - 6);
  var companyID = req.user.user;
  var paramsOrder = {
    "TableName": process.env.AWS_DYNAMODB_TABLE,
    "KeyConditionExpression": "#cd420 = :cd420 And #cd421 = :cd421",
    "ExpressionAttributeNames": {"#cd420":"PK","#cd421":"SK"},
    "ExpressionAttributeValues": {":cd420": companyID,":cd421": orderID}
  }
  getOrder = await db.queryv2(paramsOrder);
  var order = getOrder.Items[0];
  var changes = []
  // Check the original products and see if there are matches
  order.items.forEach((item, i) => {
    if (item.inventoryId) {
      var updated = itemList.find(x => x.inventoryId === item.inventoryId);
      var delta = 0;
      if (updated !== undefined) {
        if (updated.quantity != item.quantity) {
          delta = -(updated.quantity - item.quantity)
        }
      }
      else {
        delta = item.quantity
      }
      var change = {
        inventoryId: item.inventoryId,
        delta: delta
      }
      changes.push(change)
    }
  });
  // Check for new items that are not on the change list
  itemList.forEach((item, i) => {
    var inChanges = changes.find(x => x.inventoryId === item.inventoryId);
    if (inChanges === undefined) {
      var change = {
        inventoryId: item.inventoryId,
        delta: -item.quantity
      }
      changes.push(change)
    }
  });

  for (var change of changes) {
    if(change.inventoryId !== undefined){
      // Get the product on DynamoDB
      var paramsProduct = {
        "TableName": process.env.AWS_DYNAMODB_TABLE,
        "KeyConditionExpression": "#cd420 = :cd420 And #cd421 = :cd421",
        "ExpressionAttributeNames": {"#cd420":"PK","#cd421":"SK"},
        "ExpressionAttributeValues": {":cd420": req.user.user,":cd421": "PRODUCT#"+change.inventoryId.substring(6,12)}
      }
      // Do the query
      productQuery = await db.queryv2(paramsProduct);

      //subtract the quantity in Elasticsearch (subproduct or single). If it goes below zero, cap it to 0. (should warn the user in frontend)
      updateResult = await client.update({
        index:'products',
        id: change.inventoryId,
        body: {
          script: {
            lang: "painless",
            source: "if(ctx._source.stock != null){if(ctx._source.stock + params.count < 0){ctx._source.stock = 0}else{ctx._source.stock += params.count}}",
            params: {
              count: change.delta
            }
          }
        }
      })
      if (change.inventoryId.length == 18) {
        //subtract/add the delta to the main product in Elasticsearch. If it goes below zero, cap it to 0. (should warn the user in frontend)
        updateResult = await client.update({
          index:'products',
          id: change.inventoryId.substring(0,12),
          body: {
            script: {
              lang: "painless",
              source: "if(ctx._source.stock != null){if(ctx._source.stock + params.count < 0){ctx._source.stock = 0}else{ctx._source.stock += params.count}}",
              params: {
                count: change.delta
              }
            }
          }
        })
        if (productQuery.Items[0].stock != null) {
          // Get the subproduct index
          subproductIndex = productQuery.Items[0].subproduct.findIndex(x=>x.id===change.inventoryId.substring(12,18))
          // Set the parameters for updating the product
          params = {
            "TableName": process.env.AWS_DYNAMODB_TABLE,
            "Key": {
              "PK":req.user.user,
              "SK": "PRODUCT#"+change.inventoryId.substring(6,12)
            },
            "UpdateExpression": "set stock = stock + :val, subproduct["+subproductIndex+"].stock = subproduct["+subproductIndex+"].stock + :val",
            "ExpressionAttributeValues": {":val":change.delta},
            "ReturnValues": "UPDATED_NEW"
          }
          // Do the update
          updateResult = await db.update(params);
        }
      }
      else {
        if (productQuery.Items[0].stock != null) {
          params = {
            "TableName": process.env.AWS_DYNAMODB_TABLE,
            "Key": {
              "PK":req.user.user,
              "SK": "PRODUCT#"+change.inventoryId.substring(6,12)
            },
            "UpdateExpression": "set stock = stock + :val",
            "ExpressionAttributeValues": {":val":change.delta},
            "ReturnValues": "UPDATED_NEW"
          }
          // Do the update
          updateResult = await db.update(params);
        }
      }
    }
  }

  var orderID = "ORDER#" + req.headers.referer.slice(req.headers.referer.length - 6);
  var payment = 0;
  if (req.body.payment == 'efectivo') {
    payment = 3;
  }
  var params = {
    "TableName": process.env.AWS_DYNAMODB_TABLE,
    "Key": {
      "PK":req.user.user,
      "SK": orderID
    },
    "UpdateExpression": "set #items = :items, #updatedAt = :updatedAt, #status.#payment = :payment, #clientData.#address.#locality = :locality, #cost.#order = :orderCost, #cost.#shipping= :shippingCost, #shippingMethod=:shippingMethod, #shippingDate=:shippingDate, #pickupAddress=:pickupAddress, #pickupDate=:pickupDate",
    "ExpressionAttributeNames": {
      "#items":"items",
      "#updatedAt":"updatedAt",
      "#status":"status",
      "#payment":"payment",
      "#clientData":"clientData",
      "#address":"address",
      "#locality":"locality",
      "#cost":"cost",
      "#order":"order",
      "#shipping":"shipping",
      "#shippingMethod":"shippingMethod",
      "#shippingDate":"shippingDate",
      "#pickupAddress":"pickupAddress",
      "#pickupDate":"pickupDate"
    },
    "ExpressionAttributeValues": {
      ":items": itemList,
      ":updatedAt": Date.now(),
      ":payment": payment,
      ":locality": req.body.locality,
      ":orderCost": cost,
      ":shippingCost": parseInt(req.body.shippingCost),
      ":shippingMethod": req.body.shippingMethod,
      ":shippingDate": req.body.shippingDate,
      ":pickupAddress": req.body.pickupAddress,
      ":pickupDate": req.body.pickupDate
    }
  }
  updateResult = await db.update(params);

  // Update ElasticSearch
  result = await client.index({
    index: 'orders',
    id: req.user.user.replace("COMPANY#", "") + req.headers.referer.slice(req.headers.referer.length - 6),
    body: {
      "owner": req.user.user.replace("COMPANY#", ""),
      "cost": {
        "shipping": parseInt(req.body.shippingCost),
        "order": cost
      },
      "shippingMethod": req.body.shippingMethod,
      "locality": req.body.locality,
      "createdAt": Date.now(),
      "pickupAddress": req.body.pickupAddress,
      "items": itemList,
      "paymentType": payment,
    }
  })

  res.cookie('message', {type:'success', message:'Orden editada con éxito'});
  res.redirect('/detail/'+req.headers.referer.slice(req.headers.referer.length - 6));
});

router.post('/delete',passport.authenticate('jwt', {session: false, failureRedirect: '/login'}),  async(req, res) => {
  var companyID = req.user.user;
  var orderID = "ORDER#" + req.headers.referer.slice(req.headers.referer.length - 6);
  var valid = true;

  var params = {
    "TableName": process.env.AWS_DYNAMODB_TABLE,
    "KeyConditionExpression": "#cd420 = :cd420 And #cd421 = :cd421",
    "ExpressionAttributeNames": {"#cd420":"PK","#cd421":"SK"},
    "ExpressionAttributeValues": {":cd420": companyID,":cd421": orderID}
  }

  getOrder = await db.queryv2(params);
  var orderStatus = getOrder.Items[0].status.order;
  if(orderStatus == 0){
    var deleteParams = {
      "TableName": process.env.AWS_DYNAMODB_TABLE,
      "Key": {
        "PK": companyID,
        "SK": orderID
      },
      "ConditionExpression": "#cd420 = :cd420 And #cd421 = :cd421",
      "ExpressionAttributeNames": {"#cd420":"PK","#cd421":"SK"},
      "ExpressionAttributeValues": {":cd420": companyID ,":cd421": orderID}
    }
    deleteOrder = await db.delete(deleteParams);

    // Delete from Elasticsearch
    await client.delete({
      index: "orders",
      id: req.user.user.replace("COMPANY#", "") + req.headers.referer.slice(req.headers.referer.length - 6)
    });

    for (var item of getOrder.Items[0].items) {
      if (item.inventoryId) {
        // Set the params variable for DynamoDB
        var updateParams = {}
        //Query the product on DynamoDB
        var productParams = {
          "TableName": process.env.AWS_DYNAMODB_TABLE,
          "KeyConditionExpression": "#cd420 = :cd420 And #cd421 = :cd421",
          "ExpressionAttributeNames": {"#cd420":"PK","#cd421":"SK"},
          "ExpressionAttributeValues": {":cd420": req.user.user,":cd421": "PRODUCT#"+item.inventoryId.substring(6,12)}
        }
        var productResult = await db.queryv2(productParams);
        // Check if it has stock control
        if (productResult.Items[0].stock != null) {
          updateResult = await client.update({
            index:'products',
            id: item.inventoryId,
            body: {
              script: {
                lang: "painless",
                source: "if(ctx._source.stock != null){ctx._source.stock += params.count}",
                params: {
                  count: item.quantity
                }
              }
            }
          })
          // It has stock control. Check if it's a subproduct
          if (item.inventoryId.length == 18) {
            updateResult = await client.update({
              index:'products',
              id: item.inventoryId.substring(0,12),
              body: {
                script: {
                  lang: "painless",
                  source: "if(ctx._source.stock != null){ctx._source.stock += params.count}",
                  params: {
                    count: item.quantity
                  }
                }
              }
            })
            // It is a subproduct. Get the subproduct index.
            var subproductIndex = productResult.Items[0].subproduct.findIndex(x=>x.id===item.inventoryId.substring(12,18))
            // Generate the parameters for update
            updateParams = {
              "TableName": process.env.AWS_DYNAMODB_TABLE,
              "Key": {
                "PK":req.user.user,
                "SK": "PRODUCT#"+item.inventoryId.substring(6,12)
              },
              "UpdateExpression": "set stock = stock + :val, subproduct["+subproductIndex+"].stock = subproduct["+subproductIndex+"].stock + :val",
              "ExpressionAttributeValues": {":val":item.quantity},
              "ReturnValues": "UPDATED_NEW"
            }
          }
          else {
            // It is not a subproduct. Generate the parameters for update
            updateParams = {
              "TableName": process.env.AWS_DYNAMODB_TABLE,
              "Key": {
                "PK":req.user.user,
                "SK": "PRODUCT#"+item.inventoryId.substring(6,12)
              },
              "UpdateExpression": "set stock = stock - :val",
              "ExpressionAttributeValues": {":val":item.quantity},
              "ReturnValues": "UPDATED_NEW"
            }
          }
          // Do the update
          updateResult = await db.update(updateParams);
        }
      }
    }
    res.cookie('message', {type:'success', message:'Orden eliminada con éxito'});
    res.redirect("/historial")
    // delete (standby for backend help since this is a destructive operation)
  }
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
    "TableName": process.env.AWS_DYNAMODB_TABLE,
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
  if (getOrder.Items[0].status.M.shippingDate) {
    if (getOrder.Items[0].status.M.shippingDate.S != "") {
      var parsed_deliveryDate = getOrder.Items[0].status.M.shippingDate.S.split("-");
      getOrder.Items[0].status.M.shippingDate.S = parsed_deliveryDate[2] + "/" + parsed_deliveryDate[1] + "/" + parsed_deliveryDate[0];
    }
  }
  params = {
    "TableName": process.env.AWS_DYNAMODB_TABLE,
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
  var valid = true;
  var orderStatus;
  var paymentStatus;

  var params = {
    "TableName": process.env.AWS_DYNAMODB_TABLE,
    "KeyConditionExpression": "#cd420 = :cd420 And #cd421 = :cd421",
    "ExpressionAttributeNames": {"#cd420":"PK","#cd421":"SK"},
    "ExpressionAttributeValues": {":cd420": companyID,":cd421": orderID}
  }

  getOrder = await db.queryv2(params);

  //Check Terms
  if (req.body.tyc != 'on') {
    res.redirect(req.headers.referer);
    valid = false;
  }

  //Check fields
  if (await !validator.isAlpha(req.body.nombre.trim().replace(" ", ""),'es-ES')) {
    res.redirect(req.headers.referer);
    valid = false;
  }

  if (await !validator.isAlpha(req.body.apellido.trim().replace(" ", ""),'es-ES')) {
    res.redirect(req.headers.referer);
    valid = false;
  }

  if (await validator.isEmpty(req.body.telefono)) {
    res.redirect(req.headers.referer);
    valid = false;
  }

  if (await !validator.isEmail(req.body.email)) {
    res.redirect(req.headers.referer);
    valid = false;
  }
  if (valid == true) {
    //Check if payment is cash or card
    if (getOrder.Items[0].status.payment != 3) {
      //Check image uploading and save the image
      var s3up;
      if (req.file) {
        if (await !req.file.mimetype.startsWith("image")) {
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
              paymentStatus = 1;
            }
          }).promise();

        }
      }
      else {
        res.redirect(req.headers.referer);
      }
    }
    else {
      paymentStatus = 3;
    }
    if (getOrder.Items[0].shippingMethod == "Retiro en tienda" || getOrder.Items[0].clientData.address.locality == "Retiro en tienda") {
      req.body.apart = "";
      req.body.direccion= "";
    }

    //Save the order data

    var params = {
      "TableName": process.env.AWS_DYNAMODB_TABLE,
      "Key": {
        "PK":companyID,
        "SK": orderID
      },
      "UpdateExpression": "set #clientData.#firstName = :firstName, #clientData.#lastName = :lastName, #clientData.#email = :email, #clientData.#contactNumber = :contactNumber, #clientData.#address.#street = :street, #clientData.#address.#apart = :apart, #comment = :comment, #status.#order = :order, #status.#payment = :payment, #updatedAt = :updatedAt ",
      "ExpressionAttributeNames": {
        "#clientData":"clientData",
        "#firstName":"firstName",
        "#lastName":"lastName",
        "#email":"email",
        "#contactNumber":"contactNumber",
        "#comment":"comment",
        "#status":"status",
        "#order":"order",
        "#payment":"payment",
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
        ":payment": paymentStatus,
        ":updatedAt": Date.now(),
        ":street": req.body.direccion,
        ":apart": req.body.apart
      },
      "ReturnValues": "ALL_NEW"
    }
    updateResult = await db.update(params);

    //Add commentary
    params = {
      "TableName": process.env.AWS_DYNAMODB_TABLE,
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

  }
});

module.exports = router;
