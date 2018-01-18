'use strict';

const helpers = require(__dirname + '/lib/helpers');

function CreateNewPetIntent() {
  const intentObj = this.event.request.intent;
  if (intentObj.confirmationStatus === 'CONFIRMED') {
    helpers.getPlayer(this.event.context.System.user.userId).then((existingPlayer) => {
      helpers.updatePlayerStatus(existingPlayer);
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
        helpers.putPlayer(player);
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
        helpers.putPlayer(existingPlayer);
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
}

module.exports = {
  CreateNewPetIntent: CreateNewPetIntent
};
