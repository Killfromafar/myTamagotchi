'use strict';

const helpers = require(__dirname + '/lib/helpers');

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
  helpers.putPlayer(player);
}

function GuessHighIntent() {
  helpers.getPlayer(this.event.context.System.user.userId).then((player) => {
    let speechOutput;
    let reprompt;
    let secondNumber;
    if (!player.gameInProgress) {
      speechOutput = 'Remember - To find out your current pets status you can ask "How\'s my pet?". What would you like to do?\' ';
      this.emit(':ask', speechOutput, speechOutput);
      return;
    }
    helpers.updatePlayerStatus(player);
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
        helpers.putPlayer(player);
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
        helpers.putPlayer(player);
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
      helpers.putPlayer(player);
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
}

function GuessLowIntent() {
  helpers.getPlayer(this.event.context.System.user.userId).then((player) => {
    let speechOutput;
    let reprompt;
    let secondNumber;
    if (!player.gameInProgress) {
      speechOutput = 'Remember - To find out your current pets status you can ask "How\'s my pet?". What would you like to do?\' ';
      this.emit(':ask', speechOutput, speechOutput);
      return;
    }
    helpers.updatePlayerStatus(player);
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
        helpers.putPlayer(player);
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
        helpers.putPlayer(player);
        speechOutput = 'Unfortunatley you have lost this time. However, your pet is now happier. What would you like to do next?';
        reprompt = 'Remember - To find out your current pets status you can ask "How\'s my pet?". What would you like to do?\' ';
        this.emit(':ask', speechOutput, reprompt);
        return;
      }
      helpers.setupHighLowGame(player);
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
      helpers.putPlayer(player);
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
}

function PlayGameIntent() {
  helpers.getPlayer(this.event.context.System.user.userId).then((player) => {
    helpers.updatePlayerStatus(player);
    player.gameRounds = 0;
    player.gameWins = 0;
    setupHighLowGame(player);
    var speechOutput = `I have chosen the number ${player.firstNumber}, will the next one be higher or lower?`;
    this.emit(':ask', speechOutput, speechOutput);
  }).catch((error) => {
    console.error(`An error occurred whilst executing PlayGameIntent: ${error}`);
    this.emit(':tell', 'I\'m sorry, something went wrong');
  });
}

module.exports = {
  GuessHighIntent: GuessHighIntent,
  GuessLowIntent: GuessLowIntent,
  PlayGameIntent: PlayGameIntent
};
