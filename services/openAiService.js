import OpenAI from 'openai';

// Initialize OpenAI client
if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set. Please add it to your environment variables.');
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generates a story using the OpenAI model
 * @param {string} prompt - The user's prompt for the story
 * @param {string} systemMessage - The system message to guide the model
 * @param {number} [temperature=0.7] - Controls randomness (0-1)
 * @param {number} [maxTokens=1000] - Maximum number of tokens in the generated text
 * @returns {Promise<string>} The generated story content
 */
const generateStoryWithOpenAi = async (prompt, systemMessage, temperature = 0.7, maxTokens = 1000) => {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: systemMessage },
                { role: "user", content: prompt }
            ],
            temperature,
            max_tokens: maxTokens
        });

        return response.choices[0]?.message?.content || 'Could not generate story at this time.';
    } catch (error) {
        console.error('Error in generateStoryWithOpenAi:', error);
        throw error; // Re-throw to allow error handling in the calling function
    }
};

export { generateStoryWithOpenAi };
