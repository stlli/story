// Import all Disney character categories
import { MICKEY_AND_FRIENDS } from './mickey_and_friends.js';
import { LION_KING } from './lion_king.js';
import { FROZEN } from './frozen.js';

// Combine all characters
const ALL_DISNEY_CHARACTERS = [
  ...MICKEY_AND_FRIENDS,
  ...LION_KING,
  ...FROZEN
];

// Export all characters and individual categories
export { 
  MICKEY_AND_FRIENDS,
  LION_KING,
  FROZEN,
  ALL_DISNEY_CHARACTERS 
};
