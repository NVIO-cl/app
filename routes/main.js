const express = require('express');
const passport = require('passport');
const router = express.Router();

/* GET home page. */
router.get('/',passport.authenticate('jwt', {session: false, failureRedirect: '/login'}),  async(req, res) => {
  res.render('index', { title: 'NVIO' });
});

//Login route
router.get('/login', (req, res) => {
  const name = "Login";
  var errormsg;
  var date = new Date();
  var year = date.getFullYear();
  if (req.cookies.error == true) {
    errormsg = "Correo o contraseña incorrectos";
  }
  res.clearCookie('error');
  res.render('login', {title: name, error: errormsg});
});


module.exports = router;
