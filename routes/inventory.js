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

// If the plan ID is lower than 1, redirect the user to the billing page
router.use(passport.authenticate('jwt', {session: false, failureRedirect: '/login'}),async (req,res,next)=>{
  if (req.user['custom:plan_id'] >= 1) {
    next();
  }
  else {
    res.redirect('/billing')
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

  // Query contains filter
  var f = req.query.f
  if (f != undefined){
    var f_query = f.split('_')
    var variable = f_query[0]
    var order = f_query[1]
    search['sort'] = variable + ':' + order
  }

  // Query
  try{
    var result = await client.search(search)
  } catch (e) {
    console.log(e.meta.body.error.root_cause)
  }


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

  res.render('inventory/index', {title: name, userID: req.user.user.replace("COMPANY#", ""), results: result.body.hits.hits, c: c, s: s, p:p, f:f, base_url: req.url, pages: pages, pagesAmount:pagesAmount});
});

router.get('/create',passport.authenticate('jwt', {session: false, failureRedirect: '/login'}),  async(req, res) => {
  const name = "Producto";
  res.render('inventory/create', {title: name, userID: req.user.user.replace("COMPANY#", "")});
});

router.get('/detail/:id',passport.authenticate('jwt', {session: false, failureRedirect: '/login'}),  async(req, res) => {
  const name = "Detalle del Producto";
  var message;
  if (req.cookies.message != '') {
    message = req.cookies.message
    res.clearCookie('message');
  }
  var companyID = req.user.user;
  var productId = req.originalUrl.slice(req.originalUrl.length - 6);
  var paramsProduct = {
    "TableName": process.env.AWS_DYNAMODB_TABLE,
    "KeyConditionExpression": "#cd420 = :cd420 And #cd421 = :cd421",
    "ExpressionAttributeNames": {"#cd420":"PK","#cd421":"SK"},
    "ExpressionAttributeValues": {":cd420": companyID,":cd421": "PRODUCT#" + productId}
  }
  getProduct = await db.queryv2(paramsProduct);
  var product = getProduct.Items[0];

  res.render('inventory/detail', {title: name, userID: req.user.user.replace("COMPANY#", ""), product: product, productId: productId, message:message});
});

router.post('/edit', passport.authenticate('jwt', {session: false, failureRedirect: '/login'}),  async(req, res) =>{
  var params = {}
  var isValid = true;
  var totalStock = 0;
  // If the stock is undefined, set it as null
  if (req.body.productStock === undefined) {
    req.body.productStock = null
  }
  else {
    req.body.productStock = parseInt(req.body.productStock)
  }
  req.body.stock = req.body.productStock
  delete req.body.productStock

  // Check if it's a product with subproducts or a single product
  if (req.body.subproduct) {
    // It is a product with subproducts. We also need the OG product from DynamoDB.
    params = {
      "TableName": process.env.AWS_DYNAMODB_TABLE,
      "KeyConditionExpression": "#cd420 = :cd420 And #cd421 = :cd421",
      "ExpressionAttributeNames": {"#cd420":"PK","#cd421":"SK"},
      "ExpressionAttributeValues": {":cd420": req.user.user,":cd421": "PRODUCT#" + req.headers.referer.slice(-6)}
    }
    getProduct = await db.queryv2(params);
    var product = getProduct.Items[0];

    // Save the already used subproduct IDs.
    var usedIDs = []
    product.subproduct.forEach((subproduct, i) => {
      usedIDs.push(subproduct.id)
    });

    // Define an array for new subproducts
    var newSubproducts = []
    var disableSubproducts = []

    // Change variable name
    delete req.body.productStock
    req.body.attributesList = req.body.attributes
    delete req.body.attributes
    req.body.price = null;

    // Parse the attributes
    req.body.attributesList.forEach((attribute, i) => {
      attribute.values = attribute.values.split(",")
      attribute.values.forEach((value, n) => {
        attribute.values[n] = value.trim()
      });
    });

    // Check each subproduct
    req.body.subproduct.forEach((subproduct, i) => {
      // Change variable name
      subproduct.attributes = subproduct.attribute
      delete subproduct.attribute

      // Change variable name and set new attribute names
      var nameAssembly = ""
      subproduct.attributes.forEach((attribute, i) => {
        attribute.name = req.body.attributesList[i].name
        attribute.value = attribute.attribute;
        nameAssembly += attribute.name + " " + attribute.attribute
        delete attribute.attribute;
      });

      // If price is '', set it as 0. If not, parse it
      if (subproduct.price == '') {
        subproduct.price = 0;
      }
      else {
        subproduct.price = parseInt(subproduct.price)
      }

      // If stock is not undefined and it's '', set it as 0. If not undefined and not '', parse it
      if (subproduct.stock !== undefined) {
        if (subproduct.stock == '') {
          subproduct.stock = 0;
        }
        else {
          subproduct.stock = parseInt(subproduct.stock);
        }
        totalStock += subproduct.stock
        req.body.stock = totalStock
      }

      // Configure new name
      subproduct.name = req.body.productName + " " + nameAssembly

      //If the ID is not present, create it and append that subproduct to newSubproduct
      if (!subproduct.id) {
        var subID = nanoid(6);
        while (usedIDs.includes(subID)) {
          subID = nanoid(6);
        }
        usedIDs.push(subID);
        subproduct.id = subID
        newSubproducts.push(subproduct)
      }

      //Check if attribute values are not present, disable it. If they are, enable it.
      subproduct.attributes.forEach((attribute, i) => {
        if (!req.body.attributesList[i].values.includes(attribute.value)) {
          disableSubproducts.push(subproduct)
          subproduct.available = false;
        }
        else {
          subproduct.available = true;
        }
      });
    });

    // If there are new subproducts to be created, do it.
    if (newSubproducts.length > 0) {
      elasticNewSubproducts = []
      newSubproducts.forEach((item, i) => {
        elasticNewSubproducts[i] = {};
        elasticNewSubproducts[i].attributes = item.attributes;
        elasticNewSubproducts[i].available = true;
        elasticNewSubproducts[i].owner = req.user.user.replace("COMPANY#", "");
        elasticNewSubproducts[i].parent = req.user.user.slice(-6)+product.SK.slice(-6);
        elasticNewSubproducts[i].price = item.price;
        elasticNewSubproducts[i].productName = item.name;
        elasticNewSubproducts[i].productType = "sub";
        elasticNewSubproducts[i].stock = item.stock;
      });
      var body = elasticNewSubproducts.flatMap((doc,i) => [{ index: { _index: 'products', _id: elasticNewSubproducts[i].parent+newSubproducts[i].id } }, doc])
      const { body: bulkResponse } = await client.bulk({ refresh: true, body })
    }

    // Delete duplicates of the disableSubproducts array
    var uniqueDisableSubproducts = new Set(disableSubproducts);
    disableSubproducts = Array.from(uniqueDisableSubproducts)

    // If there are subproducts to be disabled, do it.
    if (disableSubproducts.length > 0) {
      for (var subproduct of disableSubproducts) {
        var getID = req.user.user.slice(-6) + product.SK.slice(-6) + subproduct.id
        var body = await client.update({
          index: 'products',
          id: getID,
          body: {
            doc: {
              available: false
            }
          }
        })
      }
    }

    // Update all the subproducts in Elasticsearch
    for (var subproduct of req.body.subproduct) {
      var updateID = req.user.user.slice(-6) + product.SK.slice(-6) + subproduct.id;
      await client.update({
        index: 'products',
        id: updateID,
        body: {
          doc: {
            productName: subproduct.name,
            price: subproduct.price,
            stock: subproduct.stock,
            attributes: subproduct.attributes,
            available: subproduct.available
          }
        }
      })
    }

    // Update the product in DynamoDB
    params = {
      "TableName": process.env.AWS_DYNAMODB_TABLE,
      "Key": {
        "PK": req.user.user,
        "SK": 'PRODUCT#'+req.headers.referer.slice(-6)
      },
      "UpdateExpression": "set #productName = :productName, #stock = :stock, #subproduct = :subproduct, #attributesList = :attributesList",
      "ExpressionAttributeNames": {
        "#productName":"productName",
        "#stock":"stock",
        "#subproduct":"subproduct",
        "#attributesList":"attributesList"
      },
      "ExpressionAttributeValues": {
        ":productName": req.body.productName,
        ":stock": req.body.stock,
        ":subproduct": req.body.subproduct,
        ":attributesList": req.body.attributesList
      }
    }
    updateProductResult = await db.update(params);

    // Update the product in Elasticsearch
    await client.update({
      index: 'products',
      id: req.user.user.slice(-6) + product.SK.slice(-6),
      body: {
        doc: {
          productName: req.body.productName,
          stock: req.body.stock,
          attributesList: req.body.attributesList
        }
      }
    })
    res.cookie('message', {type:'success', content:'Producto editado con éxito'});
    res.redirect(req.headers.referer)
  }

  else {
    // It is a single product
    if (req.body.productName == '') {
      isValid = false
    }
    if (isValid) {

      // Update Dynamo
      params = {
        "TableName": process.env.AWS_DYNAMODB_TABLE,
        "Key": {
          "PK": req.user.user,
          "SK": 'PRODUCT#'+req.headers.referer.slice(-6)
        },
        "UpdateExpression": "set #productName = :productName, #price = :price, #stock = :stock ",
        "ExpressionAttributeNames": {
          "#productName":"productName",
          "#price":"price",
          "#stock":"stock"
        },
        "ExpressionAttributeValues": {
          ":productName": req.body.productName,
          ":price": parseInt(req.body.productPrice),
          ":stock": req.body.stock
        }
      }
      dynamoUpdateResult = await db.update(params);
      // Update Elastic
      elasticUpdateResult = await client.update({
        index: 'products',
        id: req.user.user.slice(-6) + req.headers.referer.slice(-6),
        body: {
          doc: {
            productName: req.body.productName,
            price: parseInt(req.body.productPrice),
            stock: req.body.stock
          }
        }
      })
      res.cookie('message', {type:'success', content:'Producto editado con éxito'});
      res.redirect(req.headers.referer)
    }
  }
})

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
    refresh: true,
    id: elasticID,
    body: elasticProduct
  })

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
  }
  res.redirect('/inventory');
});

router.post('/searchProduct',passport.authenticate('jwt', {session: false, failureRedirect: '/login'}),  async(req, res) => {
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
              term: {"available": true}
            },
            {
              match: {"owner": req.user.user.replace("COMPANY#","")}
            }
          ]
        }
      }
    }
  })
  //Get only those with score >= 1
  result.body.hits.hits = result.body.hits.hits.filter(item=>(item._score>=1))
  res.status(200).json(result.body.hits.hits)
});

router.get('/disable/:id', passport.authenticate('jwt', {session: false, failureRedirect: '/login'}),  async(req, res) => {
  // Disable the product on DynamoDB
  var params = {
    "TableName": process.env.AWS_DYNAMODB_TABLE,
    "Key": {
      "PK": req.user.user,
      "SK": 'PRODUCT#'+req.params.id
    },
    "UpdateExpression": "set #available = :available",
    "ExpressionAttributeNames": {
      "#available":"available"
    },
    "ExpressionAttributeValues": {
      ":available": false
    }
  }
  updateProductResult = await db.update(params);

  // Disable the product (and potentially subproducts) in Elasticsearch

  await client.updateByQuery({
    index: 'products',
    refresh: true,
    body: {
      script: {
        lang: 'painless',
        source: 'ctx._source["available"] = false'
      },
      query: {
        match: {
          parent: req.user.user.slice(-6) + req.params.id
        }
      }
    }
  })
  await client.update({
    index: 'products',
    id: req.user.user.slice(-6) + req.params.id,
    body: {
      doc: {
        available: false
      }
    }
  })
  res.redirect(req.headers.referer)
})

router.get('/enable/:id', passport.authenticate('jwt', {session: false, failureRedirect: '/login'}),  async(req, res) => {
  // Enable the product on DynamoDB
  var params = {
    "TableName": process.env.AWS_DYNAMODB_TABLE,
    "Key": {
      "PK": req.user.user,
      "SK": 'PRODUCT#'+req.params.id
    },
    "UpdateExpression": "set #available = :available",
    "ExpressionAttributeNames": {
      "#available":"available"
    },
    "ExpressionAttributeValues": {
      ":available": true
    }
  }
  updateProductResult = await db.update(params);

  // Enable the product (and potentially subproducts) in Elasticsearch

  await client.updateByQuery({
    index: 'products',
    refresh: true,
    body: {
      script: {
        lang: 'painless',
        source: 'ctx._source["available"] = true'
      },
      query: {
        match: {
          parent: req.user.user.slice(-6) + req.params.id
        }
      }
    }
  })
  await client.update({
    index: 'products',
    id: req.user.user.slice(-6) + req.params.id,
    body: {
      doc: {
        available: true
      }
    }
  })
  res.redirect(req.headers.referer)
})

module.exports = router;
