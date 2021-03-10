require('dotenv').config();
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
var logger = require('morgan');

var indexRouter = require('./routes/main');
var authRouter = require('./routes/auth');
var orderRouter = require('./routes/order');
var profileRouter = require('./routes/profile');
var inventoryRouter = require('./routes/inventory');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

//Prevents to check previous page after logout
app.use(function (req, res, next) {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');
  next()
});

if(process.env.NODE_ENV == 'develop'){
  app.use(logger('dev'));
}
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true, limit:'50mb', parameterLimit: 1000000 }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/', authRouter);
app.use('/order',orderRouter);
app.use('/profile',profileRouter);
app.use('/inventory',inventoryRouter);


//Use cookieParser
app.use(cookieParser());

//Require Passport
require('./passport');

//Use JSON parser
app.use(bodyParser.json({limit:'50mb'}));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  if(req.cookies["token"] === "" || req.cookies["token"] === undefined){
    res.status(404)
    res.render("404_guest")
  }else{
    res.status(404)
    res.render("404")
  }
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
