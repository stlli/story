const { generateStory } = require('./gemmaService');

/**
 * Generates a story using the local Gemma model
 * @param {string} prompt - The user's prompt for the story
 * @param {number} age - The age of the target audience
 * @param {number} [temperature=0.7] - Controls randomness (0-1)
 * @param {number} [maxLength=1000] - Maximum length of the generated text
 * @returns {Promise<string>} The generated story content
 */
const generateStoryFromPrompt = async (prompt, age, temperature = 0.7, maxLength = 1000) => {
    try {
        // Delegate to the Gemma service
        return await generateStory(prompt, age, maxLength);
    } catch (error) {
        console.error('Error in generateStoryFromPrompt:', error);
        // Fallback to returning the prompt if generation fails
        return prompt;
    }
};

module.exports = {
    generateStoryFromPrompt
};
