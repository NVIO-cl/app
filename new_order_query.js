// ------------ NodeJS runtime ---------------
// Add aws-sdk in package.json as a dependency
// Example:
// {
//     "dependencies": {
//         "aws-sdk": "^2.0.9",
//     }
// }
// Create your credentials file at ~/.aws/credentials (C:\Users\USER_NAME\.aws\credentials for Windows users)
// Format of the above file should be:
//  [default]
//  aws_access_key_id = YOUR_ACCESS_KEY_ID
//  aws_secret_access_key = YOUR_SECRET_ACCESS_KEY

const AWS = require('aws-sdk');

// Create the DynamoDB Client with the region you want
const region = 'us-east-1';
const dynamoDbClient = createDynamoDbClient(region);

// Create the input for putItem call
const putItemInput = createPutItemInput();

// Call DynamoDB's putItem API
executePutItem(dynamoDbClient, putItemInput).then(() => {
        console.info('PutItem API call has been executed.')
    }
);

function createDynamoDbClient(regionName) {
    // Set the region
    AWS.config.update({region: regionName});
    // Use the following config instead when using DynamoDB Local
    // AWS.config.update({region: 'localhost', endpoint: 'http://localhost:8000', accessKeyId: 'access_key_id', secretAccessKey: 'secret_access_key'});
    return new AWS.DynamoDB();
}

function createPutItemInput() {
    return {
        "TableName": "app",
        "Item": {
            "PK": {
                "S": "COMPANY#123456"
            },
            "SK": {
                "S": "ORDER#123246"
            },
            "createdAt": {
                "N": "1604539709"
            },
            "clientData": {
                "M": {
                    "firstName": {
                        "S": "Angelo"
                    },
                    "lastName": {
                        "S": "Romano"
                    },
                    "email": {
                        "S": "angelojr97@hotmail.com"
                    },
                    "contactNumber": {
                        "N": "978877148"
                    },
                    "address": {
                        "M": {
                            "street": {
                                "S": "El Rezo"
                            },
                            "number": {
                                "N": "43"
                            },
                            "locality": {
                                "S": "Las Condes"
                            },
                            "apart": {
                                "S": "611"
                            },
                            "latitude": {
                                "N": "123"
                            },
                            "longitude": {
                                "N": "456"
                            }
                        }
                    }
                }
            },
            "comment": {
                "S": "Dejar en portería"
            },
            "cost": {
                "M": {
                    "order": {
                        "N": "8000"
                    },
                    "shipping": {
                        "N": "1500"
                    }
                }
            },
            "items": {
                "L": [
                    {
                        "M": {
                            "product": {
                                "S": "Produno"
                            },
                            "quantity": {
                                "N": "2"
                            },
                            "price": {
                                "N": "7000"
                            }
                        }
                    },
                    {
                        "M": {
                            "product": {
                                "S": "Prodos"
                            },
                            "quantity": {
                                "N": "1"
                            },
                            "price": {
                                "N": "1000"
                            }
                        }
                    }
                ]
            },
            "status": {
                "M": {
                    "payment": {
                        "N": "0"
                    },
                    "order": {
                        "N": "1"
                    },
                    "comments": {
                        "L": [
                            {
                                "M": {
                                    "timestamp": {
                                        "N": "1604539794"
                                    },
                                    "comment": {
                                        "S": "Comentario 1"
                                    }
                                }
                            },
                            {
                                "M": {
                                    "timestamp": {
                                        "N": "1604539798"
                                    },
                                    "comment": {
                                        "S": "Comentario 2"
                                    }
                                }
                            }
                        ]
                    }
                }
            },
            "shippingMethod": {
                "S": "Chilexpress"
            },
            "paidAt": {
                "N": "1604540533"
            },
            "updatedAt": {
                "N": "1604540539"
            },
            "clientId": {
                "S": "CLIENT#123456"
            }
        }
    }
}

async function executePutItem(dynamoDbClient, putItemInput) {
    // Call DynamoDB's putItem API
    try {
        const putItemOutput = await dynamoDbClient.putItem(putItemInput).promise();
        console.info('Successfully put item.');
        // Handle putItemOutput
    } catch (err) {
        handlePutItemError(err);
    }
}

// Handles errors during PutItem execution. Use recommendations in error messages below to
// add error handling specific to your application use-case.
function handlePutItemError(err) {
    if (!err) {
        console.error('Encountered error object was empty');
        return;
    }
    if (!err.code) {
        console.error(`An exception occurred, investigate and configure retry strategy. Error: ${JSON.stringify(err)}`);
        return;
    }
    switch (err.code) {
        case 'ConditionalCheckFailedException':
            console.error(`Condition check specified in the operation failed, review and update the condition check before retrying. Error: ${err.message}`);
            return;
        case 'TransactionConflictException':
            console.error(`Operation was rejected because there is an ongoing transaction for the item, generally safe to retry ' +
       'with exponential back-off. Error: ${err.message}`);
            return;
        case 'ItemCollectionSizeLimitExceededException':
            console.error(`An item collection is too large, you're using Local Secondary Index and exceeded size limit of` +
                `items per partition key. Consider using Global Secondary Index instead. Error: ${err.message}`);
            return;
        default:
            break;
        // Common DynamoDB API errors are handled below
    }
    handleCommonErrors(err);
}

function handleCommonErrors(err) {
    switch (err.code) {
        case 'InternalServerError':
            console.error(`Internal Server Error, generally safe to retry with exponential back-off. Error: ${err.message}`);
            return;
        case 'ProvisionedThroughputExceededException':
            console.error(`Request rate is too high. If you're using a custom retry strategy make sure to retry with exponential back-off.`
                + `Otherwise consider reducing frequency of requests or increasing provisioned capacity for your table or secondary index. Error: ${err.message}`);
            return;
        case 'ResourceNotFoundException':
            console.error(`One of the tables was not found, verify table exists before retrying. Error: ${err.message}`);
            return;
        case 'ServiceUnavailable':
            console.error(`Had trouble reaching DynamoDB. generally safe to retry with exponential back-off. Error: ${err.message}`);
            return;
        case 'ThrottlingException':
            console.error(`Request denied due to throttling, generally safe to retry with exponential back-off. Error: ${err.message}`);
            return;
        case 'UnrecognizedClientException':
            console.error(`The request signature is incorrect most likely due to an invalid AWS access key ID or secret key, fix before retrying.`
                + `Error: ${err.message}`);
            return;
        case 'ValidationException':
            console.error(`The input fails to satisfy the constraints specified by DynamoDB, `
                + `fix input before retrying. Error: ${err.message}`);
            return;
        case 'RequestLimitExceeded':
            console.error(`Throughput exceeds the current throughput limit for your account, `
                + `increase account level throughput before retrying. Error: ${err.message}`);
            return;
        default:
            console.error(`An exception occurred, investigate and configure retry strategy. Error: ${err.message}`);
            return;
    }
}
