'use strict';

function Unhandled() {
  console.info('ENTRY Unhandled');
  this.emit(':tell', 'Im sorry but I cant do that');
  console.info('EXIT Unhandled');
  return;
}

module.exports = {
  Unhandled: Unhandled
};
