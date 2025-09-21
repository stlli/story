import { generateStory } from './gemmaService.js';
import { generateStoryWithOpenAi } from './openAiService.js';

/**
 * Generates a story using either the local Gemma model or OpenAI
 * @param {string} prompt - The user's prompt for the story
 * @param {number} age - The age of the target audience
 * @param {number} [temperature=0.7] - Controls randomness (0-1)
 * @param {number} [maxLength=1000] - Maximum length of the generated text
 * @returns {Promise<string>} The generated story content
 */
const generateStoryFromPrompt = async (prompt, age, temperature = 0.7, maxLength = 1000) => {
    try {
        const useOpenAI = process.env.NODE_ENV === 'production';
        const systemMessage = `You are a creative children's story writer. Create an engaging story for ${age}-year-olds based on the following details.`;
        
        if (useOpenAI) {
            return await generateStoryWithOpenAi(prompt, systemMessage, temperature, maxLength);
        } else {
            return await generateStory(prompt, systemMessage, maxLength);
        }
    } catch (error) {
        console.error('Error in generateStoryFromPrompt:', error);
        // Fallback to returning the prompt if generation fails
        return prompt;
    }
};

export { generateStoryFromPrompt };
