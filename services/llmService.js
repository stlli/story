const OpenAI = require('openai');

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

/**
 * Generates a story using the OpenAI API based on a user prompt
 * @param {string} prompt - The user's prompt for the story
 * @param {number} age - The age of the target audience
 * @param {number} [temperature=0.7] - Controls randomness (0-1)
 * @param {number} [maxTokens=1000] - Maximum number of tokens to generate
 * @returns {Promise<string>} The generated story content
 */
const generateStoryFromPrompt = async (prompt, age, temperature = 0.7, maxTokens = 1000) => {
    try {
        const systemMessage = `You are a creative children's story writer. Create an engaging story for ${age}-year-olds based on the following details.`;

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
        console.error('Error in generateStoryFromPrompt:', error);
        throw error; // Re-throw to allow callers to handle the error
    }
};

module.exports = {
    generateStoryFromPrompt
};
