'use strict';

const helpers = require(__dirname + '/lib/helpers');

function FeedPetIntent() {
  if (this.event.request.dialogState !== 'COMPLETED') {
    this.emit(':delegate');
    return;
  } else {
    helpers.getPlayer(this.event.context.System.user.userId).then((player) => {
      helpers.updatePlayerStatus(player);
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
        helpers.putPlayer(player);
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
}

module.exports = {
  FeedPetIntent: FeedPetIntent
};
