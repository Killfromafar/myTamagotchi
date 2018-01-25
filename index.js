'use strict';

process.env.NODE_CONFIG_DIR = __dirname + '/config';
const config = require('config');
const Alexa = require('alexa-sdk');

//intents
const intentAmazonCancelIntent = require('IntentAmazonCancelIntent');
const intentAmazonHelpIntent = require('IntentAmazonHelpIntent');
const intentAmazonStopIntent = require('IntentAmazonStopIntent');
const intentBuyMedpack = require('IntentBuyMedpack');
const intentCleanPet = require('IntentCleanPet');
const intentCreateNewPet = require('IntentCreateNewPet');
const intentFeedPet = require('IntentFeedPet');
const intentLaunchRequest = require('IntentLaunchRequest');
const intentPlayGame = require('IntentPlayGame');
const intentStatus = require('IntentStatus');
const intentTreatSickness = require('IntentTreatSickness');
const intentUnhandled = require('IntentUnhandled');

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
