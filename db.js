//DB functions

var aws = require("aws-sdk");
aws.config.update({
  region: process.env.DBREGION,
  endpoint: process.env.ENDPOINT
});

module.exports = {
  query: async function (params) {
    try {
      var dynamoDbClient = new aws.DynamoDB();
      const queryOutput = await dynamoDbClient.query(params).promise();
      return queryOutput;
    } catch (err) {
      console.log(err);
      return err;
    }
  },

  scan: async function(params) {
    console.log("RUNNING SCAN");
    try {
      var dynamoDbClient = new aws.DynamoDB();
      const scanOutput = await dynamoDbClient.scan(params).promise();
      console.info('Scan successful.');
      return scanOutput;
    } catch (err) {
      console.log(err);
      return err;
    }
  },

  update: async function(params){
    console.log("RUNNING UPDATE");
    try {
      var dynamoDbClient = new aws.DynamoDB();
      const updateOutput = await docClient.update(params).promise();
      console.info('Update successful.');
      return updateOutput;
    } catch (err) {
      console.log(err);
      return err;
    }
  },

  put: async function(params){
    console.log("RUNNING PUT");
    try {
      var docClient = new aws.DynamoDB.DocumentClient();
      const putOutput = await docClient.put(params).promise();
      console.info('Put successful.');
      return putOutput;
    } catch (err) {
      console.log(err);
      return err;
    }
  }
}
