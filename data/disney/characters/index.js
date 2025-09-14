// Import all Disney character categories
const { MICKEY_AND_FRIENDS } = require('./mickey_and_friends');
const { LION_KING } = require('./lion_king');
const { FROZEN } = require('./frozen');

// Combine all characters
const ALL_DISNEY_CHARACTERS = [
  ...MICKEY_AND_FRIENDS,
  ...LION_KING,
  ...FROZEN
];

// Export all characters and individual categories
module.exports = {
  MICKEY_AND_FRIENDS,
  LION_KING,
  FROZEN,
  ALL_DISNEY_CHARACTERS
};
