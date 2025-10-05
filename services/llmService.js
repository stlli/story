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
    // KEEP: test data.
    // return {
    //     "story": "In the heart of the Enchanted Forest lived Finn the Fox, a mischievous hero on a quest to find the lost City of Whispers. Guided by Luna the Owl, the mystical mentor, Finn embarked on an adventure filled with magic and mystery. Along the way, they were joined by Sparky, a loyal sidekick, who was reactivated by an inventor and eager to prove his worth. Together, the trio ventured through the Starlit Grove, where ancient trees whispered secrets of forgotten realms. As they journeyed, Finn's imagination soared, painting vivid pictures of fantasy realms in his mind. Luna's wisdom and Sparky's unwavering loyalty helped Finn navigate challenges and obstacles with courage and wit. In the end, they discovered that the City of Whispers was not just a place but a symbol of belief in the power of imagination. With newfound knowledge and friendship, they returned home, their hearts brimming with wonder and joy.",
    //     "memories": {
    //       "Finn the Fox": "Finn remembered the moment he found the ancient map, feeling a surge of excitement and curiosity that sparked his adventurous spirit.",
    //       "Luna the Owl": "Luna cherished the memory of watching Finn's imagination bloom, seeing the potential for greatness within him as he embraced the magic of the world around him."
    //     }
    //   };
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
