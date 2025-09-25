import { generateStory } from './gemmaService.js';
import { generateStoryWithOpenAi } from './openAiService.js';

/**
 * Generates a story using either the local Gemma model or OpenAI
 * @param {string} prompt - The user's prompt for the story
 * @param {number} age - The age of the target audience
 * @param {number} [temperature=0.7] - Controls randomness (0-1)
 * @param {number} [maxLength=1000] - Maximum length of the generated text
 * @param {boolean} [forceOpenAI=false] - Force using OpenAI even in development
 * @returns {Promise<string>} The generated story content
 */
const generateStoryFromPrompt = async (prompt, age, temperature = 0.7, maxLength = 1000, forceOpenAI = false) => {
    try {
        const useOpenAI = forceOpenAI || process.env.NODE_ENV === 'production';
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

/**
 * Generates a story with streaming support using either the local Gemma model or OpenAI
 * @param {string} prompt - The user's prompt for the story
 * @param {number} age - The age of the target audience
 * @param {function} onChunk - Callback function that receives chunks of text as they're generated
 * @param {number} [temperature=0.7] - Controls randomness (0-1)
 * @param {number} [maxLength=1000] - Maximum length of the generated text
 * @param {boolean} [forceOpenAI=false] - Force using OpenAI even in development
 * @returns {Promise<string>} The complete generated story content
 */
const generateStreamingStory = async (prompt, age, onChunk, temperature = 0.7, maxLength = 1000, forceOpenAI = false) => {
    try {
        const useOpenAI = forceOpenAI || process.env.NODE_ENV === 'production';
        const systemMessage = `You are a creative children's story writer. Create an engaging story for ${age}-year-olds based on the following details.`;
        
        if (useOpenAI) {
            return await generateStoryWithOpenAi(prompt, systemMessage, temperature, maxLength, onChunk);
        } else {
            // For local Gemma, we'll simulate streaming by breaking the response into words
            const fullText = await generateStory(prompt, systemMessage, maxLength);
            // onChunk(fullText);
            // const words = fullText.split(/(\s+)/);
            // let currentText = '';
            
            // for (const word of words) {
            //     currentText += word;
            //     onChunk(word);
            //     // Add a small delay to simulate streaming
            //     await new Promise(resolve => setTimeout(resolve, 20));
            // }
            return fullText;
        }
    } catch (error) {
        console.error('Error in generateStreamingStory:', error);
        onChunk('Error generating story. Please try again.');
        throw error;
    }
};

export { generateStoryFromPrompt, generateStreamingStory };
