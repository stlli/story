const { pipeline } = require('@xenova/transformers');

// Initialize the text generation pipeline
let generator = null;

/**
 * Initializes the Gemma model
 */
const initializeModel = async () => {
    if (!generator) {
        console.log('Loading Gemma 2B model...');
        generator = await pipeline('text-generation', 'google/gemma-2b', {
            quantized: true,  // Use quantized version for better performance
            device: 'cpu'    // Use 'cuda' if you have a GPU
        });
        console.log('Gemma 2B model loaded');
    }
};

/**
 * Generates a story using the Gemma model
 * @param {string} prompt - The user's prompt for the story
 * @param {number} age - The age of the target audience
 * @param {number} [maxLength=500] - Maximum length of the generated text
 * @returns {Promise<string>} The generated story content
 */
const generateStory = async (prompt, age, maxLength = 500) => {
    try {
        // Initialize model if not already loaded
        if (!generator) {
            await initializeModel();
        }

        // Create system message
        const systemMessage = `You are a creative children's story writer. Create an engaging story for ${age}-year-olds based on the following details.\n\n`;
        const fullPrompt = systemMessage + prompt;

        // Generate text
        const result = await generator(fullPrompt, {
            max_length: maxLength,
            temperature: 0.7,
            do_sample: true,
            top_p: 0.9,
            no_repeat_ngram_size: 3,
        });

        // Extract and clean up the generated text
        let story = result[0]?.generated_text || 'Could not generate story at this time.';
        
        // Remove the prompt from the beginning of the response
        if (story.startsWith(fullPrompt)) {
            story = story.slice(fullPrompt.length).trim();
        }

        return story;
    } catch (error) {
        console.error('Error generating story with Gemma:', error);
        throw error;
    }
};

module.exports = {
    generateStory,
    initializeModel
};
