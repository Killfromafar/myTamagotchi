'use strict';

const AWS = require('aws-sdk');
AWS.config.update({ region: 'eu-west-1' });
var db = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-10-08' });

function get(tableName, keyValues) {
  const params = {
    TableName: tableName,
    Key: keyValues
  };

  return new Promise((resolve) => {
    db.get(params, (err, data) => {
      if (err) {
        console.error(`Unable to get data from table. 
        Table: ${params.TableName} :: Query Keys: ${params.Key} :: Error: `, err);
        resolve(null);
      } else {
        console.info('@@@@@@@@@@@@@ITEM@@@@@@@@@@', data)
        resolve (data.Item);
      }
    });
  }).catch(console.error);
}

function put(tableName, objectToSave) {
  const params = {
    TableName: tableName,
    Item: objectToSave
  };


    db.put(params, (err) => {
      if (err) {
        console.error(`Unable to put data into table. 
        Table: ${params.TableName} :: Items: ${JSON.stringify(params.Item)} :: Error: `, err);
        return false;
      } else {
        return true;
      }
    });
}

module.exports = {
  get: get,
  put: put
};
