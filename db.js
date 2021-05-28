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
      if(process.env.NODE_ENV == 'develop'){
        console.info('Queryv1 successful.');
      }
      return queryOutput;
    } catch (err) {
      if(process.env.NODE_ENV == 'develop'){
        console.log(err);
      }

      return err;
    }
  },

  scan: async function(params) {
    console.log("RUNNING SCAN");
    try {
      var dynamoDbClient = new aws.DynamoDB();
      const scanOutput = await dynamoDbClient.scan(params).promise();
      if(process.env.NODE_ENV == 'develop'){
        console.info('Scan successful.');
      }
      return scanOutput;
    } catch (err) {
      if(process.env.NODE_ENV == 'develop'){
        console.log(err);
      }

      return err;
    }
  },

  update: async function(params){
    try {
      var docClient = new aws.DynamoDB.DocumentClient();
      const updateOutput = await docClient.update(params).promise();
      if(process.env.NODE_ENV == 'develop'){
        console.info('Update successful.');
      }
      return updateOutput;
    } catch (err) {
      if(process.env.NODE_ENV == 'develop'){
        console.log(err);
      }

      return err;
    }
  },

  put: async function(params){
    console.log("RUNNING PUT");
    try {
      var docClient = new aws.DynamoDB.DocumentClient();
      const putOutput = await docClient.put(params).promise();
      if(process.env.NODE_ENV == 'develop'){
        console.info('Put successful.');
      }
      return putOutput;
    } catch (err) {
      if(process.env.NODE_ENV == 'develop'){
        console.log(err);
      }

      return err;
    }
  },

  queryv2: async function (params) {
    try {
      var docClient = new aws.DynamoDB.DocumentClient();
      const queryOutput = await docClient.query(params).promise();
      if(process.env.NODE_ENV == 'develop'){
        console.info('Queryv2 successful.');
      }
      return queryOutput;
    } catch (err) {
      if(process.env.NODE_ENV == 'develop'){
        console.log(err);
      }
      return err;
    }
  },

  get: async function (params) {
    try {
      var docClient = new aws.DynamoDB.DocumentClient();
      const getOutput = await docClient.get(params).promise();
      if(process.env.NODE_ENV == 'develop'){
        console.info('Get successful.');
      }
      return getOutput;
    } catch (err) {
      if(process.env.NODE_ENV == 'develop'){
        console.log(err);
      }
      return err;
    }
  },

  delete: async function (params) {
    try {
      var docClient = new aws.DynamoDB.DocumentClient();
      const deleteOutput = await docClient.delete(params).promise();
      if(process.env.NODE_ENV == 'develop'){
        console.info('Delete successful.');
      }
      return deleteOutput;
    } catch (err) {
      if(process.env.NODE_ENV == 'develop'){
        console.log(err);
      }
    }
  }
}
