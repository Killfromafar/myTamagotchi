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
  doAgeCalculation(pet);
  doHealthUpdate(pet);
  doHappinessUpdate(pet);
}

function doHealthUpdate(pet) {
  //DO HEALTH DETORIATION
  //if overfed then decrease health by 1.5
  if (pet.isOverfed) {
    pet.healthMetric -= 0.5;
    pet.isOverfed = false;
  }
  //for every hour over 4 hours since last fed then decrease health by 1
  var currentTime = new Date().getTime();
  var lastFedTime = new Date(pet.lastFed).getTime();
  var hoursPassedSinceFed = Math.floor(Math.abs(currentTime - lastFedTime) / 36e5) - 4;
  if (hoursPassedSinceFed > 0) {
    pet.healthMetric -= hoursPassedSinceFed;
  }
  //for every hour over 4 hours since last cleaned then decrease health by 1
  var lastCleanedTime = new Date(pet.lastCleaned).getTime();
  var hoursPassedSinceCleaneed = Math.floor(Math.abs(currentTime - lastCleanedTime) / 36e5) - 4;
  if (hoursPassedSinceCleaneed > 0) {
    pet.healthMetric -= hoursPassedSinceCleaneed / 2;
  }

  //for every hour above 2 since last calculating sickness,
  // roll dice to determine if pet is now sick
  var lastSicknessTime = new Date(pet.dateOfSicknessCalcuation).getTime();
  var hoursPassed = Math.floor(Math.abs(currentTime - lastSicknessTime) / 36e5) - 2;
  if (hoursPassed > 0) {
    pet.dateOfSicknessCalcuation = new Date().toISOString();
  }
  while (hoursPassed > 0 && pet.isAlive && pet.healthMetric < 4) {
    hoursPassed -= 1;
    //roll dice to determine if sick now
    var diceRoll = Math.random();
    if (pet.healthMetric >= 3 && pet.healthMetric < 4) {
      //if health is 3-3.9 then 10% chance of sickness every hour
      if (diceRoll < 0.1) {
        pet.isSick = true;
        pet.healthMetric -= 1
      }
    } else if (pet.healthMetric >= 2 && pet.healthMetric < 3) {
      //if health is 2-2.9 then 40% chance of sickness every hour
      if (diceRoll < 0.4) {
        pet.isSick = true;
        pet.healthMetric -= 1
      }
    } else if (pet.healthMetric > 0 && pet.healthMetric < 2) {
      //if health is 0.1-1.9 then 70% chance of sickness every hour
      if (diceRoll < 0.7) {
        pet.isSick = true;
        pet.healthMetric -= 1
      }
    }
  }

  //DO RESULTS OF DETORIATING HEALTH
  //Each year over 70 increases the pets chance of dying
  if (pet.age > 70 && pet.hasAged) {
    var chanceOfDeath = (pet.age - 70) / 10;
    var diceRoll = Math.random();
    if (diceRoll < chanceOfDeath) {
      pet.isAlive = false;
      pet.causeOfDeath = 'AGE';
    }
  }
  //if health is 0 or below then die
  if (pet.healthMetric <= 0) {
    pet.isAlive = false;
    pet.causeOfDeath = 'SICKNESS'
  }
}

function doHappinessUpdate(pet) {

  //if sick decrease happiness by 1
  //if overplayed decrease happiness by 1.5
  //for every hour over 4 hours since last played then decrease happiness by 1
  //for every hour over 4 hours since last cleaned then decrease happiness by 0.5

  //if happiness is now 3-3.9 then roll dice for 40% of sickness
  //if happiness is 2-2.9 then 70% chance of sickness
  //if happiness is 0.1-1.9 then 90% of sickness
  //if happiness is 0 or less then die
}

function doAgeCalculation(pet) {
  var dob = new Date(pet.dateOfBirth);
  var currentDate = new Date();
  var hoursPassed = Math.floor(Math.abs(currentDate.getTime() - dob.getTime()) / 36e5);
  let newAge = 0;
  if (hoursPassed <= 48) {
    newAge = Math.floor(hoursPassed / 16);
    if (newAge !== pet.age) {
      pet.age = newAge
      pet.hasAged = true;
      pet.stage = 'BABY';
    } else {
      pet.hasAged = false;
    }
  } else if (hoursPassed <= 48 + 72) {
    newAge = 3 + Math.floor((hoursPassed - 48) / 8);
    if (newAge !== pet.age) {
      pet.age = newAge
      pet.hasAged = true;
      pet.stage = 'CHILD';
    } else {
      pet.hasAged = false;
    }
  } else if (hoursPassed <= 48 + 72 + 96) {
    newAge = 12 + Math.floor((hoursPassed - 48 - 72) / 12);
    if (newAge !== pet.age) {
      pet.age = newAge
      pet.hasAged = true;
      pet.stage = 'TEEN';
    } else {
      pet.hasAged = false;
    }
  } else {
    newAge = 20 + Math.floor((hoursPassed - 48 - 72 - 96) / 2.5);
    if (newAge !== pet.age) {
      pet.age = newAge
      pet.hasAged = true;
      pet.stage = 'ADULT';
    } else {
      pet.hasAged = false;
    }
  }
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

  'CreateNewPetIntent': function () {
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
              isAlive: true,
              isSick: false,
              dateOfSicknessCalcuation: new Date().toISOString(),
              lastPlayedWith: new Date().toISOString(),
              lastFed: new Date().toISOString(),
              lastCleaned: new Date().toISOString()
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
            isAlive: true,
            isSick: false,
            dateOfSicknessCalcuation: new Date().toISOString(),
            lastPlayedWith: new Date().toISOString(),
            lastFed: new Date().toISOString(),
            lastCleaned: new Date().toISOString()
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
  'FeedPetIntent': function () {
    console.info('ENTRY::FeedPetIntent');
    if (this.event.request.dialogState !== 'COMPLETED') {
      this.emit(':delegate');
      console.info('EXIT::FeedPetIntent::delegate');
      return;
    } else { 
      getPlayer(this.event.context.System.user.userId).then((player) => {
        if (!player) {
          var speechOutput = 'It appears as though you havn\'t got a pet. To create a new pet just say "I want a new pet"'
          var reprompt = 'Remember - if you\'re not sure what to do next, you can ask for help.'
          this.emit(':ask', speechOutput, reprompt);
          console.info('EXIT::FeedPetIntent::NewPlayer');
          return;
        } else {
          var food = this.event.request.intent.slots.foodType.value;
          if (food === 'meal') {
            if (player.credits < 4) {
              var speechOutput = `I'm sorry you can't afford that. A meal for your pet costs 4 credits. You only have ${player.credits} credits`
              var reprompt = 'You can earn more credits by playing a game with your pet'
              this.emit(':ask', speechOutput, reprompt);
              console.info('EXIT::FeedPetIntent::CantAffordMeal');
              return;
            } else { 
              player.pet.healthMetric += 2;
              player.pet.lastFed = new Date().toISOString();
              if (player.pet.healthMetric > 5) { 
                player.pet.isOverfed = true;
              }
            }  
          } else if (food === 'snack') {
            if (player.credits < 2) {
              var speechOutput = `I'm sorry you can't afford that. A snack for your pet costs 2 credits. You only have ${player.credits} credits`
              var reprompt = 'You can earn more credits by playing a game with your pet'
              this.emit(':ask', speechOutput, reprompt);
              console.info('EXIT::FeedPetIntent::CantAffordSnack');
              return;
            } else {
              player.pet.healthMetric += 1;
              player.pet.lastFed = new Date().toISOString();
              if (player.pet.healthMetric > 5) {
                player.pet.isOverfed = true;
              }
            }   
          }
          //updatepet
          updatePetStatus(player.pet);
          //put pet to db
          dynamoDBHelper.put(player);
          //speechoutput
          var speechOutput = `What delicious food that was!
          Your pet is now ${player.pet.healthStatus} and he feels ${player.pet.happyStatus}
          What do you want to do next?`;
          var reprompt = 'Remember - if you\'re not sure what to do next, you can ask for help at any time.';
          this.emit(':ask', speechOutput, reprompt);
          console.info('EXIT::FeedPetIntent::SuccessfulFeed');
          return;
        }
      });
    }
  },

  //play high/low with pet intent - earns credits, can overplay, increase happiness by 2
  //play left/right with pet intent - earns credits, can overplay, increase happiness by 2
  'PlayGameIntent': function () {
    // The Tamagotchi presents a number, and the player must guess whether the next 
    // number it thinks of will be higher or lower than the displayed number.
    // It cannot pick a number higher than 9, or lower than 1. 
    // 3 or more correct gusses out of 5 is a win
    this.emit(':tell', 'Feature coming soon');
    // The user must guess whether their Tamagotchi turns left or right, 
    // and a minimum of 3 correct guesses out of 5 is a win
  },
  //cleanup after tamogotchi - costs credits, cant cleanup
  'CleanPetIntent': function () {
    this.emit(':tell', 'Feature coming soon');
  },
  //treat sickness intent - costs medpack, sets health to 4
  'TreatSicknessIntent': function () {
    this.emit(':tell', 'Feature coming soon');
  },
  //buy medpack - costs credits
  'BuyMedpackIntent': function () {
    this.emit(':tell', 'Feature coming soon');
  },
  //information intent (get status of pet)
  'StatusIntent': function () {
    console.info('ENTRY StatusIntent');
    //check database for this user
    const player = getPlayer(request.event.context.System.user.userId)
    //if they are not in database begin new tamagotchi convo
    if (player) {
      //Calculate new status' of pet
      updatePetStatus(player.pet)
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
  },

  'AMAZON.HelpIntent': function () {
    var speechOutput = `To keep your tamagotchi happy, you should regularly play with them.
    To keep your tamagotchi healthy you should regularly clean their litter tray and keep them fed.
    Be sure not to overfeed or overplay with your tamagotchi, otherwise it will begin to have the opposite effect!
    When your tamagotchi becomes an adult there will be a chance that every time you play they will meet a partner.
    If your tamagotchi meets a partner be sure to keep them happy and healthy to increase the chance of offspring.
    Now what would you like to do?`
    var reprompt = `Remember - To find out your current pets status you can ask "How's my pet?". What would you like to do?' `;
    this.emit(':ask', speechOutput, reprompt);
  },

  'AMAZON.CancelIntent': function () {
    this.emit(':tell', 'Goodbye');
  },

  'AMAZON.StopIntent': function () {
    this.emit(':tell', 'Goodbye');
  }
};
exports.handler = function (event, context, callback) {
  var alexa = Alexa.handler(event, context, callback);
  alexa.appId = config.get('app.id');
  alexa.registerHandlers(handlers);
  alexa.execute();
};