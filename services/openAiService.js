import OpenAI from 'openai';

let openai;

const getOpenAiClient = () => {
    if (!openai) {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY is not set. Please add it to your environment variables.');
        }
        openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    return openai;
};

/**
 * Internal function to create chat completion with optional streaming
 * @private
 */
const createChatCompletion = async (prompt, systemMessage, temperature, maxTokens, stream = false) => {
    const client = getOpenAiClient();
    return await client.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
            { role: "system", content: systemMessage },
            { role: "user", content: prompt }
        ],
        temperature,
        max_tokens: maxTokens,
        stream
    });
};

/**
 * Generates a story using the OpenAI model with streaming support
 * @param {string} prompt - The user's prompt for the story
 * @param {string} systemMessage - The system message to guide the model
 * @param {number} [temperature=0.7] - Controls randomness (0-1)
 * @param {number} [maxTokens=1000] - Maximum number of tokens in the generated text
 * @param {function} [onChunk] - Callback function that receives chunks of text as they're generated
 * @returns {Promise<string>} The generated story content
 */
const generateStoryWithOpenAi = async (prompt, systemMessage, temperature = 0.7, maxTokens = 1000, onChunk = null) => {
    try {
        if (onChunk) {
            // Streaming mode
            const stream = await createChatCompletion(prompt, systemMessage, temperature, maxTokens, true);
            let fullResponse = '';
            
            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || '';
                if (content) {
                    console.log('Received chunk:', content);
                    fullResponse += content;
                    onChunk(content);
                }
            }
            return fullResponse;
        } else {
            // Non-streaming mode (original behavior)
            const response = await createChatCompletion(prompt, systemMessage, temperature, maxTokens, false);
            return response.choices[0]?.message?.content || 'Could not generate story at this time.';
        }
    } catch (error) {
        console.error('Error in generateStoryWithOpenAi:', error);
        throw error;
    }
};

export { generateStoryWithOpenAi };
