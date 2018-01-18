'use strict';

const helpers = require(__dirname + '/lib/helpers');

function StatusIntent() {
  helpers.getPlayer(this.event.context.System.user.userId).then((player) => {
    helpers.updatePlayerStatus(player);
    if (player) {
      const speechOutput = `Your pet is feeling ${player.pet.happyStatus} and he is ${player.pet.healthStatus}... 
      Your pet is a ${player.pet.age} year old ${player.pet.stage} and he weighs ${player.pet.weight} pounds...
      You have ${player.credits} credits and ${player.medPacks} medicine packs`;
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
}

module.exports = {
  StatusIntent: StatusIntent
};
