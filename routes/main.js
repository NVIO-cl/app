const express = require('express');
const passport = require('passport');
const router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'NVIO' });
});

//Login route
router.get('/login', (req, res) => {
  const name = "Login";
  var errormsg;
  console.log("Login requested");
  var date = new Date();
  var year = date.getFullYear();
  console.log(req.cookies);
  if (req.cookies.error == true) {
    errormsg = "Correo o contraseña incorrectos";
  }
  res.clearCookie('error');
  res.render('login', {title: name, error: errormsg});
});


module.exports = router;
