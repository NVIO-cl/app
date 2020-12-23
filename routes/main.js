const express = require('express');
const router = express.Router();
const passport = require('passport');
const validator = require('validator');
const {Client, Status} = require("@googlemaps/google-maps-services-js");
var multer  = require('multer');
var upload = multer();
const { nanoid } = require("nanoid");

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

//AWS Settings
var aws = require("aws-sdk");
var db = require("../db");
aws.config.update({
  region: process.env.DBREGION,
  endpoint: process.env.ENDPOINT,
  accessKeyId: process.env.AKID,
  secretAccessKey: process.env.SECRET
});
var s3Endpoint = new aws.Endpoint(process.env.AWS_S3_ENDPOINT);

const xl = require('excel4node');
var date_parser = require("../date_parser");

/* GET home page. */
router.get('/',passport.authenticate('jwt', {session: false, failureRedirect: '/login'}),  async(req, res) => {
  res.render('index', { title: 'NVIO', userID: req.user.user.replace("COMPANY#", "") });
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

  res.render('detail', {title: name, order: detailQuery.Items, parsed_comments_date: comentarios, logo: logo, parsed_created_at: parsed_created_at, companyId: req.user.user.replace("COMPANY#",""), userID: req.user.user.replace("COMPANY#", "")});
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
  res.render('historial', {title: name, orders: historialQuery.Items, companyId: req.user.user.replace("COMPANY#",""), userID: req.user.user.replace("COMPANY#", "")});
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
