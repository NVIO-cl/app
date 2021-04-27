const express = require('express');
const router = express.Router();
const passport = require('passport');
const validator = require('validator');
const { nanoid } = require("nanoid");
const { Client } = require('@elastic/elasticsearch')
var db = require("../db");
const client = new Client({
  node: process.env.ELASTIC_ENDPOINT,
  auth: {
    username: process.env.ELASTIC_USERNAME,
    password: process.env.ELASTIC_PASSWORD
  }
})

router.get('/',passport.authenticate('jwt', {session: false, failureRedirect: '/login'}),  async(req, res) => {
  const name = "Inventario";
  const result = await client.search({
    index: 'products',
    body: {
      query: {
        bool: {
          must: [
            {
              terms: {"productType": ["main","single"]}
            },
            {
              match: {"owner": req.user.user.replace("COMPANY#","")}
            }
          ]
        }
      }
    }
  })
  console.log(result.body.hits.hits);
  res.render('inventory/index', {title: name, userID: req.user.user.replace("COMPANY#", ""), results: result.body.hits.hits});
});

router.get('/create',passport.authenticate('jwt', {session: false, failureRedirect: '/login'}),  async(req, res) => {
  const name = "Producto";
  res.render('inventory/create', {title: name, userID: req.user.user.replace("COMPANY#", "")});
});

router.post('/create', passport.authenticate('jwt', {session: false, failureRedirect: '/login'}), async(req,res)=>{
  //Data Parsing
  //Parse stock checking bool
  if (req.body.checkStock === undefined) {
    req.body.checkStock = false
  }
  else {
    req.body.checkStock = true
  }
  //Parse attribute checking bool
  if (req.body.checkAttributes === undefined) {
    req.body.checkAttributes = false
    delete req.body.attributes
  }
  else {
    req.body.checkAttributes = true
  }

  //Trim the name
  req.body.productName = req.body.productName.trim();

  //Convert main price string to int
  req.body.productPrice = parseInt(req.body.productPrice);

  // If main stock is NaN, set it to null. If not, parse the stock.
  if (isNaN(parseInt(req.body.productStock))) {
    req.body.productStock = null
  }
  else {
    req.body.productStock = parseInt(req.body.productStock);
  }

  if (req.body.checkAttributes) {
    //Convert attribute list into an array if it exists
    for (var attribute of req.body.attributes) {
      attribute.values = attribute.values.split(",")
      for (var index in attribute.values) {
        attribute.values[index] = attribute.values[index].trim()
      }
    }
    // Parse the subproducts stock and price
    req.body.subproduct.forEach((item, i) => {
      item.price = parseInt(item.price)
      if (req.body.checkStock) {
        item.stock = parseInt(item.stock)
      }
      else {
        item.stock = null;
      }
    });
  }

  // TODO: Parse numbers (negatives and decimals) and possible empty names and values

  // DynamoDB Section

  // Define the product to be saved to DynamoDB
  var dynamoProduct = {}
  //If there are attributes, add them to the product.
  if (req.body.checkAttributes) {
    dynamoProduct.attributesList = []
    //Iterate for each attribute.
    req.body.attributes.forEach((item, i) => {
      dynamoProduct.attributesList[i] = {
        name: item.name,
        values: item.values
      }
    });
  }
  // A new product is available by default, always.
  dynamoProduct.available = true;

  // If there are attributes, the main product price must be null. If not, set it.
  if(req.body.checkAttributes){
    dynamoProduct.price = null;
  }
  else {
    dynamoProduct.price = req.body.productPrice;
  }

  // Set the product name
  dynamoProduct.productName = req.body.productName;

  // Set the product type
  if (req.body.checkAttributes) {
    dynamoProduct.productType = "main"
  }
  else {
    dynamoProduct.productType = "single"
  }

  // If the product has subproducts, the stock is the sum of the subproducts stock. Only if stock is checked.
  if (req.body.checkStock) {
    if (req.body.checkAttributes) {
      var totalStock = 0;
      req.body.subproduct.forEach((item, i) => {
        totalStock += item.stock
      });
      dynamoProduct.stock = totalStock
    }
    else {
      dynamoProduct.stock = req.body.productStock
    }
  }
  else {
    dynamoProduct.stock = null
  }
  // If there are attributes, add the subproducts to the main product in DynamoDB
  if (req.body.checkAttributes) {
    dynamoProduct.subproduct = []
    req.body.subproduct.forEach((item, i) => {
      dynamoProduct.subproduct[i] = item
    });
  }

  //Create Product ID variable
  var productID;
  //Save the product in DynamoDB (checking for ID colission, of course)
  //We need to use await becuase we need the product ID :(
  await colcheck();
  async function colcheck(){
    //Generate ID
    productID = nanoid(6);
    var dynamoIDs = {
      "PK": req.user.user,
      "SK": "PRODUCT#"+productID,
    }
    //Join the DynamoDB Keys and the dynamo product
    var Item = Object.assign({},dynamoIDs,dynamoProduct)
    var paramsProduct = {
      "TableName": process.env.AWS_DYNAMODB_TABLE,
      "KeyConditionExpression": "#cd420 = :cd420 And #cd421 = :cd421",
      "ExpressionAttributeNames": {"#cd420":"PK","#cd421":"SK"},
      "ExpressionAttributeValues": {":cd420": req.user.user,":cd421": "PRODUCT#"+productID}
    }
    productQuery = await db.queryv2(paramsProduct);
    //Check for colission
    if (productQuery.Count == 0) {
      //If no colission, create the product!
      params = {
        TableName:process.env.AWS_DYNAMODB_TABLE,
        Item: Item,
      };
      putProduct = await db.put(params);
    }
    else {
      //If colission, repeat process
      colcheck();
    }
  }
  console.log(productID);
  //DynamoDB insertion finished

  console.log(dynamoProduct);
  res.json(dynamoProduct);

  /*

  //Add owner data
  req.body.owner = req.user.user.replace("COMPANY#", "")





  //Check if stock control is activated
  if (req.body.checkStock == "on") {
    req.body.checkStock = true
    req.body.productStock = parseInt(req.body.productStock)
  }
  else {
    req.body.checkStock = false
    delete req.body.productStock
  }

  //Check if attribute/subproduct control is activated
  if (req.body.checkAttributes == "on") {
    //Delete the price from the master product
    delete req.body.productPrice;
    req.body.checkAttributes = true
    //Convert attribute list into an array
    for (var attribute of req.body.attributes) {
      attribute.values = attribute.values.split(",")
      for (var index in attribute.values) {
        attribute.values[index] = attribute.values[index].trim()
      }
    }
    //Add subproduct stock sum to master product if stock control is activated
    if (req.body.checkStock == true) {
      var totalStock = 0;
      for (var subproduct of req.body.subproduct) {
        totalStock = totalStock+parseInt(subproduct.stock);
      }
      req.body.productStock = totalStock;
    }
  }
  else {
    req.body.checkAttributes = false;
    delete req.body.attributes
  }


  //Create the master product
  var masterProduct = {
    "name": req.body.productName,
    "price": req.body.productPrice,
    "stock": req.body.productStock,
    "checkStock": req.body.checkStock,
    "checkAttributes": req.body.checkAttributes,
    "attributes": req.body.attributes,
    "owner": req.body.owner
  }
  //Delete undefined variables (don't exist/not used)
  Object.keys(masterProduct).forEach(key => masterProduct[key] === undefined && delete masterProduct[key])

  //If subproducts exist, add them to the master product
  if (masterProduct.attributes) {
    console.log("SUBPRODUCTS EXIST");
    var subproducts = []
    //If stock control is deactivated, delete the stock
    if (!masterProduct.checkStock) {
      for (var subproduct of req.body.subproduct) {
        delete subproduct.stock
      }
    }
    //add the subproducts to the master product
    masterProduct.subproducts = [];
    for (var subproduct of req.body.subproduct) {
      //parse the price into an int
      subproduct.price = parseInt(subproduct.price)
      //If stock control is activated, parse the stock into an int
      if (masterProduct.checkStock) {
        subproduct.stock = parseInt(subproduct.stock)
      }
      masterProduct.subproducts.push(subproduct)
    }
  }
  //Create Product ID variable
  var productID;
  //Save the master product in DynamoDB (checking for ID colission, of course)
  //We need to use await becuase we need the product ID :(
  await colcheck();
  async function colcheck(){
    //Generate ID
    productID = nanoid(6);
    var dynamoIDs = {
      "PK": req.user.user,
      "SK": "PRODUCT#"+productID,
    }
    //Join the DynamoDB Keys and the master product
    var Item = Object.assign({},dynamoIDs,masterProduct)
    //We don't want to save the owner in DynamoDB (It's in the PK)
    delete Item.owner;
    var paramsProduct = {
      "TableName": process.env.AWS_DYNAMODB_TABLE,
      "KeyConditionExpression": "#cd420 = :cd420 And #cd421 = :cd421",
      "ExpressionAttributeNames": {"#cd420":"PK","#cd421":"SK"},
      "ExpressionAttributeValues": {":cd420": req.user.user,":cd421": "PRODUCT#"+productID}
    }
    productQuery = await db.queryv2(paramsProduct);
    //Check for colission
    if (productQuery.Count == 0) {
      //If no colission, create the product!
      params = {
        TableName:process.env.AWS_DYNAMODB_TABLE,
        Item: Item,
      };
      putProduct = await db.put(params);
    }
    else {
      //If colission, repeat process
      colcheck();
    }
  }
  console.log(productID);
  //DynamoDB insertion finished


  //Put back the owner. We need it for elasticsearch
  masterProduct.owner = req.body.owner
  //If there are subproducts, pull them apart from the master product
  var subproducts
  if (masterProduct.checkAttributes) {
    subproducts = masterProduct.subproducts
    //We don't need the subproducts in the master product anymore
    delete masterProduct.subproducts
    //We don't need the attributes in elasticsearch (they're not a search term)
    delete masterProduct.attributes
    //We need the owner in the subproducts
    var subID = 0
    for (var subproduct of subproducts) {
      subproduct.owner = req.body.owner;
      //Add a checkAttributes=false to make searching easier
      subproduct.checkAttributes = false;
    }

  }
  //Save the master product in Elasticsearch
  result = await client.index({
    index: 'products',
    id: req.body.owner + productID,
    body: masterProduct
  })

  //if there are subproducts, save them as separate documents (to make them searchable)
  if (masterProduct.checkAttributes) {
    var body = subproducts.flatMap((doc,i) => [{ index: { _index: 'subproducts', _id: req.body.owner+productID+"-"+i  } }, doc])
    const { body: bulkResponse } = await client.bulk({ refresh: true, body })
    console.log(bulkResponse);
  }


  res.json(masterProduct);
  */
});

router.post('/searchProduct',passport.authenticate('jwt', {session: false, failureRedirect: '/login'}),  async(req, res) => {
  console.log(req.body.name);
  console.log(req.user.user.replace("COMPANY#",""));
  const result = await client.search({
    index: 'products',
    size: 5,
    body: {
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query: req.body.name,
                type: "bool_prefix",
                fields: [
                  "productName",
                  "productName._2gram",
                  "productName._3gram"
                ]
              }
            },
            {
              terms: {"productType": ["sub","single"]}
            },
            {
              match: {"owner": req.user.user.replace("COMPANY#","")}
            }
          ]
        }
      }
    }
  })
  console.log(result.body.hits.hits);
  //Get only those with score >= 1
  result.body.hits.hits = result.body.hits.hits.filter(item=>(item._score>=1))
  res.status(200).json(result.body.hits.hits)

});

module.exports = router;
