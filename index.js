'use strict';

process.env.NODE_CONFIG_DIR = __dirname + '/config';
const config = require('config');
const Alexa = require('alexa-sdk');

//intents
const intentAmazonCancelIntent = require('IntentAmazonCancelIntent');
const intentAmazonHelpIntent = require(__dirname + 'IntentAmazonHelpIntent');
const intentAmazonStopIntent = require(__dirname + 'IntentAmazonStopIntent');
const intentBuyMedpack = require(__dirname + 'IntentBuyMedpack');
const intentCleanPet = require(__dirname + 'IntentCleanPet');
const intentCreateNewPet = require(__dirname + 'IntentCreateNewPet');
const intentFeedPet = require(__dirname + 'IntentFeedPet');
const intentLaunchRequest = require(__dirname + 'IntentLaunchRequest');
const intentPlayGame = require(__dirname + 'IntentPlayGame');
const intentStatus = require(__dirname + 'IntentStatus');
const intentTreatSickness = require(__dirname + 'IntentTreatSickness');
const intentUnhandled = require(__dirname + 'IntentUnhandled');

const handlers = Object.assign(
  {},
  intentCleanPet,
  intentCreateNewPet,
  intentFeedPet,
  intentLaunchRequest,
  intentPlayGame,
  intentTreatSickness,
  intentBuyMedpack,
  intentStatus,
  intentUnhandled,
  intentAmazonHelpIntent,
  intentAmazonCancelIntent,
  intentAmazonStopIntent
);

exports.handler = function (event, context, callback) {
  const alexa = Alexa.handler(event, context, callback);
  alexa.appId = config.get('app.id');
  alexa.registerHandlers(handlers);
  alexa.execute();
};
