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

  // Base query
  var search = {
    index: 'products',
    body: {
      query: {
        bool: {
          must: [
            {
              terms: {"productType": ["single","main"]}
            },
            {
              match: {"owner": req.user.user.replace("COMPANY#","")}
            }
          ]
        }
      }
    }
  }

  // Query contains paginationAmount
  var c = parseInt(req.query.c);
  if(!req.query.c){
    var c = 5
    search['size'] = c;
  } else {
    search['size'] = c;
  }

  // Query contains product
  if (req.query.s){
    var s = req.query.s
    let multi_match = {
      multi_match: {
        query: s,
        type: "bool_prefix",
        fields: [
          "productName",
          "productName._2gram",
          "productName._3gram"
        ]
      }
    };
    search.body.query.bool.must.push(multi_match)
  }

  // Current page
  var p = parseInt(req.query.p)
  if(!req.query.p){
    p = 1
  }

  // Elasticsearch pagination
  search['from'] = c*(p-1);

  // Query
  var result = await client.search(search)

  // Cálculo de páginas para frontend
  var hitsAmount = result.body.hits.total.value
  var pagesAmount = Math.ceil(hitsAmount/c)
  var pages = [1, 2, 3]

  if (pagesAmount >= 3){
    if (p==pagesAmount){
      pages = [p-2, p-1, p]
    } else if (p >= 3) {
      pages = [p-1, p, p+1]
    }
  } else if (pagesAmount == 2){
    pages = [1, 2]
  } else {
    pages = [1]
  }

  res.render('inventory/index', {title: name, userID: req.user.user.replace("COMPANY#", ""), results: result.body.hits.hits, c: c, s: s, p:p, base_url: req.url, pages: pages, pagesAmount:pagesAmount});
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

      // Add an ID to each one.
      var usedIDs = []
      var subID = nanoid(6);
      while (usedIDs.includes(subID)) {
        subID = nanoid(6);
      }
      usedIDs.push(subID);
      item.id = subID
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

  // Create Product ID variable
  var productID;
  // Save the product in DynamoDB (checking for ID colission, of course)
  // We need to use await becuase we need the product ID :(
  await colcheck();
  async function colcheck(){
    //Generate ID
    productID = nanoid(6);
    var dynamoIDs = {
      "PK": req.user.user,
      "SK": "PRODUCT#"+productID,
    }
    // Join the DynamoDB Keys and the dynamo product
    var Item = Object.assign({},dynamoIDs,dynamoProduct)
    var paramsProduct = {
      "TableName": process.env.AWS_DYNAMODB_TABLE,
      "KeyConditionExpression": "#cd420 = :cd420 And #cd421 = :cd421",
      "ExpressionAttributeNames": {"#cd420":"PK","#cd421":"SK"},
      "ExpressionAttributeValues": {":cd420": req.user.user,":cd421": "PRODUCT#"+productID}
    }
    productQuery = await db.queryv2(paramsProduct);
    // Check for colission
    if (productQuery.Count == 0) {
      // If no colission, create the product!
      params = {
        TableName:process.env.AWS_DYNAMODB_TABLE,
        Item: Item,
      };
      putProduct = await db.put(params);
    }
    else {
      // If colission, repeat process
      colcheck();
    }
  }
  console.log(productID);
  // DynamoDB insertion finished

  // Elasticsearch Section
  // Define the product to be saved to Elasticsearch
  var elasticProduct = {}

  //If there are attributes, add them to the product.
  if (req.body.checkAttributes) {
    elasticProduct.attributesList = []
    //Iterate for each attribute.
    req.body.attributes.forEach((item, i) => {
      elasticProduct.attributesList[i] = {
        name: item.name,
        values: item.values
      }
    });
  }
  // A new product is available by default, always.
  elasticProduct.available = true;

  // Set the owner of the product
  elasticProduct.owner = req.user.user.replace("COMPANY#", "")

  // If there are attributes, the main product price must be null. If not, set it.
  if(req.body.checkAttributes){
    elasticProduct.price = null;
  }
  else {
    elasticProduct.price = req.body.productPrice;
  }

  // Set the product name
  elasticProduct.productName = req.body.productName;

  // Set the product type
  if (req.body.checkAttributes) {
    elasticProduct.productType = "main"
  }
  else {
    elasticProduct.productType = "single"
  }

  var elasticID = req.user.user.replace("COMPANY#", "") + productID
  // If the product has subproducts, the stock is the sum of the subproducts stock. Only if stock is checked.
  if (req.body.checkStock) {
    if (req.body.checkAttributes) {
      var totalStock = 0;
      req.body.subproduct.forEach((item, i) => {
        totalStock += item.stock
      });
      elasticProduct.stock = totalStock
    }
    else {
      elasticProduct.stock = req.body.productStock
    }
  }
  else {
    elasticProduct.stock = null
  }
  // Save the main product to get the ID.
  result = await client.index({
    index: 'products',
    id: elasticID,
    body: elasticProduct
  })
  console.log("=====MAIN RESULT====");
  console.log(result);

  // If there are attributes, create the subproducts independently
  if (req.body.checkAttributes) {
    elasticSubproducts = []
    req.body.subproduct.forEach((item, i) => {
      elasticSubproducts[i] = {};
      elasticSubproducts[i].attributes = item.attributes;
      elasticSubproducts[i].available = true;
      elasticSubproducts[i].owner = req.user.user.replace("COMPANY#", "");
      elasticSubproducts[i].parent = result.body._id;
      elasticSubproducts[i].price = item.price;
      elasticSubproducts[i].productName = item.name;
      elasticSubproducts[i].productType = "sub";
      elasticSubproducts[i].stock = item.stock;
    });
    var body = elasticSubproducts.flatMap((doc,i) => [{ index: { _index: 'products', _id: elasticSubproducts[i].parent+req.body.subproduct[i].id } }, doc])
    const { body: bulkResponse } = await client.bulk({ refresh: true, body })
    console.log("====BULK RESULT====");
    console.log(bulkResponse);
  }
  res.redirect('/inventory');
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

