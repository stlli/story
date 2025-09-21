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
 * Generates speech from text using OpenAI's TTS
 * @param {string} text - The text to convert to speech
 * @param {Object} options - Options for the TTS
 * @param {string} [options.voice='alloy'] - Voice to use (alloy, echo, fable, onyx, nova, or shimmer)
 * @param {string} [options.model='tts-1'] - The model to use (tts-1 or tts-1-hd)
 * @param {number} [options.speed=1.0] - Speed of the generated audio (0.25 to 4.0)
 * @returns {Promise<Buffer>} The audio data as a buffer
 */
const generateSpeech = async (text, options = {}) => {
    try {
        const {
            voice = 'alloy',
            model = 'tts-1',
            speed = 1.0
        } = options;

        const client = getOpenAiClient();
        
        const response = await client.audio.speech.create({
            model,
            voice,
            input: text,
            speed: Math.min(Math.max(speed, 0.25), 4.0) // Ensure speed is within valid range
        });

        return await response.arrayBuffer();
    } catch (error) {
        console.error('Error in generateSpeech:', error);
        throw error;
    }
};

export { generateSpeech };
