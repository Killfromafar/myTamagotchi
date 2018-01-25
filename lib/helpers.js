'use strict';

const config = require('config');
const dynamoDBHelper = require(__dirname + '/dynamoDBHelper');

function doHealthUpdate(pet) {
  if (pet.isOverfed) {
    pet.healthMetric -= 0.5;
    pet.isOverfed = false;
  }
  const currentTime = new Date().getTime();
  const lastFedTime = new Date(pet.lastFed).getTime();
  const hoursPassedSinceFed = Math.floor(Math.abs(currentTime - lastFedTime) / 36e5) - 8;
  if (hoursPassedSinceFed > 0) {
    pet.healthMetric -= hoursPassedSinceFed / 2;
  }
  const lastCleanedTime = new Date(pet.lastCleaned).getTime();
  const hoursPassedSinceCleaneed = Math.floor(Math.abs(currentTime - lastCleanedTime) / 36e5) - 8;
  if (hoursPassedSinceCleaneed > 0) {
    pet.healthMetric -= hoursPassedSinceCleaneed / 4;
  }
  const lastSicknessTime = new Date(pet.dateOfSicknessCalcuation).getTime();
  let hoursPassed = Math.floor(Math.abs(currentTime - lastSicknessTime) / 36e5) - 4;
  if (hoursPassed > 0) {
    pet.dateOfSicknessCalcuation = new Date().toISOString();
  }
  while (hoursPassed > 0 && pet.isAlive && pet.healthMetric < 4) {
    hoursPassed -= 1;
    const diceRoll = Math.random();
    if (pet.healthMetric >= 3 && pet.healthMetric < 4) {
      if (diceRoll < 0.1) {
        pet.isSick = true;
        pet.healthMetric -= 0.5;
      }
    } else if (pet.healthMetric >= 2 && pet.healthMetric < 3) {
      if (diceRoll < 0.4) {
        pet.isSick = true;
        pet.healthMetric -= 0.5;
      }
    } else if (pet.healthMetric > 0 && pet.healthMetric < 2) {
      if (diceRoll < 0.7) {
        pet.isSick = true;
        pet.healthMetric -= 0.5;
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
    pet.happyMetric -= 0.5;
  }
  if (pet.isOverPlayed) {
    pet.happyMetric -= 1;
  }
  const currentTime = new Date().getTime();
  const lastPlayTime = new Date(pet.lastPlayedWith).getTime();
  const hoursPassedSinceFed = Math.floor(Math.abs(currentTime - lastPlayTime) / 36e5) - 8;
  if (hoursPassedSinceFed > 0) {
    pet.happyMetric -= hoursPassedSinceFed / 2;
  }
  const lastCleanedTime = new Date(pet.lastCleaned).getTime();
  const hoursPassedSinceCleaneed = Math.floor(Math.abs(currentTime - lastCleanedTime) / 36e5) - 8;
  if (hoursPassedSinceCleaneed > 0) {
    pet.happyMetric -= hoursPassedSinceCleaneed / 4;
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

module.exports = {
  updatePlayerStatus: updatePlayerStatus,
  putPlayer: putPlayer,
  getPlayer: getPlayer,
  GLOBAL_REPROMPT: 'Remember - To find out your current pets status you can ask "How\'s my pet?". What would you like to do?\' '
};
