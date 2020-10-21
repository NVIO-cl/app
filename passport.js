const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const saltRounds = 10;

const passportJWT = require("passport-jwt");
const JWTStrategy   = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;

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
async (email, password, cb) => {
  email = email.toLowerCase();
  var userID;
  var profileID;
  var hashedPassword;

  var params = {
    "TableName": "app",
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
    "TableName": "app",
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
}));

var cookieExtractor = (req) => {
  var token = null;
  if (req && req.cookies){
    token = req.cookies['token'];
  }
  return token;
};

passport.use(new JWTStrategy({
        jwtFromRequest: ExtractJWT.fromExtractors([cookieExtractor]),
        secretOrKey   : process.env.JWT_SECRET,
        ignoreExpiration: false
    },
    (jwtPayload, cb) => {
      return cb(null, jwtPayload, {message: 'Logged In Successfully'});
    }
));
