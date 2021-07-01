const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const bcrypt = require('bcrypt');
const saltRounds = 10;

const passportJWT = require("passport-jwt");
const JWTStrategy   = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;
var https = require('https');

var jwkToPem = require('jwk-to-pem');

const AmazonCognitoIdentity = require('amazon-cognito-identity-js');

//AWS Settings
var aws = require("aws-sdk");
var db = require("./db");
aws.config.update({
  region: process.env.DBREGION,
  endpoint: process.env.ENDPOINT,
  accessKeyId: process.env.AKID,
  secretAccessKey: process.env.SECRET
});

passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
},
async function(email, password, cb) {
  // 1) Parse login data
  email = email.toLowerCase();
  var userID;
  var profileID;

  // 2) Initialize the userPool interface
  var poolData = {
    UserPoolId: process.env.AWS_COGNITO_USERPOOLID,
    ClientId: process.env.AWS_COGNITO_CLIENTID
  };
  var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);


  // 3) Initialize UserData
  var userData = {
  	Username: email,
  	Pool: userPool,
  };
  var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

  // 4) Initialize authenticationData
  var authenticationData = {
  	Username: email,
  	Password: password,
  };
  var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);

  // 5) Do fist authentication
  var idToken = "";
  var refreshToken = "";
  var tokens = {};
   cognitoUser.authenticateUser(authenticationDetails, {
  	onSuccess: async function(result) {
      idToken = result.getIdToken().getJwtToken();
      refreshToken = result.getRefreshToken().token;
      tokens = {
        idToken: idToken,
        refreshToken: refreshToken
      };
      // 6) If first auth is correct, check if user has custom:plan_id
      var plan = undefined;
      await cognitoUser.getUserAttributes(async function(err,res){
        plan = res.find(x => x.Name === 'custom:plan_id');
        // 7a) If plan does not exist, create it as 0
        if (plan === undefined) {
          var plan_id = {
            Name: 'custom:plan_id',
            Value: '0',
          };
          plan_id = new AmazonCognitoIdentity.CognitoUserAttribute(plan_id);
          var attributeList = [];
          attributeList.push(plan_id);
          // It's an old user but it checks out. Set the plan to 0 by default.
          cognitoUser.updateAttributes(attributeList, function(err,res){
            if (err) {
              console.log("ERROR UPDATING ATTRIBUTES");
              console.log(err);
            }
            else {
              // Reauthenticating the user twice is a bad idea. Too bad!
              cognitoUser.authenticateUser(authenticationDetails, {
                onSuccess: function(result){
                  idToken = result.getIdToken().getJwtToken();
                  refreshToken = result.getRefreshToken().token;
                  tokens = {
                    idToken: idToken,
                    refreshToken: refreshToken
                  };
                  return cb(null, tokens, {message: 'Logged In Successfully'});
                }, onFailure: function(err){
                  return cb(err, null, {message: 'Error'});
                }
              });
            }
          });
        } else {
          // 7b) If plan exists, check if it's different from the billing plan and change it.
          let params = {
            "TableName": process.env.API_BILLING_TABLE, // CHANGE WHEN GOING TO PRODUCTION!!!!!!!!!!!!!!!!!!!!
            Key: {
              PK: result.idToken.payload.user,
              SK: result.idToken.payload.user.replace("COMPANY", "BILLING")
            },
          };
          getBilling = await db.get(params);

          // If billing data does not exist, the user has never entered to billing or profile
          // Most likely it's a new user.
          if (!getBilling.Item) {
            return cb(null, tokens, {message: 'Logged In Successfully'});
          }
          if (parseInt(plan.Value) != parseInt(getBilling.Item.planId.charAt(0))) {
            let plan_id = {
              Name: 'custom:plan_id',
              Value: getBilling.Item.planId.charAt(0),
            };
            plan_id = new AmazonCognitoIdentity.CognitoUserAttribute(plan_id);
            let attributeList = [];
            attributeList.push(plan_id);
            // It's an old user but it checks out. Set the plan to 0 by default.
            cognitoUser.updateAttributes(attributeList, function(err,res){
              if (err) {
                console.log(err);
              }
              else {
                // Reauth
                cognitoUser.authenticateUser(authenticationDetails, {
                  onSuccess: function(result){
                    idToken = result.getIdToken().getJwtToken();
                    refreshToken = result.getRefreshToken().token;
                    tokens = {
                      idToken: idToken,
                      refreshToken: refreshToken
                    };
                    return cb(null, tokens, {message: 'Logged In Successfully'});
                  }, onFailure: function(err){
                    return cb(err, null, {message: 'Error'});
                  }
                });
              }
            });
          } else {
            return cb(null, tokens, {message: 'Logged In Successfully'});
          }
        }
      });
  	},
    onFailure: function(err) {
        console.log("ERROR LOGGING IN " + email);
        return cb(err, null, {message: 'Error'});
    }
  });
}));

var cookieExtractor = (req) => {
  var token = null;
  if (req && req.cookies){
    token = req.cookies['token'];
  }
  return token;
};

let key = (req, done)=>{
  var pem = '';
  url = 'https://cognito-idp.us-east-1.amazonaws.com/'+process.env.AWS_COGNITO_USERPOOLID+'/.well-known/jwks.json';
  https.get(url, function(res){
    var body = '';
    res.on('data', function(chunk){
      body += chunk;
    });
    res.on('end', function(){
      parsedBody = JSON.parse(body);
      pem = jwkToPem(parsedBody.keys[0]);
      done(null, pem);
    });
  });
};
passport.use(new JWTStrategy({
        jwtFromRequest: ExtractJWT.fromExtractors([cookieExtractor]),
        secretOrKey   : key,
        ignoreExpiration: false
    },
    (jwtPayload, cb) => {
      return cb(null, jwtPayload, {message: 'Logged In Successfully'});
    }
));
