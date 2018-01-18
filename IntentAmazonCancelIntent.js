'use strict';

function CancelIntent() {
  this.emit(':tell', 'Goodbye');
}

module.exports = {
  ['AMAZON.CancelIntent']: CancelIntent
};
