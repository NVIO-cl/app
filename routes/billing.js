const express = require('express');
const router = express.Router();
const passport = require('passport');
const validator = require('validator');
const { nanoid } = require("nanoid");
const axios = require('axios');
var db = require("../db");
var aws = require("aws-sdk");
aws.config.update({
  region: process.env.DBREGION,
  endpoint: process.env.ENDPOINT,
  accessKeyId: process.env.AKID,
  secretAccessKey: process.env.SECRET
});

router.get('/', passport.authenticate('jwt', {session: false, failureRedirect: '/login'}),  async(req, res) => {
  var msg = {}
  if (req.cookies.message) {
    msg = req.cookies.message;
    res.clearCookie('message');
    console.log("MESSAGE!");

  }
  const name = "Billing";
  res.render('billing/billing', {title: name, userID: req.user.user.replace("COMPANY#", ""), planID: req.user['custom:plan_id'], message: msg});
});

router.get('/plans', passport.authenticate('jwt', {session: false, failureRedirect: '/login'}),  async(req, res) => {
  const name = "Plans";
  res.render('billing/plans', {title: name, userID: req.user.user.replace("COMPANY#", ""), planID: req.user['custom:plan_id']});
});

router.get('/plans/:id', passport.authenticate('jwt', {session: false, failureRedirect: '/login'}),  async(req, res) => {
  var name = "Selección de plan";
  res.render('billing/payment', {title: name, userID: req.user.user.replace("COMPANY#", ""), planID: req.user['custom:plan_id'], selectedPlanId: parseInt(req.params.id)});
});

router.post('/setPlan/', passport.authenticate('jwt', {session: false, failureRedirect: '/login'}), async(req, res) => {
  // Set the new plan
  let config = {
    headers: {Authorization: 'Bearer ' + req.cookies.token}
  };
  let axiosParams = {
    planId: req.body.planId,
    couponCode: req.body.couponCode
  };
  // Set the plan in the billing table
  var axiosRes = await axios.post('https://api-prod.aliachile.com/subscription', axiosParams, config);
  if (!axiosRes.data.error) {
    // If successful, set the new claim
    // Shitty amazon-cognito-identity-js library doesn't have this functionality
    // https://github.com/aws-amplify/amplify-js/issues/6704
    // Some poor soul like us asked for it on sept. 2020 but the issue has been ignored since.
    // so we have to use the even shittier aws-sdk. yay.
    var cognitoidentityserviceprovider = new aws.CognitoIdentityServiceProvider();
    let params = {
      UserAttributes: [
        {
          Name: "custom:plan_id",
          Value: req.body.planId.charAt(0)
        }
      ],
      UserPoolId: process.env.AWS_COGNITO_USERPOOLID,
      Username: req.user.email
    };
    update = cognitoidentityserviceprovider.adminUpdateUserAttributes(params, function(err, data) {
      if (err) {
        console.log(err.code);
        return res.json(err.code);
      }
      else {
        // If refresh token exists, refresh the token. If not, log out.
        if (req.cookies.refresh) {
          let params = {
            AuthFlow: "REFRESH_TOKEN_AUTH",
            ClientId: process.env.AWS_COGNITO_CLIENTID,
            AuthParameters: {
              REFRESH_TOKEN: req.cookies.refresh
            }
          };
          // Do token refresh
          cognitoidentityserviceprovider.initiateAuth(params, function(err,data){
            if (err) {
              console.log(err);
              res.clearCookie('token');
              return res.json(err);
            }
            else {
              res.cookie('token', data.AuthenticationResult.IdToken);
              res.cookie('message', {type:'success', content:'¡Plan activado con éxito!'});
              return res.json("ok");
            }
          });
        }
        else {
        // If not, delete cookie and log out.
          res.clearCookie('token');
          res.cookie('message', {type:'success', content:'Plan cambiado con éxito. Por favor vuelve a inicar sesión.'});
          return res.json("ok");
        }
      }
    });
  } else {
    res.cookie('message', {type:'warning', content:'Ocurrió un error al activar tu plan. Por favor escríbenos a soporte@aliachile.com'});
    return res.json("ok");
  }
});

router.post('/changePlan/', passport.authenticate('jwt', {session: false, failureRedirect: '/login'}), async(req, res) => {
  // Set the new plan
  let config = {
    headers: {Authorization: 'Bearer ' + req.cookies.token}
  };
  let axiosParams = {
    planId: req.body.planId,
  };
  // Set the plan in the billing table
  var axiosRes = await axios.post('https://api-prod.aliachile.com/subscription/change', axiosParams, config);
  if (!axiosRes.data.error) {
    if (parseInt(req.user['custom:plan_id']) < parseInt(req.body.planId.charAt(0))) {
      // If successful, set the new claim
      // Shitty amazon-cognito-identity-js library doesn't have this functionality
      // https://github.com/aws-amplify/amplify-js/issues/6704
      // Some poor soul like us asked for it on sept. 2020 but the issue has been ignored since.
      // so we have to use the even shittier aws-sdk. yay.
      var cognitoidentityserviceprovider = new aws.CognitoIdentityServiceProvider();
      let params = {
        UserAttributes: [
          {
            Name: "custom:plan_id",
            Value: req.body.planId.charAt(0)
          }
        ],
        UserPoolId: process.env.AWS_COGNITO_USERPOOLID,
        Username: req.user.email
      };
      update = cognitoidentityserviceprovider.adminUpdateUserAttributes(params, function(err, data) {
        if (err) {
          console.log(err.code);
          return res.json(err.code);
        }
        else {
          // If refresh token exists, refresh the token. If not, log out.
          if (req.cookies.refresh) {
            let params = {
              AuthFlow: "REFRESH_TOKEN_AUTH",
              ClientId: process.env.AWS_COGNITO_CLIENTID,
              AuthParameters: {
                REFRESH_TOKEN: req.cookies.refresh
              }
            };
            // Do token refresh
            cognitoidentityserviceprovider.initiateAuth(params, function(err,data){
              if (err) {
                console.log(err);
                res.clearCookie('token');
                return res.json(err);
              }
              else {
                res.cookie('token', data.AuthenticationResult.IdToken);
                res.cookie('message', {type:'success', content:'¡Plan cambiado con éxito!'});
                return res.json("ok");
              }
            });
          }
          else {
          // If not, delete cookie and log out.
            res.clearCookie('token');
            res.cookie('message', {type:'success', content:'Plan cambiado con éxito. Por favor vuelve a inicar sesión.'});
            return res.json("ok");
          }
        }
      });
    } else {
      res.cookie('message', {type:'success', content:'El cambio de plan hará efecto al final de este período'});
      return res.json("ok");
    }
  } else {
    if (axiosRes.data.message == "Plan cancellation requested. Can't change plan at end.") {
      res.cookie('message', {type:'warning', content:'No puedes cambiar tu plan si solicitaste una cancelación.'});
    }
    else {
      res.cookie('message', {type:'warning', content:'Ocurrió un error al activar tu plan. Por favor escríbenos a soporte@aliachile.com'});
    }
    return res.json("ok");
  }
});

module.exports = router;
