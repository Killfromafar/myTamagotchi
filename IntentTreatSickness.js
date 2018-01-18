'use strict';

const helpers = require(__dirname + '/lib/helpers');

function TreatSicknessIntent() {
  helpers.getPlayer(this.event.context.System.user.userId).then((player) => {
    helpers.updatePlayerStatus(player);
    let speechOutput;
    if (player.medPacks <= 0) {
      speechOutput = 'I\'m sorry but you dont have enough medpacks to treat your pets sickness. A medpack costs 2 credits. You can say "buy a med-pack" to get one. What do you want to do next?';
      this.emit(':ask', speechOutput, helpers.GLOBAL_REPROMPT);
      return;
    }
    if (!player.pet.isSick) {
      speechOutput = 'Your pet isnt sick, what would you like to do instead?';
      return;
    } else {
      player.medPacks -= 1;
      player.pet.healthMetric = 5;
      speechOutput = `Your pet has been treated for sickness and he is now healthy again. You now have ${player.medPacks}. What would you like to do next?`;
      helpers.putPlayer(player);
    }
    this.emit(':ask', speechOutput, helpers.GLOBAL_REPROMPT);
  }).catch((error) => {
    console.error(`An error occurred whilst executing GuessLowIntent: ${error}`);
    this.emit(':tell', 'I\'m sorry, something went wrong');
  });
}

module.exports = {
  TreatSicknessIntent: TreatSicknessIntent
};
