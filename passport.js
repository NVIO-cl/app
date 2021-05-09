const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const bcrypt = require('bcrypt');
const saltRounds = 10;

const passportJWT = require("passport-jwt");
const JWTStrategy   = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;
var https = require('https');

var jwkToPem = require('jwk-to-pem')

const AmazonCognitoIdentity = require('amazon-cognito-identity-js')

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
function(email, password, cb) {
  // 1) Parse login data
  email = email.toLowerCase();
  var userID;
  var profileID;

  // 2) Initialize the userPool interface
  var poolData = {
    UserPoolId: process.env.AWS_COGNITO_USERPOOLID,
    ClientId: process.env.AWS_COGNITO_CLIENTID
  }
  var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData)


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

  // 5) Do authentication
  cognitoUser.authenticateUser(authenticationDetails, {
	onSuccess: function(result) {
    // If user doesn't have a plan variable (it's an old one), create it.
    cognitoUser.getUserAttributes(function(err,res){
      var plan = res.find(x => x.Name === 'custom:plan_id');
      if (plan === undefined) {
        var plan_id = {
        	Name: 'custom:plan_id',
        	Value: '0',
        };
        var plan_id = new AmazonCognitoIdentity.CognitoUserAttribute(plan_id);
        var attributeList = []
        attributeList.push(plan_id)
        // It's an old user but it checks out. Set the plan to 0 by default.
        cognitoUser.updateAttributes(attributeList, function(err,res){
          if (err) {
            console.log(err);
          }
          else {
            console.log("Old user set to plan 0");
          }
        })
      }
    });



    var idToken = result.getIdToken().getJwtToken();
		return cb(null, idToken, {message: 'Logged In Successfully'});
	},

  	onFailure: function(err) {
      return cb(err.code, null, {message: 'Error'});
  	},
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
  var pem = ''
  url = 'https://cognito-idp.us-east-1.amazonaws.com/'+process.env.AWS_COGNITO_USERPOOLID+'/.well-known/jwks.json'
  https.get(url, function(res){
    var body = ''
    res.on('data', function(chunk){
      body += chunk
    });
    res.on('end', function(){
      parsedBody = JSON.parse(body)
      pem = jwkToPem(parsedBody.keys[0])
      done(null, pem)
    })
  })
}
passport.use(new JWTStrategy({
        jwtFromRequest: ExtractJWT.fromExtractors([cookieExtractor]),
        secretOrKey   : key,
        ignoreExpiration: false
    },
    (jwtPayload, cb) => {
      return cb(null, jwtPayload, {message: 'Logged In Successfully'});
    }
));
