'use strict';

const helpers = require(__dirname + '/lib/helpers');

function CleanPetIntent() {
  helpers.getPlayer(this.event.context.System.user.userId).then((player) => {
    helpers.updatePlayerStatus(player);
    let speechOutput;
    if (player.pet.isDirty) {
      player.pet.isDirty = false;
      player.pet.lastCleaned = new Date().getTime();
      player.credits -= 1;
      speechOutput = 'Your pets litter tray has been emptied and and sparkling clean. What do you want to do next?';
    } else {
      speechOutput = 'Your pet isnt dirty at the moment there is nothing to clean! What would you like to do instead?';
    }
    helpers.putPlayer(player);
    this.emit(':ask', speechOutput, helpers.GLOBAL_REPROMPT);
    return;
  }).catch((error) => {
    console.error(`An error occurred whilst executing GuessLowIntent: ${error}`);
    this.emit(':tell', 'I\'m sorry, something went wrong');
  });
}
module.exports = {
  CleanPetIntent: CleanPetIntent
};
