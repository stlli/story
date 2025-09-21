import { pipeline, env, AutoTokenizer } from '@huggingface/transformers';

// Configure the environment to use CPU and disable local files
env.allowLocalModels = false;

// Using a smaller model that works well in the browser/Node.js
const MODEL_ID = 'onnx-community/Llama-3.2-1B-Instruct-q4f16';

// Initialize the generator and tokenizer outside the function to cache them
let generator = null;
let tokenizer = null;

/**
 * Generates a story using a local model
 * @param {string} prompt - The user's prompt for the story
 * @param {string} systemMessage - The system message for the story
 * @param {number} [maxLength=500] - Maximum length of the generated text
 * @returns {Promise<string>} The generated story content
 */
const generateStory = async (prompt, systemMessage, maxLength = 5000) => {
    try {
        return prompt;
        // // Initialize generator only once
        // const generator = await pipeline('text-generation', MODEL_ID);
        
        // // Combine system message and prompt
        // const fullPrompt = systemMessage ? `${systemMessage}\n\n${prompt}` : prompt;
        
        // // Generate the response
        // const result = await generator(fullPrompt, { max_length: maxLength });
        
        // return result[0].generated_text;
    } catch (error) {
        console.error('Error generating story with model:', error);
        return `I'm sorry, but I couldn't generate a story right now. Error: ${error.message}`;
    }
};

export { generateStory };