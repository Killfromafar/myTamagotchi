'use strict';

function StopIntent() {
  this.emit(':tell', 'Goodbye');
}

module.exports = {
  ['AMAZON.StopIntent']: StopIntent
};
