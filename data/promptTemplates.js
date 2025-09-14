/**
 * Story prompt template for generating age-appropriate stories
 * @param {string} title - The main topic or title of the story
 * @param {string} characterDescriptions - Formatted list of characters
 * @param {string} topicName - The main topic name for educational content
 * @param {number} age - The age of the target audience
 * @param {number} minLength - Minimum length of the story
 * @param {number} maxLength - Maximum length of the story
 * @returns {string} Formatted story prompt
 */
function generateStoryPrompt(title, characterDescriptions, topicName, age, minLength, maxLength) {
    const ageDescription = age === 8 ? '8-year-old' : `${age}-year-old`;

    return `Create a fun, educational, and age-appropriate complete story specifically designed for ${ageDescription} children about "${title}" featuring these characters:

Characters:
- ${characterDescriptions}

Story Guidelines (${ageDescription} audience):
1. Keep it engaging and fun.
2. Use age-appropriate language and concepts.
3. Include a positive moral or lesson.
4. Keep it between ${minLength}-${maxLength} words.
5. Make it educational by including fun facts about ${topicName.toLowerCase()}.
6. Ensure all content is completely child-appropriate (G-rated, no scary or mature themes).
7. End with a happy and satisfying conclusion.
8. Use simple sentence structures and vocabulary appropriate for ${ageDescription}s.
9. Include some fun, age-appropriate humor.
10. Create a story in the style of Dragon Love Taco.
11. Give enough context for the story to be self-contained.

Start the story with an attention-grabbing opening and make sure to include all the characters in meaningful ways.`;
}

/**
 * Generates a Pokémon flight battle story with dynamic character integration
 * @param {string} title - The main topic or title of the story
 * @param {string} characterDescriptions - Formatted list of characters
 * @param {string} topicName - The main topic name for educational content
 * @param {number} age - The age of the target audience
 * @param {number} minLength - Minimum length of the story
 * @param {number} maxLength - Maximum length of the story
 * @returns {string} Formatted Pokémon flight battle story prompt
 */
function generatePokemonFlightStory(title, characterDescriptions, topicName, age, minLength, maxLength) {
    // Ensure all parameters have valid defaults
    title = title || 'Pokémon Adventure';
    characterDescriptions = characterDescriptions || 'a brave Pokémon trainer and their Pokémon';
    topicName = topicName ? String(topicName) : 'Pokémon battles';
    age = Number(age) || 8;
    minLength = Number(minLength) || 300;
    maxLength = Number(maxLength) || 500;
    
    const ageDescription = age === 8 ? '8-year-old' : `${age}-year-old`;
    return `Create an immersive Pokémon flight battle story for ${ageDescription} children about "${title}" featuring these Pokémon:

Characters:
- ${characterDescriptions}

Story Guidelines (${ageDescription} audience):
1. Keep it engaging and fun for young Pokémon fans.
2. Use age-appropriate language and concepts.
3. Include a positive message about teamwork and determination.
4. Keep it between ${minLength}-${maxLength} words.
5. Make it educational by including fun facts about ${topicName.toLowerCase()}.
6. Ensure all content is completely child-appropriate (G-rated).
7. End with a satisfying conclusion that resolves the battle.
8. Use simple sentence structures and vocabulary appropriate for ${ageDescription}s.

Aerial Combat Focus:

1. Aerial Combat Focus:
   - Emphasize three-dimensional movement and positioning
   - Describe aerial maneuvers like barrel rolls, dives, and climbs
   - Include environmental factors like wind currents and weather
   - Highlight the unique flight capabilities of each Pokémon

2. Character Development:
   - Show the bond between trainer and Pokémon
   - Include character growth through the battle
   - Depict strategic thinking and quick decision-making
   - Show emotional stakes and personal motivations

3. Battle Dynamics:
   - Use type advantages creatively
   - Include combo moves and team strategies
   - Show the physical toll of high-speed maneuvers
   - Depict the ebb and flow of battle momentum

4. Story Elements:
   - Create a clear objective for the battle
   - Include a moment of crisis and comeback
   - Show the consequences of the battle's outcome
   - End with a meaningful resolution

5. Writing Style:
   - Use vivid, dynamic descriptions
   - Vary sentence structure for pacing
   - Include sensory details (wind, sounds, etc.)
   - Keep the action clear and easy to follow

6. Technical Details:
   - Include 2-3 key battle moments
   - Show the unique personalities of each Pokémon

Create an engaging narrative that makes the reader feel the excitement and tension of high-flying Pokémon battles while staying true to the spirit of the Pokémon world.`;
}

module.exports = {
    generateStoryPrompt,
    generatePokemonFlightStory
};
