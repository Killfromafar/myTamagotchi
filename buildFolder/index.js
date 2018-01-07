'use strict';

process.env.NODE_CONFIG_DIR = __dirname + '/config';
const config = require('config');
const Alexa = require('alexa-sdk');
const dynamoDBHelper = require(__dirname + '/lib/dynamoDBHelper');


function getPlayer(userId) {
  const queryKeyValues = {
    userId: userId
  };
  return dynamoDBHelper.get(config.get('dynamo.tables.players.name'), queryKeyValues);
}

function updatePetStatus(pet) {
  //check DOB
  var dob = new Date(pet.dateOfBirth);
  var currentDate = new Date();
  var hoursPassed = Math.abs(currentDate.getTime() - dob.getTime()) / 36e5;
  console.log('**********', hoursPassed)

}
var handlers = {
  'LaunchRequest': function () {
    console.info('ENTRY LaunchRequest');
    //check database for this user
    getPlayer(this.event.context.System.user.userId).then((player) => { 
      //if they are not in database begin new tamagotchi convo
      if (player) {
        //Calculate new status' of pet
        updatePetStatus(player.pet)
        //report pets status
        var speechOutput = `Welcome to My Tamagotchi Game... Your pet is feeling ${player.pet.happyStatus} and he is ${player.pet.healthStatus}... 
        Your pet is a ${player.pet.age} year old ${player.pet.stage} and he weighs ${player.pet.weight} pounds...
        You have ${player.credits} credits and ${player.medPacks} medicine packs...
        What would you like to do with your pet?`
        var reprompt = 'If your pet is not happy try saying "I want to play with my tamgotchi", or if your pet is unhealthy try saying "use a med-pack". What would you like to do?'
        this.emit(':ask', speechOutput, reprompt);
        console.info('EXIT LaunchRequest::ExistingPlayer');
        return;
      } else {
        //begin new pet creation
        var speechOutput = 'Welcome to My Tamagotchi Game, it appears that this is your first time playing. If you want to find out how to play, just ask for help. If you want to get started then just say "I want a new pet"'
        var reprompt = 'Remember - if you\'re not sure what to do next, you can ask for help at any time.'
        this.emit(':ask', speechOutput, reprompt);
        console.info('EXIT LaunchRequest::NewPlayer');
        return;
      }
    });
  },

  'AMAZON.HelpIntent': function () {
    speechOutput = `To keep your tamagotchi happy you should regularly ply with them.
    To keep your tamagotchi healthy you should regularly clean the litter tray and feed them.
    Be sure not to overfeed or overplay with your tamagotchi otherwise it will begin to have the opposite effect!
    When your tamagotchi becomes and adult there will be a chance that every time you play they will meet a partner.
    If your tsamagotchi meets a partner be sure to keep them happy and healthy to increase the chance of offspring.`
  },

  'AMAZON.CancelIntent': function () {
  },

  'AMAZON.StopIntent': function () {
  },
  'CreateNewPet': function () {
    console.info('ENTRY CreateNewPet');
    const intentObj = this.event.request.intent;
    if (intentObj.confirmationStatus === 'CONFIRMED') {
      getPlayer(this.event.context.System.user.userId).then((existingPlayer) => {
        //If there is no player in DB then create new player and pet obj and put to DB
        if (!existingPlayer) {
          let player = {
            pet: {
              dateOfBirth: new Date().toISOString(),
              happyStatus: 'INDIFFERENT', //HAPPY 5/4, INDIFFERENT 3, UNHAPPY 2/1
              happyMetric: 3,
              healthStatus: 'HEALTHY', //HEALTHY 5/4, FRAIL 3, SICK 2/1
              healthMetric: 5,
              age: 0,
              stage: 'BABY',
              weight: 6,
              isAlive: true
            },
            creationTime: new Date().toISOString(),
            petsAbandoned: 0,
            petsDiedOfOldAge: 0,
            petsDiedOfSickness: 0,
            credits: 0,
            medPacks: 0,
            userId: this.event.context.System.user.userId
          }
          dynamoDBHelper.put(config.get('dynamo.tables.players.name'), player);
          var speechOutput = `Congratulations on your new pet! 
          Your pet is ${player.pet.healthStatus} but he feels ${player.pet.happyStatus}. 
          Why don't you play a game to bond with your new pet?`
          var reprompt = 'Remember - playing games with your new pet will increase their happiness and earn you credits, what would you like to do?';
          this.emit(':ask', speechOutput, reprompt);
          console.info('EXIT CreateNewPet::NewPlayerNewPet');
          return;
        } else {
          if (existingPlayer.pet.isAlive) {
            existingPlayer.petsAbandoned += 1;
          }
          existingPlayer.pet = {
            dateOfBirth: new Date().toISOString(),
            happyStatus: 'INDIFFERENT', //HAPPY 5/4, INDIFFERENT 3, UNHAPPY 2/1
            happyMetric: 3,
            healthStatus: 'HEALTHY', //HEALTHY 5/4, FRAIL 3, SICK 2/1
            healthMetric: 5,
            age: 0,
            stage: 'BABY',
            weight: 6,
            isAlive: true
          }
          dynamoDBHelper.put(config.get('dynamo.tables.players.name'), existingPlayer);
          //report pets status
          var speechOutput = `Congratulations on your new pet! 
          Your pet is ${existingPlayer.pet.healthStatus} but he feels ${existingPlayer.pet.happyStatus}. 
          Why don't you play a game to bond with your new pet?`
          var reprompt = 'Remember - playing games with your new pet will increase their happiness and earn you credits, what would you like to do?';
          this.emit(':ask', speechOutput, reprompt);
          console.info('EXIT CreateNewPet::ExistingPlayerNewPet');
          return;
        }
      });
    } else if (intentObj.confirmationStatus === 'DENIED') {
      var speechOutput = 'Ok, I won\'t put your current pet up for adoption, what would you like to do instead?';
      var reprompt = 'To find out your current pets status you can ask "How\'s my pet?". What would you like to do?';
      this.emit(':ask', speechOutput, reprompt);
      console.info('EXIT CreateNewPet::ConfirmationDenied');
      return;
    } else {
      this.emit(':delegate');
      console.info('EXIT CreateNewPet::ConfirmationPending');
      return;
    }
  },
  //feed tamagotchi intent - costs credits, can feed even when full, snack increase health by 1, meal by 2

  //pet tamogitchi intent - increase happiness by 1

  //play high/low with pet intent - earns credits, can overplay, increase happiness by 2

  //play left/right with pet intent - earns credits, can overplay, increase happiness by 2

  //cleanup after tamogotchi - costs credits, cant cleanup

  //treat sickness intent - costs medpack, sets health to 4

  //buy medpack - costs credits

  //information intent (get status of pet)
  'StatusIntent': function () {
    console.info('ENTRY StatusIntent');
    //check database for this user
    const player = getPlayer(request.event.context.System.user.userId)
    //if they are not in database begin new tamagotchi convo
    if (player) {
      //Calculate new status' of pet
      updatePet(player.pet)
      //report pets status
      var speechOutput = `Your pet is feeling ${player.pet.happyStatus} and he is ${player.pet.healthStatus}... 
      Your pet is a ${player.pet.age} year old ${player.pet.stage} and he weighs ${player.pet.weight} pounds...
      You have ${player.credits} credits and ${player.medicinePacks} medicine packs`
      var reprompt = 'You can say thinks like "feed my pet" or "lets play a game"';

      this.emit(':ask', speechOutput, reprompt);
      console.info('EXIT StatusIntent');
      return;
    }
    else {
      this.emit('LaunchRequest');
      console.info('EXIT StatusIntent');
      return;
    }
  },

  'Unhandled': function () {
    console.info('ENTRY Unhandled');
    this.emit(':tell', 'Im sorry but something went wrong');
    console.info('EXIT Unhandled');
    return;
  }
};
exports.handler = function (event, context, callback) {
  var alexa = Alexa.handler(event, context, callback);
  alexa.appId = config.get('app.id');
  alexa.registerHandlers(handlers);
  alexa.execute();
};