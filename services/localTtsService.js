import { pipeline } from '@xenova/transformers';

let synthesizer = null;

/**
 * Initializes the TTS model
 */
const initializeModel = async () => {
    if (!synthesizer) {
        console.log('Loading TTS model...');
        // Using a small, open model that doesn't require authentication
        synthesizer = await pipeline(
            'text-to-speech',
            'facebook/mms-tts-eng',  // A small, open model
            {
                quantized: true,
                progress_callback: (progress) => {
                    const percent = progress.loaded && progress.total 
                        ? Math.round(progress.loaded / progress.total * 100)
                        : 0;
                    console.log(`Download progress: ${percent}%`);
                }
            }
        );
        console.log('TTS model loaded');
    }
    return synthesizer;
};

/**
 * Generates speech from text using a local TTS model
 * @param {string} text - The text to convert to speech
 * @param {Object} options - Options for the TTS
 * @param {number} [options.speed=1.0] - Speed of the generated audio (0.5 to 2.0)
 * @returns {Promise<ArrayBuffer>} The audio data as an ArrayBuffer
 */
const generateSpeech = async (text, options = {}) => {
    try {
        const { speed = 1.0 } = options;
        
        // Initialize the model if not already done
        const model = await initializeModel();
        
        // Generate speech with the model
        const output = await model(text, {
            speaker_embeddings: 'default',  // Use default voice
            speed: Math.min(Math.max(speed, 0.5), 2.0)  // Clamp speed between 0.5 and 2.0
        });
        
        // The model returns audio in the correct format
        return output.audio;
        
    } catch (error) {
        console.error('Error in local TTS:', error);
        throw error;
    }
};

export { generateSpeech };
