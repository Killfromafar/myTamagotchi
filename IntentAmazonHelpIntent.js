'use strict';

function HelpIntent() {
  const speechOutput = `To keep your pet happy, you should regularly play with them.
    To keep your pet healthy you should regularly clean their litter tray and keep them fed.
    Be sure not to overfeed or overplay with your pet, otherwise it will begin to have the opposite effect!
    When your pet becomes an adult there will be a chance that every time you play they will meet a partner.
    If your pet meets a partner be sure to keep them happy and healthy to increase the chance of offspring.
    Now what would you like to do?`;
  const reprompt = 'Remember - To find out your current pets status you can ask "How\'s my pet?". What would you like to do?\' ';
  this.emit(':ask', speechOutput, reprompt);
}

module.exports = {
  ['AMAZON.HelpIntent']: HelpIntent
};
