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
 * Generates speech from text using OpenAI's TTS with streaming
 * @param {string} text - The text to convert to speech
 * @param {Object} options - Options for the TTS
 * @param {string} [options.voice='alloy'] - Voice to use (alloy, echo, fable, onyx, nova, or shimmer)
 * @param {string} [options.model='tts-1'] - The model to use (tts-1 or tts-1-hd)
 * @param {number} [options.speed=1.0] - Speed of the generated audio (0.25 to 4.0)
 * @param {Function} [onChunk] - Callback for audio chunks
 * @returns {Promise<ArrayBuffer>} The complete audio data as a buffer
 */
const generateSpeech = async (text, options = {}, onChunk) => {
    try {
        // Validate API key before making any API calls
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OpenAI API key is not configured. Please set the OPENAI_API_KEY environment variable.');
        }

        const {
            voice = 'alloy',
            model = 'tts-1',
            speed = 1.0
        } = options;

        const client = getOpenAiClient();
        
        // Track timing for TTS process summary
        const timestamps = {
            requestStart: new Date(),
            firstChunkFromAPI: null,
            chunksFromAPI: [],
            lastChunkSent: null
        };
        
        // Try to use streaming response if available
        let response;
        try {
            // Check if the client supports streaming TTS
            if (client.audio.speech.create && typeof client.audio.speech.create === 'function') {
                response = await client.audio.speech.create({
                    model,
                    voice,
                    input: text,
                    speed: Math.min(Math.max(speed, 0.25), 4.0),
                    response_format: 'mp3',
                    stream: true
                });
            }
        } catch (error) {
            console.log('Streaming not supported, falling back to regular API');
            response = await client.audio.speech.create({
                model,
                voice,
                input: text,
                speed: Math.min(Math.max(speed, 0.25), 4.0),
                response_format: 'mp3'
            });
        }

        console.log('OpenAI TTS response status:', response.status);
        console.log('Response type:', typeof response);
        console.log('Response body type:', response.body ? typeof response.body : 'no body');

        // Check if the response is successful
        if (!response.ok) {
            const errorText = await response.text();
            console.error('OpenAI TTS API error:', response.status, errorText);
            throw new Error(`OpenAI TTS API error: ${response.status} - ${errorText}`);
        }

        // Try to handle as stream if possible
        if (typeof onChunk === 'function' && response.body && typeof response.body.getReader === 'function') {
            console.log('Using true streaming from response body');
            const reader = response.body.getReader();
            const chunks = [];

            try {
                let chunkIndex = 0;
                // Small initial delay to let client audio buffer initialize
                await new Promise(resolve => setTimeout(resolve, 50));

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    chunkIndex++;
                    console.log('Received streaming chunk', chunkIndex, ', size:', value.length);

                    // Track first chunk from API
                    if (!timestamps.firstChunkFromAPI) {
                        timestamps.firstChunkFromAPI = new Date();
                    }

                    // Track specific chunks
                    if (timestamps.chunksFromAPI.length < 3) {
                        timestamps.chunksFromAPI.push({
                            index: chunkIndex,
                            timestamp: new Date(),
                            size: value.length
                        });
                    }

                    chunks.push(value);

                    // Add small delay between chunks to prevent overwhelming client
                    if (chunkIndex > 1) {
                        await new Promise(resolve => setTimeout(resolve, 12));
                    }

                    onChunk(value);
                }

                timestamps.lastChunkSent = new Date();
            } finally {
                reader.releaseLock();
            }

            // Combine all chunks for return value
            const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
            const combinedBuffer = new Uint8Array(totalLength);
            let offset = 0;
            for (const chunk of chunks) {
                combinedBuffer.set(chunk, offset);
                offset += chunk.length;
            }

            console.log('=== TTS PROCESS SUMMARY ===');
            console.log('Request start:', timestamps.requestStart.toISOString());
            console.log('First chunk from API:', timestamps.firstChunkFromAPI?.toISOString() || 'N/A');
            timestamps.chunksFromAPI.forEach((chunk, idx) => {
                console.log(`Chunk ${chunk.index} from API:`, chunk.timestamp.toISOString(), `(size: ${chunk.size} bytes)`);
            });
            console.log('Last chunk sent:', timestamps.lastChunkSent?.toISOString() || 'N/A');
            console.log('Total chunks received:', chunks.length);
            console.log('Total audio size:', totalLength, 'bytes');
            console.log('========================');

            return combinedBuffer.buffer;
        }

        // Fallback to chunked approach
        console.log('Using fallback chunked approach');
        if (typeof onChunk === 'function') {
            const audioBuffer = await response.arrayBuffer();
            const audioArray = new Uint8Array(audioBuffer);

            console.log('Received complete audio buffer, length:', audioArray.length);

            const CHUNK_SIZE = 8192; // 8KB chunks for optimal mobile performance
            const DELAY_MS = 12; // 12ms inter-chunk delay for smooth audio flow

            let chunkIndex = 0;
            // Small initial delay to let client audio buffer initialize
            await new Promise(resolve => setTimeout(resolve, 50));

            for (let offset = 0; offset < audioArray.length; offset += CHUNK_SIZE) {
                const chunk = audioArray.slice(offset, offset + CHUNK_SIZE);
                chunkIndex++;

                // Track first chunk (simulated)
                if (!timestamps.firstChunkFromAPI) {
                    timestamps.firstChunkFromAPI = new Date();
                }

                // Track specific chunks
                if (timestamps.chunksFromAPI.length < 3) {
                    timestamps.chunksFromAPI.push({
                        index: chunkIndex,
                        timestamp: new Date(),
                        size: chunk.length
                    });
                }

                onChunk(chunk.buffer.slice(0));

                if (offset + CHUNK_SIZE < audioArray.length) {
                    await new Promise(resolve => setTimeout(resolve, DELAY_MS));
                }
            }

            timestamps.lastChunkSent = new Date();

            console.log('=== TTS PROCESS SUMMARY ===');
            console.log('Request start:', timestamps.requestStart.toISOString());
            console.log('First chunk from API:', timestamps.firstChunkFromAPI?.toISOString() || 'N/A');
            timestamps.chunksFromAPI.forEach((chunk, idx) => {
                console.log(`Chunk ${chunk.index} from API:`, chunk.timestamp.toISOString(), `(size: ${chunk.size} bytes)`);
            });
            console.log('Last chunk sent:', timestamps.lastChunkSent?.toISOString() || 'N/A');
            console.log('Total chunks sent:', chunkIndex);
            console.log('Total audio size:', audioArray.length, 'bytes');
            console.log('========================');

            return audioBuffer;
        }

        return response.arrayBuffer();
    } catch (error) {
        console.error('Error in generateSpeech:', error);
        // Provide more specific error messages
        if (error.message && error.message.includes('API key')) {
            throw new Error('OpenAI API key is not configured. Please set the OPENAI_API_KEY environment variable.');
        } else if (error.message && error.message.includes('network')) {
            throw new Error('Network error while generating speech. Please check your internet connection.');
        } else if (error.message && error.message.includes('quota')) {
            throw new Error('OpenAI API quota exceeded. Please check your usage limits.');
        } else {
            throw new Error(`OpenAI TTS error: ${error.message || 'Unknown error'}`);
        }
    }
};

export { generateSpeech };
