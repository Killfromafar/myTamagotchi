'use strict';

process.env.NODE_CONFIG_DIR = __dirname + '/config';
const config = require('config');
const Alexa = require('alexa-sdk');
const dynamoDBHelper = require(__dirname + '/lib/dynamoDBHelper');

function doHealthUpdate(pet) {
  if (pet.isOverfed) {
    pet.healthMetric -= 1.5;
    pet.isOverfed = false;
  }
  const currentTime = new Date().getTime();
  const lastFedTime = new Date(pet.lastFed).getTime();
  const hoursPassedSinceFed = Math.floor(Math.abs(currentTime - lastFedTime) / 36e5) - 4;
  if (hoursPassedSinceFed > 0) {
    pet.healthMetric -= hoursPassedSinceFed;
  }
  const lastCleanedTime = new Date(pet.lastCleaned).getTime();
  const hoursPassedSinceCleaneed = Math.floor(Math.abs(currentTime - lastCleanedTime) / 36e5) - 4;
  if (hoursPassedSinceCleaneed > 0) {
    pet.healthMetric -= hoursPassedSinceCleaneed / 2;
  }
  const lastSicknessTime = new Date(pet.dateOfSicknessCalcuation).getTime();
  let hoursPassed = Math.floor(Math.abs(currentTime - lastSicknessTime) / 36e5) - 2;
  if (hoursPassed > 0) {
    pet.dateOfSicknessCalcuation = new Date().toISOString();
  }
  while (hoursPassed > 0 && pet.isAlive && pet.healthMetric < 4) {
    hoursPassed -= 1;
    const diceRoll = Math.random();
    if (pet.healthMetric >= 3 && pet.healthMetric < 4) {
      if (diceRoll < 0.1) {
        pet.isSick = true;
        pet.healthMetric -= 1;
      }
    } else if (pet.healthMetric >= 2 && pet.healthMetric < 3) {
      if (diceRoll < 0.4) {
        pet.isSick = true;
        pet.healthMetric -= 1;
      }
    } else if (pet.healthMetric > 0 && pet.healthMetric < 2) {
      if (diceRoll < 0.7) {
        pet.isSick = true;
        pet.healthMetric -= 1;
      }
    }
  }
  if (pet.age > 70 && pet.hasAged) {
    const chanceOfDeath = (pet.age - 70) / 10;
    const diceRoll = Math.random();
    if (diceRoll < chanceOfDeath) {
      pet.isAlive = false;
      pet.causeOfDeath = 'AGE';
    }
  }
  if (pet.healthMetric >= 4) {
    pet.healthStatus = 'HEALTHY';
  } else if (pet.healthMetric < 4 && pet.healthMetric > 2) {
    pet.healthStatus = 'FRAIL';
  } else if (pet.healthMetric <= 2) {
    pet.healthStatus = 'SICK';
  }
  if (pet.healthMetric <= 0) {
    pet.isAlive = false;
    pet.causeOfDeath = 'SICKNESS';
  }
}

function doHappinessUpdate(pet) {
  if (pet.isSick) {
    pet.happyMetric -= 1;
  }
  if (pet.isOverPlayed) {
    pet.happyMetric -= 2;
  }
  const currentTime = new Date().getTime();
  const lastPlayTime = new Date(pet.lastPlayedWith).getTime();
  const hoursPassedSinceFed = Math.floor(Math.abs(currentTime - lastPlayTime) / 36e5) - 4;
  if (hoursPassedSinceFed > 0) {
    pet.happyMetric -= hoursPassedSinceFed;
  }
  const lastCleanedTime = new Date(pet.lastCleaned).getTime();
  const hoursPassedSinceCleaneed = Math.floor(Math.abs(currentTime - lastCleanedTime) / 36e5) - 4;
  if (hoursPassedSinceCleaneed > 0) {
    pet.happyMetric -= hoursPassedSinceCleaneed / 2;
  }
  if (pet.happyMetric < 0) {
    pet.healthMetric -= (pet.happyMetric *= -1);
    pet.happyMetric = 0;
  }

  if (pet.happyMetric >= 4) {
    pet.happyStatus = 'HAPPY';
  } else if (pet.happyMetric < 4 && pet.happyMetric > 2) {
    pet.happyStatus = 'INDIFFERENT';
  } else if (pet.happyMetric <= 2) {
    pet.happyStatus = 'UNHAPPY';
  }
}

function doAgeCalculation(pet) {
  const dob = new Date(pet.dateOfBirth);
  const currentDate = new Date();
  const hoursPassed = Math.floor(Math.abs(currentDate.getTime() - dob.getTime()) / 36e5);
  let newAge = 0;
  if (hoursPassed <= 48) {
    newAge = Math.floor(hoursPassed / 16);
    if (newAge !== pet.age) {
      pet.age = newAge;
      pet.hasAged = true;
      pet.stage = 'BABY';
    } else {
      pet.hasAged = false;
    }
  } else if (hoursPassed <= 48 + 72) {
    newAge = 3 + Math.floor((hoursPassed - 48) / 8);
    if (newAge !== pet.age) {
      pet.age = newAge;
      pet.hasAged = true;
      pet.stage = 'CHILD';
    } else {
      pet.hasAged = false;
    }
  } else if (hoursPassed <= 48 + 72 + 96) {
    newAge = 12 + Math.floor((hoursPassed - 48 - 72) / 12);
    if (newAge !== pet.age) {
      pet.age = newAge;
      pet.hasAged = true;
      pet.stage = 'TEEN';
    } else {
      pet.hasAged = false;
    }
  } else {
    newAge = 20 + Math.floor((hoursPassed - 48 - 72 - 96) / 2.5);
    if (newAge !== pet.age) {
      pet.age = newAge;
      pet.hasAged = true;
      pet.stage = 'ADULT';
    } else {
      pet.hasAged = false;
    }
  }
}

function updatePlayerStatus(player) {
  if (!player) {
    return player;
  }
  if (!player.pet.isAlive) {
    return player;
  }
  doAgeCalculation(player.pet);
  doHealthUpdate(player.pet);
  doHappinessUpdate(player.pet);
  return player;
}

function getPlayer(userId) {
  const queryKeyValues = {
    userId: userId
  };
  return dynamoDBHelper.get(config.get('dynamo.tables.players.name'), queryKeyValues);
}

function putPlayer(player) {
  updatePlayerStatus(player);
  dynamoDBHelper.put(config.get('dynamo.tables.players.name'), player);
}

function generateRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function setupHighLowGame(player) {
  do {
    player.firstNumber = generateRandomNumber(1, 9);
    player.secondNumber = generateRandomNumber(1, 9);
  } while (player.firstNumber === player.secondNumber);
  if (player.firstNumber > player.secondNumber) {
    player.correctAnswer = 'lower';
  } else {
    player.correctAnswer = 'higher';
  }
  player.gameInProgress = true;
  putPlayer(player);
}

const handlers = {
  'LaunchRequest': function () {
    getPlayer(this.event.context.System.user.userId).then((player) => {
      updatePlayerStatus(player);
      if (player) {
        let speechOutput;
        let reprompt;
        if (player.pet.isAlive) {
          speechOutput = `Welcome to My Voice Pet Game... Your pet is feeling ${player.pet.happyStatus} and he is ${player.pet.healthStatus}... 
          Your pet is a ${player.pet.age} year old ${player.pet.stage} and he weighs ${player.pet.weight} pounds...
          You have ${player.credits} credits and ${player.medPacks} medicine packs...
          What would you like to do with your pet?`;
          reprompt = 'If your pet is not happy try saying "I want to play with my pet", or if your pet is unhealthy try saying "use a med-pack". What would you like to do?';
        } else {
          speechOutput = `Your pet has passed away due to ${player.pet.causeOfDeath}. To start a new game just ask for a new pet`;
          reprompt = 'To start again with a new pet just say "I want a new pet"';
        }
        this.emit(':ask', speechOutput, reprompt);
        return;
      } else {
        const speechOutput = 'Welcome to My Voice Pet Game, it appears that this is your first time playing. If you want to find out how to play, just ask for help. If you want to get started then just say "I want a new pet"';
        const reprompt = 'Remember - if you\'re not sure what to do next, you can ask for help at any time.';
        this.emit(':ask', speechOutput, reprompt);
        return;
      }
    }).catch((error) => {
      console.error(`An error occurred whilst executing LaunchRequest: ${error}`);
      this.emit(':tell', 'I\'m sorry, something went wrong');
    });
  },

  'CreateNewPetIntent': function () {
    const intentObj = this.event.request.intent;
    if (intentObj.confirmationStatus === 'CONFIRMED') {
      getPlayer(this.event.context.System.user.userId).then((existingPlayer) => {
        updatePlayerStatus(existingPlayer);
        if (!existingPlayer) {
          const player = {
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
            userId: this.event.context.System.user.userId,
            creationTime: new Date().toISOString(),
            petsAbandoned: 0,
            petsDiedOfOldAge: 0,
            petsDiedOfSickness: 0,
            credits: 0,
            medPacks: 0,
            gameInProgress: false,
            gameType: 'NONE',
            gameWins: 0,
            gameRounds: 0,
            shouldEndGame: false,
            wonLastRound: false
          };
          putPlayer(player);
          const speechOutput = `Congratulations on your new pet! 
          Your pet is ${player.pet.healthStatus} but he feels ${player.pet.happyStatus}. 
          Why don't you play a game to bond with your new pet?`;
          const reprompt = 'Remember - playing games with your new pet will increase their happiness and earn you credits, what would you like to do?';
          this.emit(':ask', speechOutput, reprompt);
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
          };
          putPlayer(existingPlayer);
          const speechOutput = `Congratulations on your new pet! 
          Your pet is ${existingPlayer.pet.healthStatus} but he feels ${existingPlayer.pet.happyStatus}. 
          Why don't you play a game to bond with your new pet?`;
          const reprompt = 'Remember - playing games with your new pet will increase their happiness and earn you credits, what would you like to do?';
          this.emit(':ask', speechOutput, reprompt);
          return;
        }
      }).catch((error) => {
        console.error(`An error occurred whilst executing CreateNewPetIntent: ${error}`);
        this.emit(':tell', 'I\'m sorry, something went wrong');
      });
    } else if (intentObj.confirmationStatus === 'DENIED') {
      const speechOutput = 'Ok, I won\'t put your current pet up for adoption, what would you like to do instead?';
      const reprompt = 'To find out your current pets status you can ask "How\'s my pet?". What would you like to do?';
      this.emit(':ask', speechOutput, reprompt);
      return;
    } else {
      this.emit(':delegate');
      return;
    }
  },

  'FeedPetIntent': function () {
    if (this.event.request.dialogState !== 'COMPLETED') {
      this.emit(':delegate');
      return;
    } else {
      getPlayer(this.event.context.System.user.userId).then((player) => {
        updatePlayerStatus(player);
        if (!player) {
          const speechOutput = 'It appears as though you havn\'t got a pet. To create a new pet just say "I want a new pet"';
          const reprompt = 'Remember - if you\'re not sure what to do next, you can ask for help.';
          this.emit(':ask', speechOutput, reprompt);
          return;
        } else {
          const food = this.event.request.intent.slots.foodType.value;
          if (food === 'meal') {
            if (player.credits < 4) {
              const speechOutput = `I'm sorry you can't afford that. A meal for your pet costs 4 credits. You only have ${player.credits} credits`;
              const reprompt = 'You can earn more credits by playing a game with your pet';
              this.emit(':ask', speechOutput, reprompt);
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
              const speechOutput = `I'm sorry you can't afford that. A snack for your pet costs 2 credits. You only have ${player.credits} credits`;
              const reprompt = 'You can earn more credits by playing a game with your pet';
              this.emit(':ask', speechOutput, reprompt);
              return;
            } else {
              player.pet.healthMetric += 1;
              player.pet.lastFed = new Date().toISOString();
              if (player.pet.healthMetric > 5) {
                player.pet.isOverfed = true;
              }
            }
          }
          putPlayer(player);
          const speechOutput = `What delicious food that was!
          Your pet is now ${player.pet.healthStatus} and he feels ${player.pet.happyStatus}
          What do you want to do next?`;
          const reprompt = 'Remember - if you\'re not sure what to do next, you can ask for help at any time.';
          this.emit(':ask', speechOutput, reprompt);
          return;
        }
      }).catch((error) => {
        console.error(`An error occurred whilst executing FeedPetIntent: ${error}`);
        this.emit(':tell', 'I\'m sorry, something went wrong');
      });
    }
  },

  'GuessHighIntent': function () {
    getPlayer(this.event.context.System.user.userId).then((player) => {
      let speechOutput;
      let reprompt;
      let secondNumber;
      if (!player.gameInProgress) {
        speechOutput = 'Remember - To find out your current pets status you can ask "How\'s my pet?". What would you like to do?\' ';
        this.emit(':ask', speechOutput, speechOutput);
        return;
      }
      updatePlayerStatus(player);
      if (player.correctAnswer === 'higher') {
        player.gameWins += 1;
        secondNumber = player.secondNumber;
        if (player.gameWins >= 3) {
          player.pet.happyMetric += 1;
          if (player.pet.happyMetric > 5) {
            player.pet.isOverPlayed = true;
          }
          player.credits += 2;
          player.gameInProgress = false;
          putPlayer(player);
          speechOutput = 'Congratulations you have won. Your pet is happier and you have earned 2 credits. What would you like to do next?';
          reprompt = 'Remember - To find out your current pets status you can ask "How\'s my pet?". What would you like to do?\' ';
          this.emit(':ask', speechOutput, reprompt);
          return;
        }
        if (player.gameRounds >= 5) {
          player.pet.happyMetric += 1;
          if (player.pet.happyMetric > 5) {
            player.pet.isOverPlayed = true;
          }
          player.gameInProgress = false;
          putPlayer(player);
          speechOutput = 'Unfortunatley you have lost this time. However, your pet is now happier. What would you like to do next?';
          reprompt = 'Remember - To find out your current pets status you can ask "How\'s my pet?". What would you like to do?\' ';
          this.emit(':ask', speechOutput, reprompt);
          return;
        }
        setupHighLowGame(player);
        speechOutput = `Thats correct, the next number was ${secondNumber}. Time for another round.`;
        reprompt = `I have chosen the number ${player.firstNumber}, will the next one be higher or lower?`;
        this.emit(':ask', `${speechOutput} ${reprompt}`, reprompt);
        return;
      }
      player.gameRounds += 1;
      if (player.gameRounds >= 5) {
        player.pet.happyMetric += 1;
        if (player.pet.happyMetric > 5) {
          player.pet.isOverPlayed = true;
        }
        player.gameInProgress = false;
        putPlayer(player);
        speechOutput = 'Unfortunatley you have lost this time. However, your pet is now happier. What would you like to do next?';
        reprompt = 'Remember - To find out your current pets status you can ask "How\'s my pet?". What would you like to do?\' ';
        this.emit(':ask', speechOutput, reprompt);
        return;
      }
      secondNumber = player.secondNumber;
      setupHighLowGame(player);
      speechOutput = `You guessed wrong! The next number was ${secondNumber}. Time for another round.`;
      reprompt = `I have chosen the number ${player.firstNumber}, will the next one be higher or lower?`;
      this.emit(':ask', `${speechOutput} ${reprompt}`, reprompt);
      return;
    }).catch((error) => {
      console.error(`An error occurred whilst executing GuessHighIntent: ${error}`);
      this.emit(':tell', 'I\'m sorry, something went wrong');
    });
  },

  'GuessLowIntent': function () {
    getPlayer(this.event.context.System.user.userId).then((player) => {
      let speechOutput;
      let reprompt;
      let secondNumber;
      if (!player.gameInProgress) {
        speechOutput = 'Remember - To find out your current pets status you can ask "How\'s my pet?". What would you like to do?\' ';
        this.emit(':ask', speechOutput, speechOutput);
        return;
      }
      updatePlayerStatus(player);
      if (player.correctAnswer === 'lower') {
        player.gameWins += 1;
        secondNumber = player.secondNumber;
        if (player.gameWins >= 3) {
          player.pet.happyMetric += 1;
          if (player.pet.happyMetric > 5) {
            player.pet.isOverPlayed = true;
          }
          player.credits += 2;
          player.gameInProgress = false;
          putPlayer(player);
          speechOutput = 'Congratulations you have won. Your pet is happier and you have earned 2 credits. What would you like to do next?';
          reprompt = 'Remember - To find out your current pets status you can ask "How\'s my pet?". What would you like to do?\' ';
          this.emit(':ask', speechOutput, reprompt);
          return;
        }
        if (player.gameRounds >= 5) {
          player.pet.happyMetric += 1;
          if (player.pet.happyMetric > 5) {
            player.pet.isOverPlayed = true;
          }
          player.gameInProgress = false;
          putPlayer(player);
          speechOutput = 'Unfortunatley you have lost this time. However, your pet is now happier. What would you like to do next?';
          reprompt = 'Remember - To find out your current pets status you can ask "How\'s my pet?". What would you like to do?\' ';
          this.emit(':ask', speechOutput, reprompt);
          return;
        }
        setupHighLowGame(player);
        speechOutput = `Thats correct, the next number was ${secondNumber}. Time for another round.`;
        reprompt = `I have chosen the number ${player.firstNumber}, will the next one be higher or lower?`;
        this.emit(':ask', `${speechOutput} ${reprompt}`, reprompt);
        return;
      }
      player.gameRounds += 1;
      if (player.gameRounds >= 5) {
        player.pet.happyMetric += 1;
        if (player.pet.happyMetric > 5) {
          player.pet.isOverPlayed = true;
        }
        player.gameInProgress = false;
        putPlayer(player);
        speechOutput = 'Unfortunatley you have lost this time. However, your pet is now happier. What would you like to do next?';
        reprompt = 'Remember - To find out your current pets status you can ask "How\'s my pet?". What would you like to do?\' ';
        this.emit(':ask', speechOutput, reprompt);
        return;
      }
      secondNumber = player.secondNumber;
      setupHighLowGame(player);
      speechOutput = `You guessed wrong! The next number was ${secondNumber}. Time for another round.`;
      reprompt = `I have chosen the number ${player.firstNumber}, will the next one be higher or lower?`;
      this.emit(':ask', `${speechOutput} ${reprompt}`, reprompt);
      return;
    }).catch((error) => {
      console.error(`An error occurred whilst executing GuessLowIntent: ${error}`);
      this.emit(':tell', 'I\'m sorry, something went wrong');
    });
  },

  'PlayGameIntent': function () {
    getPlayer(this.event.context.System.user.userId).then((player) => {
      updatePlayerStatus(player);
      player.gameRounds = 0;
      player.gameWins = 0;
      setupHighLowGame(player);
      var speechOutput = `I have chosen the number ${player.firstNumber}, will the next one be higher or lower?`;
      this.emit(':ask', speechOutput, speechOutput);
    }).catch((error) => {
      console.error(`An error occurred whilst executing PlayGameIntent: ${error}`);
      this.emit(':tell', 'I\'m sorry, something went wrong');
    });
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

  'StatusIntent': function () {
    getPlayer(this.event.context.System.user.userId).then((player) => {
      updatePlayerStatus(player);
      if (player) {
        const speechOutput = `Your pet is feeling ${player.pet.happyStatus} and he is ${player.pet.healthStatus}... 
      Your pet is a ${player.pet.age} year old ${player.pet.stage} and he weighs ${player.pet.weight} pounds...
      You have ${player.credits} credits and ${player.medicinePacks} medicine packs`;
        const reprompt = 'You can say thinks like "feed my pet" or "lets play a game"';

        this.emit(':ask', speechOutput, reprompt);
        return;
      } else {
        this.emit('LaunchRequest');
        return;
      }
    }).catch((error) => {
      console.error(`An error occurred whilst executing StatusIntent: ${error}`);
      this.emit(':tell', 'I\'m sorry, something went wrong');
    });
  },

  'Unhandled': function () {
    console.info('ENTRY Unhandled');
    this.emit(':tell', 'Im sorry but I cant do that');
    console.info('EXIT Unhandled');
    return;
  },

  'AMAZON.HelpIntent': function () {
    const speechOutput = `To keep your pet happy, you should regularly play with them.
    To keep your pet healthy you should regularly clean their litter tray and keep them fed.
    Be sure not to overfeed or overplay with your pet, otherwise it will begin to have the opposite effect!
    When your pet becomes an adult there will be a chance that every time you play they will meet a partner.
    If your pet meets a partner be sure to keep them happy and healthy to increase the chance of offspring.
    Now what would you like to do?`;
    const reprompt = 'Remember - To find out your current pets status you can ask "How\'s my pet?". What would you like to do?\' ';
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
  const alexa = Alexa.handler(event, context, callback);
  alexa.appId = config.get('app.id');
  alexa.registerHandlers(handlers);
  alexa.execute();
};
