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
  console.log("=====RAW USER DATA=====");
  console.log(email);
  console.log(password);

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
    var idToken = result.getIdToken().getJwtToken();
		return cb(null, idToken, {message: 'Logged In Successfully'});
	},

  	onFailure: function(err) {
      return cb(err.code, null, {message: 'Error'});
  	},
  });


  // LEGACY LOGIN USING DYNAMODB
  /*
  var hashedPassword;

  var params = {
    "TableName": process.env.AWS_DYNAMODB_TABLE,
    "KeyConditionExpression": "#cd420 = :cd420 And #cd421 = :cd421",
    "ExpressionAttributeNames": {"#cd420":"PK","#cd421":"SK"},
    "ExpressionAttributeValues": {":cd420": {"S":"EMAIL"},":cd421": {"S":"EMAIL#" + email}}
  };

  userQuery = await db.query(params);

  if (userQuery.Count == 0) {
    return cb(null, false, {message: 'Incorrect email or password.'});
  }

  userID = userQuery.Items[0].userID.S;
  if (userID.includes("ADMIN")){
    profileID = userID.replace("ADMIN", "PROFILE");
  }
  else if (userID.includes("CLIENT")) {
    profileID = userID.replace("CLIENT", "PROFILE");
  }
  else {
    profileID = userID.replace("COMPANY", "PROFILE");
  }

  params = {
    "TableName": process.env.AWS_DYNAMODB_TABLE,
    "KeyConditionExpression": "#cd420 = :cd420 And #cd421 = :cd421",
    "ExpressionAttributeNames": {"#cd420":"PK","#cd421":"SK"},
    "ExpressionAttributeValues": {":cd420": {"S": userID},":cd421": {"S": profileID}}
  }

  profileQuery = await db.query(params);

  hashedPassword = profileQuery.Items[0].password.S;
  bcrypt.compare(password, hashedPassword, (err, result) =>{
    if (err) {
      return cb(null, false, {message: 'An error occured processing the request.'});
    }
    if (result) {
      return cb(null, userID, {message: 'Logged In Successfully'});
    }
    else {
      return cb(null, false, {message: 'Incorrect email or password.'});
    }
  });
  */
}));

var cookieExtractor = (req) => {
  var token = null;
  if (req && req.cookies){
    token = req.cookies['token'];
    console.log("TOKEN COOKIE EXTRACTED");
  }
  return token;
};

let key = (req, done)=>{
  var pem = ''
  console.log("GETTING JWK");
  url = 'https://cognito-idp.us-east-1.amazonaws.com/'+process.env.AWS_COGNITO_USERPOOLID+'/.well-known/jwks.json'
  https.get(url, function(res){
    var body = ''
    res.on('data', function(chunk){
      body += chunk
    });
    res.on('end', function(){
      console.log("GOT JWK");
      parsedBody = JSON.parse(body)
      pem = jwkToPem(parsedBody.keys[0])
      console.log(pem);
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
      console.log(jwtPayload);
      return cb(null, jwtPayload, {message: 'Logged In Successfully'});
    }
));
