const express = require('express');
const router = express.Router();
const passport = require('passport');
const validator = require('validator');
// const {Client, Status} = require("@googlemaps/google-maps-services-js");
var multer  = require('multer');
var upload = multer();
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

const xl = require('excel4node');
var date_parser = require("../date_parser");

/* GET home page. */
router.get('/',passport.authenticate('jwt', {session: false, failureRedirect: '/login'}),  async(req, res) => {
  if(req.user['custom:plan_id'] >= 2){ // If the user has dashboard functionality
    res.render('index', { title: 'NVIO', userID: req.user.user.replace("COMPANY#", ""), userPlanID: req.user['custom:plan_id']});
  } else { // If the user doesn't have dashboard access
    res.render('index-no-dashboard', { title: 'NVIO', userID: req.user.user.replace("COMPANY#", ""), userPlanID: req.user['custom:plan_id']});
  }
  const title = 'Dashboard'

  // Monthly info
  // Gets current date and exact same date but one year ago
  var today = new Date()
  var firstDay = new Date(today.getFullYear() - 1, today.getMonth(), 1);
  var lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 1, 0, 0, 0, -1);

  var search = {
    index: 'orders',
    body: {
      query: {
        bool: {
          must: [
            {
              match: {"owner": req.user.user.replace("COMPANY#", "")}
            },
            {
              range: {
                createdAt: {
                  gte: firstDay.getTime(),
                  lt: lastDay.getTime()
                }
              }
            }
          ]
        }
      },
      aggs: {
        amount_per_month: {
          date_histogram: {
            field: "createdAt",
            interval: "month"
          },
          aggs: {
            cost_order: {
              sum: {
                field: "cost.order"
              }
            },
            cost_shipping: {
              sum: {
                field: "cost.shipping"
              }
            },
            comunas: {
              terms: { "field": "locality.keyword" }
            }
          }
        }
      }
    }
  }

  var result = await client.search(search)

  // Double for checks for every Product & Quantity pair
  var products_quantity = {}
  var products_quantity_list = []
  for (i in result.body.hits.hits){
    for (j in result.body.hits.hits[i]._source.items){
      var producto = result.body.hits.hits[i]._source.items[j].product
      var cantidad = result.body.hits.hits[i]._source.items[j].quantity

      // Checks if a product appears in separate orders and groups quantity by its name
      if (products_quantity_list.length == 0){
        products_quantity["key"] = producto
        products_quantity["value"] = cantidad
        products_quantity_list.push(products_quantity)
        products_quantity = {}

      } else {
        for (k in products_quantity_list){
          if (producto === products_quantity_list[k].key) {
            products_quantity_list[k].value += cantidad
            break
          }
          if (k == products_quantity_list.length - 1){
            products_quantity["key"] = producto
            products_quantity["value"] = cantidad
            products_quantity_list.push(products_quantity)
            products_quantity = {}
          }
        }
      }
    }
  }

  products_quantity_list.sort((a, b) => (a.value < b.value) ? 1 : -1)

  var monthlyInfo_list = []
  var monthlyInfo = {}

  if(result.body.aggregations.amount_per_month.buckets.length == 0){
    var key = new Date(Date.now())
    var month = key.getUTCMonth() + 1
    var year = key.getFullYear()
    var fecha = month + '/' + year

    monthlyInfo["month_year"] = fecha
    monthlyInfo["monthKey"] = 0
    monthlyInfo["ordersAmount"] = 0
    monthlyInfo["productQuantity"] = products_quantity_list
    monthlyInfo["localities"] = 0
    monthlyInfo["costShippings"] = 0
    monthlyInfo["costOrders"] = 0

    monthlyInfo_list.push(monthlyInfo)
    monthlyInfo = {}
  } else {

    // Construct monthly info for frontend
    for (var i in result.body.aggregations.amount_per_month.buckets){

      var key = new Date(result.body.aggregations.amount_per_month.buckets[i].key)
      var month = key.getUTCMonth() + 1
      var year = key.getFullYear()
      var fecha = month + '/' + year

      monthlyInfo["month_year"] = fecha
      monthlyInfo["monthKey"] = result.body.aggregations.amount_per_month.buckets[i].key
      monthlyInfo["ordersAmount"] = result.body.aggregations.amount_per_month.buckets[i].doc_count
      monthlyInfo["productQuantity"] = products_quantity_list
      monthlyInfo["localities"] = result.body.aggregations.amount_per_month.buckets[i].comunas.buckets
      monthlyInfo["costShippings"] = result.body.aggregations.amount_per_month.buckets[i].cost_shipping
      monthlyInfo["costOrders"] = result.body.aggregations.amount_per_month.buckets[i].cost_order

      monthlyInfo_list.push(monthlyInfo)
      monthlyInfo = {}
    }
  }

  // Weekly info
  // Gets monday of the current week
  function getMonday(d) {
    d = new Date(d);
    var day = d.getDay(),
        diff = d.getDate() - day + (day == 0 ? -6:1); // adjust when day is sunday
    d.setHours(0);
    d.setMinutes(0);
    d.setSeconds(0);
    d.setMilliseconds(0);
    return new Date(d.setDate(diff));
  }

  // Gets sunday of the current week
  function getSunday(d) {
    d = new Date(d);
    var day = d.getDay(),
        diff = d.getDate() - day + 7; // adjust when day is sunday
    d.setHours(23);
    d.setMinutes(59);
    d.setSeconds(59);
    d.setMilliseconds(59);
    return new Date(d.setDate(diff));
  }

  var search_weekly = {
    index: 'orders',
    body: {
      query: {
        bool: {
          must: [
            {
              match: {"owner": req.user.user.replace("COMPANY#", "")}
            },
            {
              range: {
                createdAt: {
                  gte: getMonday(new Date()).getTime(),
                  lt: getSunday(new Date()).getTime()
                }
              }
            }
          ]
        }
      },
      aggs: {
        amount_per_week: {
          date_histogram: {
            field: "createdAt",
            interval: "week"
          },
          aggs: {
            cost_order: {
              sum: {
                field: "cost.order"
              }
            },
            cost_shipping: {
              sum: {
                field: "cost.shipping"
              }
            },
            comunas: {
              terms: { "field": "locality.keyword" }
            }
          }
        }
      }
    }
  }

  var result_weekly = await client.search(search_weekly)

  // Construct weekly info for frontend
  var weeklyInfo = {}

  if (result_weekly.body.aggregations.amount_per_week.buckets.length == 0){
    weeklyInfo["weekKey"] = 0
    weeklyInfo["ordersAmount"] = 0
    weeklyInfo["costShippings"] = 0
    weeklyInfo["costOrders"] = 0
  } else {
    weeklyInfo["weekKey"] = result_weekly.body.aggregations.amount_per_week.buckets[0].key
    weeklyInfo["ordersAmount"] = result_weekly.body.aggregations.amount_per_week.buckets[0].doc_count
    weeklyInfo["costShippings"] = result_weekly.body.aggregations.amount_per_week.buckets[0].cost_shipping
    weeklyInfo["costOrders"] = result_weekly.body.aggregations.amount_per_week.buckets[0].cost_order
  }

  res.render('index', { title: title, userID: req.user.user.replace("COMPANY#", ""), monthlyInfo_list: JSON.stringify(monthlyInfo_list), weeklyInfo: JSON.stringify(weeklyInfo) });
});

router.post('/detail/orderStatus',passport.authenticate('jwt', {session: false, failureRedirect: '/login'}),  async(req, res) => {
  params = {
    "TableName": process.env.AWS_DYNAMODB_TABLE,
    "Key": {
      "PK": req.user.user,
      "SK": "ORDER#" + req.body.orderid
    },
    "UpdateExpression": "set #status.#order = :orderStatus, #updatedAt = :updatedAt",
    "ExpressionAttributeNames": {
      "#status": "status",
      "#order": "order",
      "#updatedAt": "updatedAt"
    },
    "ExpressionAttributeValues": {
      ":orderStatus": parseInt(req.body.status),
      ":updatedAt": Date.now(),
    }
  }
  commentResult = await db.update(params);
  res.json("Ok")
});

router.post('/detail/validatePayment',passport.authenticate('jwt', {session: false, failureRedirect: '/login'}),  async(req, res) => {
  params = {
    "TableName": process.env.AWS_DYNAMODB_TABLE,
    "Key": {
      "PK": req.user.user,
      "SK": "ORDER#" + req.body.orderid
    },
    "UpdateExpression": "set #status.#payment = :paymentStatus, #updatedAt = :updatedAt",
    "ExpressionAttributeNames": {
      "#status": "status",
      "#payment": "payment",
      "#updatedAt": "updatedAt"
    },
    "ExpressionAttributeValues": {
      ":paymentStatus": 2,
      ":updatedAt": Date.now(),
    }
  }
  commentResult = await db.update(params);
  res.json("Ok")
});

router.post('/detail/comentar',passport.authenticate('jwt', {session: false, failureRedirect: '/login'}),  async(req, res) => {
  params = {
    "TableName": process.env.AWS_DYNAMODB_TABLE,
    "Key": {
      "PK": req.user.user,
      "SK": "ORDER#" + req.body.orderid
    },
    "UpdateExpression": "set #status.#comments = list_append(#status.#comments,:comment)",
    "ExpressionAttributeNames": {
      "#status": "status",
      "#comments": "comments"
    },
    "ExpressionAttributeValues": {
      ":comment": [{
        "comment": req.body.comentario,
        "timestamp": Date.now()
      }]
    }
  }
  commentResult = await db.update(params);
  res.json("Ok")
});

router.get('/detail/comprobante/:id',passport.authenticate('jwt', {session: false, failureRedirect: '/login'}),  async(req, res) => {
  var s3 = new aws.S3({params: {Bucket: process.env.AWS_S3_BUCKET}, endpoint: s3Endpoint});
  var logo = await s3.getSignedUrl('getObject', {Key: "comprobantes/" + req.user.user.replace("COMPANY#","") + "/" + req.params.id + ".png", Expires: 10});
  res.status(200).json(logo)
});

router.get('/detail/:id',passport.authenticate('jwt', {session: false, failureRedirect: '/login'}),  async(req, res) => {
  const name = "Detail" + req.params.id;
  var params={
    "TableName": process.env.AWS_DYNAMODB_TABLE,
    "ScanIndexForward": false,
    "ConsistentRead": false,
    "KeyConditionExpression": "#cd420 = :cd420 And begins_with(#cd421, :cd421)",
    "ExpressionAttributeValues": {
      ":cd420": {
        "S": req.user.user
      },
      ":cd421": {
        "S": "ORDER#" + req.params.id
      }
    },
    "ExpressionAttributeNames": {
      "#cd420": "PK",
      "#cd421": "SK"
    }
  };

  detailQuery = await db.query(params);

  var created_at = detailQuery.Items[0].createdAt.N;
  var parsed_created_at = date_parser.parse_date(created_at);
  if (detailQuery.Items[0].status.M.shippingDate) {
    if (detailQuery.Items[0].status.M.shippingDate.S != "") {
      var parsed_deliveryDate = detailQuery.Items[0].status.M.shippingDate.S.split("-");
      detailQuery.Items[0].status.M.shippingDate.S = parsed_deliveryDate[2] + "/" + parsed_deliveryDate[1] + "/" + parsed_deliveryDate[0];
    }
  }
  let comentarios = []
  for (var i = 0; i < detailQuery.Items[0].status.M.comments.L.length; i++){
      var db_date = detailQuery.Items[0].status.M.comments.L[i].M.timestamp.N
      var parsed_date = date_parser.parse_date(db_date);
      comentarios.push(parsed_date);
  }

  var s3 = new aws.S3({params: {Bucket: process.env.AWS_S3_BUCKET}, endpoint: s3Endpoint});
  var logo = await s3.getSignedUrl('getObject', {Key: "comprobantes/" + req.user.user.replace("COMPANY#","") + "/" + req.params.id + ".png", Expires: 10});

  res.render('detail', {title: name, order: detailQuery.Items, parsed_comments_date: comentarios, logo: logo, parsed_created_at: parsed_created_at, companyId: req.user.user.replace("COMPANY#",""), userID: req.user.user.replace("COMPANY#", ""), userPlanID: req.user['custom:plan_id']});
});

/* GET historial. */
router.get('/historial',passport.authenticate('jwt', {session: false, failureRedirect: '/login'}),  async(req, res) => {
  const name = "Historial";
  var params={
    "TableName": process.env.AWS_DYNAMODB_TABLE,
    "ScanIndexForward": false,
    "ConsistentRead": false,
    "KeyConditionExpression": "#cd420 = :cd420 And begins_with(#cd421, :cd421)",
    "ExpressionAttributeValues": {
      ":cd420": {
        "S": req.user.user
      },
      ":cd421": {
        "S": "ORDER"
      }
    },
    "ExpressionAttributeNames": {
      "#cd420": "PK",
      "#cd421": "SK"
    }
  };
  historialQuery = await db.query(params);
  res.render('historial', {title: name, ordersForCards: JSON.stringify(historialQuery.Items), orders: historialQuery.Items, companyId: req.user.user.replace("COMPANY#",""), userID: req.user.user.replace("COMPANY#", "")});
});

router.get('/excel',passport.authenticate('jwt', {session: false, failureRedirect: '/login'}),  async(req, res) => {

  const wb = new xl.Workbook();
  const ws = wb.addWorksheet('Pedidos');

  var params={
    "TableName": process.env.AWS_DYNAMODB_TABLE,
    "ScanIndexForward": false,
    "ConsistentRead": false,
    "KeyConditionExpression": "#cd420 = :cd420 And begins_with(#cd421, :cd421)",
    "ExpressionAttributeValues": {
      ":cd420": {
        "S": req.user.user
      },
      ":cd421": {
        "S": "ORDER"
      }
    },
    "ExpressionAttributeNames": {
      "#cd420": "PK",
      "#cd421": "SK"
    }
  };
  historialQuery = await db.query(params);

  var data = [];

  // Iterates over all orders
  for (var j = 0; j < historialQuery.Items.length; j++){

    // Iterates over "product"
    let productos = []
    for (var i = 0; i < historialQuery.Items[j].items.L.length; i++){
      if (i > 0){
        let item = " " + historialQuery.Items[j].items.L[i].M.product.S
        productos.push(item)
      } else{
        let item = historialQuery.Items[j].items.L[i].M.product.S
        productos.push(item)
      }
    }
    let string_productos = productos.toString()


    // Iterates over "quantity"
    let cantidad = []
    for (var i = 0; i < historialQuery.Items[j].items.L.length; i++){
      if (i > 0){
        let item = " " + historialQuery.Items[j].items.L[i].M.quantity.N
        cantidad.push(item)
      } else{
        let item = historialQuery.Items[j].items.L[i].M.quantity.N
        cantidad.push(item)
      }
    }
    let string_cantidad = cantidad.toString()


    // Iterates over "price"
    let precio = []
    for (var i = 0; i < historialQuery.Items[j].items.L.length; i++){
      if (i > 0){
        let item = " " + historialQuery.Items[j].items.L[i].M.price.N
        precio.push(item)
      } else{
        let item = historialQuery.Items[j].items.L[i].M.price.N
        precio.push(item)
      }
    }
    let string_precio = precio.toString()


    // Iterates over "comments"
    let comentarios = []
    for (var i = 0; i < historialQuery.Items[j].status.M.comments.L.length; i++){
      if (i > 0){
        var db_date = historialQuery.Items[j].status.M.comments.L[i].M.timestamp.N
        var parsed_date = date_parser.parse_date(db_date);
        let item = " " + parsed_date + " " + "-" + " " + historialQuery.Items[j].status.M.comments.L[i].M.comment.S
        comentarios.push(item)
      } else{
        var db_date = historialQuery.Items[j].status.M.comments.L[i].M.timestamp.N
        var parsed_date = date_parser.parse_date(db_date);
        let item = parsed_date + " " + "-" + " " + historialQuery.Items[j].status.M.comments.L[i].M.comment.S
        comentarios.push(item)
      }
    }
    let string_comentarios = comentarios.toString()

    var created_at = historialQuery.Items[j].createdAt.N
    var parsed_created_at = date_parser.parse_date(created_at);

    try{
      var nombre = historialQuery.Items[j].clientData.M.firstName.S
    } catch (err){
      var nombre = ""
    }

    try{
      var apellido = " " + historialQuery.Items[j].clientData.M.lastName.S
    } catch (err){
      var apellido = ""
    }

    try{
      var phone = historialQuery.Items[j].clientData.M.contactNumber.N
    } catch (err){
      var phone = ""
    }

    try{
      var email = historialQuery.Items[j].clientData.M.email.S
    } catch (err){
      var email = ""
    }

    try{
      var calle = historialQuery.Items[j].clientData.M.address.M.street.S

    } catch (err){
      var calle = ""

    }

    try{
      var num = " " + historialQuery.Items[j].clientData.M.address.M.number.N
    } catch (err){
      var num = ""
    }

    try{
      var apart = " " + historialQuery.Items[j].clientData.M.address.M.apart.S
    } catch (err){
      var apart = ""
    }

    try{
      var locality = " " + historialQuery.Items[j].clientData.M.address.M.locality.S
    } catch (err){
      var locality = ""
    }

    try{
      var comment = " " + historialQuery.Items[j].comment.S
    } catch (err){
      var comment = ""
    }

    try{
      var paid_at = historialQuery.Items[j].paidAt.N
      var parsed_paid_at = date_parser.parse_date(paid_at);
    } catch (err){
      var parsed_paid_at = ""
    }

    var order = {
      "Número Pedido": historialQuery.Items[j].SK.S.replace("ORDER#",""),
      "Fecha de creación": parsed_created_at,
      "Cliente": nombre + apellido,
      "Teléfono": phone,
      "Email": email,
      "Dirección": calle + num + apart + locality,
      "Comentario de despacho": comment,
      "Producto": string_productos,
      "Cantidad": string_cantidad,
      "Precio": string_precio,
      "Total de Orden": historialQuery.Items[j].cost.M.order.N,
      "Estado de Pago": historialQuery.Items[j].status.M.payment.N,
      "Fecha de Pago": parsed_paid_at,
      "Estado de Orden": historialQuery.Items[j].status.M.order.N,
      "Método de Despacho": historialQuery.Items[j].shippingMethod.S,
      "Costo de Despacho": historialQuery.Items[j].cost.M.shipping.N,
      "Comentarios Personales": string_comentarios
    }
    data.push(order)
  }

  const headingColumnNames = [
    "Número Pedido",
    "Fecha de creación",
    "Cliente",
    "Teléfono",
    "Email",
    "Dirección",
    "Comentario de despacho",
    "Producto",
    "Cantidad",
    "Precio",
    "Total de Orden",
    "Estado de Pago",
    "Fecha de Pago",
    "Estado de Orden",
    "Método de Despacho",
    "Costo de Despacho",
    "Comentarios Personales",
  ]

//Write Column Title in Excel file
  let headingColumnIndex = 1;
  headingColumnNames.forEach(heading => {
    ws.cell(1, headingColumnIndex++)
        .string(heading)
  });

//Write Data in Excel file
  let rowIndex = 2;
  data.forEach( record => {
    let columnIndex = 1;
    Object.keys(record ).forEach(columnName =>{
      ws.cell(rowIndex,columnIndex++)
          .string(record [columnName])
    });
    rowIndex++;
  });

  wb.write('Pedidos.xlsx', res);
});

module.exports = router;
