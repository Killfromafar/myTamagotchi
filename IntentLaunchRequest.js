'use strict';

const helpers = require(__dirname + '/lib/helpers');

function LaunchRequest() {
  helpers.getPlayer(this.event.context.System.user.userId).then((player) => {
    helpers.updatePlayerStatus(player);
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
}

module.exports = {
  LaunchRequest: LaunchRequest
};
