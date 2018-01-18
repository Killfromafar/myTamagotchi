'use strict';

const helpers = require(__dirname + '/lib/helpers');

function BuyMedpackIntent() {
  helpers.getPlayer(this.event.context.System.user.userId).then((player) => {
    helpers.updatePlayerStatus(player);
    let speechOutput;
    if (player.credits < 2) {
      speechOutput = 'I\'m sorry but you dont have enough credits to buy a med-pack. Try playing a game with your pet to earn credits, What do you want to do next?';
    } else {
      player.credits -= 2;
      player.medPacks += 1;
      helpers.putPlayer(player);
      speechOutput = `You have bought a med-pack. You now have ${player.medPacks} med-packs and ${player.credits} credits`;
    }
    this.emit(':ask', speechOutput, helpers.GLOBAL_REPROMPT);
  }).catch((error) => {
    console.error(`An error occurred whilst executing GuessLowIntent: ${error}`);
    this.emit(':tell', 'I\'m sorry, something went wrong');
  });
}

module.exports = {
  BuyMedpackIntent: BuyMedpackIntent
};
