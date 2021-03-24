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

router.get('/',passport.authenticate('jwt', {session: false, failureRedirect: '/login'}),  async(req, res) => {
  const name = "Inventario";
  const result = await client.search({
    index: 'products',
    body: {
      query: {
        match: { owner: req.body.owner = req.user.user.replace("COMPANY#", "") }
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
  //Add owner data
  req.body.owner = req.user.user.replace("COMPANY#", "")

  //Trim the data
  req.body.productName = req.body.productName.trim();

  //Convert main price string to int
  req.body.productPrice = parseInt(req.body.productPrice);

  if (req.body.checkStock == "on") {
    //If stock control is activated, parse stock into an int
    req.body.checkStock = true
    req.body.productStock = parseInt(req.body.productStock)
  }
  else {
    //Delete the stock variable
    req.body.checkStock = false
    delete req.body.productStock
  }

  if (req.body.checkAttributes == "on") {
    req.body.checkAttributes = true
  }

  if (req.body.subproduct && req.body.checkAttributes) {
    console.log("SUBPRODUCTS PRESENT!");
    if (req.body.checkStock) {
      //If stock is checked, sum the subproducts stock into the master product stock
      console.log("Check stock!");
      var totalStock = 0
      req.body.subproduct.forEach((item, i) => {
        item.stock = parseInt(item.stock)
        totalStock = totalStock + item.stock
      });
      req.body.productStock = totalStock;
    }
    else {
      //Delete the stock value from master prodcut and subproducts
      req.body.checkStock = false
      req.body.subproduct.forEach((item, i) => {
        delete item.stock
      });
    }
    //Parse price into an int
    req.body.subproduct.forEach((item, i) => {
      item.price = parseInt(item.price)
    });
    //Save the master product first to get the ID
    var masterProduct = {
      productName: req.body.productName,
      productPrice: req.body.productPrice,
      productStock: req.body.productStock,
      checkStock: req.body.checkStock,
      checkAttributes: req.body.checkAttributes,
      owner: req.body.owner
    }
    result = await client.index({
      index: 'products',
      body: masterProduct
    })
    var masterID = result.body._id;
    console.log("SAVED IN ELASTICSEARCH WITH ID " + result.body._id);
    //Then save each subproduct with the master ID as reference
    var dataset = []
    for (item of req.body.subproduct){
      var subprod = {
        productName: item.fullName,
        productPrice: item.price,
        masterID: masterID,
        owner: req.body.owner
      }
      if (req.body.checkStock) {
        subprod.productStock = item.stock;
      }
      dataset.push(subprod)
    };

    console.log(dataset);
    var body = dataset.flatMap(doc => [{ index: { _index: 'subproducts' } }, doc])
    const { body: bulkResponse } = await client.bulk({ refresh: true, body })
    console.log(bulkResponse);


  }
  else {
    console.log("SUBPRODUCTS NOT PRESENT");
    //Delete unused attribute section
    delete req.body.attributes
    req.body.checkAttributes = false
    console.log(req.body);

    //Save the product as a main product
    result = await client.index({
      index: 'products',
      body: req.body
    })
    console.log(result);
    console.log("SAVED IN ELASTICSEARCH");
  }



  res.json(req.body);
});

router.get('/searchProduct/:productName',passport.authenticate('jwt', {session: false, failureRedirect: '/login'}),  async(req, res) => {
  const result = await client.search({
    index: 'products',
    body: {
      query: {
        match: { owner: req.body.owner = req.user.user.replace("COMPANY#", "") }
      }
    }
  })
  console.log(result.body.hits.hits);

  res.status(200).json(result.body.hits.hits)
});

module.exports = router;
