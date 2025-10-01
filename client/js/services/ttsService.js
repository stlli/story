class TTSService {
    constructor() {
        this.isSpeaking = false;
        this.isPaused = false;
        this.currentUtterance = null;
        this.audio = new Audio();
        this.charIndex = 0;
        this.fullText = '';
        this.lastWordTime = Date.now();
        this.speechSynthesis = window.speechSynthesis;
        this.onStateChange = null;
        
        // TTS engine configuration
        this.availableEngines = ['browser', 'kokoro', 'openai'];
        this.currentEngine = 'browser'; // Default to browser TTS
        this.useOpenAITTS = false; // Legacy flag for backward compatibility
        
        this._initEnvironment();
        
        // Handle audio end events
        this.audio.onended = () => {
            this.isSpeaking = false;
            this._updateState('ended');
        };
        
        this.audio.onerror = (error) => {
            console.error('TTS Audio Error:', error);
            this.isSpeaking = false;
            this._updateState('error', { error: 'Audio playback failed' });
            // Fall back to browser TTS if the selected engine fails
            if (this.currentEngine !== 'browser') {
                console.log(`Falling back to browser TTS`);
                const text = this.fullText;
                this.currentEngine = 'browser';
                this.speak(text, this.onStateChange);
            }
        };
    }

    // Set the TTS engine to use
    setEngine(engine) {
        if (this.availableEngines.includes(engine)) {
            this.currentEngine = engine;
            this.useOpenAITTS = (engine === 'openai');
            console.log(`TTS Service: Engine set to ${engine}`);
            return true;
        }
        console.warn(`TTS Service: Unsupported engine '${engine}'. Available engines:`, this.availableEngines);
        return false;
    }
    
    // Get the current TTS engine
    getEngine() {
        return this.currentEngine;
    }
    
    // Get list of available engines
    getAvailableEngines() {
        return [...this.availableEngines];
    }

    // Initialize the environment
    async _initEnvironment() {
        try {
            // Check for TTS engine URL parameter first
            const urlParams = new URLSearchParams(window.location.search);
            const ttsEngine = urlParams.get('ttsEngine');
            
            if (ttsEngine && this.availableEngines.includes(ttsEngine)) {
                this.setEngine(ttsEngine);
                console.log(`TTS Service: Engine set to ${ttsEngine} (from URL parameter)`);
                return;
            }
            
            // Fall back to legacy forceOpenAITTS parameter for backward compatibility
            const forceOpenAITTS = urlParams.get('forceOpenAITTS');
            if (forceOpenAITTS !== null) {
                this.setEngine(forceOpenAITTS === 'true' ? 'openai' : 'browser');
                console.log('TTS Service: Using legacy forceOpenAITTS parameter');
                return;
            }
            
            // Get the environment from the server if no URL parameter is provided
            try {
                const response = await fetch('/api/environment');
                if (response.ok) {
                    const data = await response.json();
                    this.setEngine(data.environment === 'production' ? 'openai' : 'browser');
                    console.log(`TTS Service: Using ${this.currentEngine} (based on environment)`);
                }
            } catch (error) {
                console.warn('Could not fetch environment from server, using browser TTS', error);
                this.setEngine('browser');
            }
        } catch (error) {
            console.warn('Error initializing TTS environment, using browser TTS', error);
            this.setEngine('browser');
        }
    }
    
    // Set TTS mode explicitly
    setForceOpenAITTS(force) {
        this.useOpenAITTS = force === true;
        console.log(`TTS Service: ${this.useOpenAITTS ? 'Forcing OpenAI TTS' : 'Using default TTS selection'}`);
    }

    // Initialize the TTS service
    init() {
        // Any initialization code can go here
        this._initEnvironment().catch(console.error);
    }
    // Speak the provided text
    async speak(text, options = {}) {
        if (this.isSpeaking) {
            this.stop();
            // Small delay to ensure the stop is processed
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Update the current engine if specified in options
        if (options.engine && this.availableEngines.includes(options.engine)) {
            this.setEngine(options.engine);
        }

        this.charIndex = 0;
        this.fullText = text;
        this.onStateChange = options.onStateChange || this.onStateChange;

<<<<<<< HEAD
        try {
            // Determine which TTS engine to use
            switch (this.currentEngine) {
                case 'kokoro':
                    await this._speakWithKokoro(text);
                    break;
                case 'openai':
                    await this._speakWithOpenAI(text);
                    break;
                case 'browser':
                default:
                    this._speakWithBrowser(text);
                    break;
            }
        } catch (error) {
            console.error(`Error with ${this.currentEngine} TTS:`, error);
            this.isSpeaking = false;
            this._updateState('error', { error: error.message });
            throw error;
=======
        if (this.useOpenAITTS) {
            // Check for mobile devices and use simpler approach to prevent frame drops
            await this._speakWithOpenAI(text);
        } else {
            this._speakWithBrowser(text);
>>>>>>> fix/tts-service
        }
    }

    // Use Kokoro TTS
    async _speakWithKokoro(text) {
        try {
            this.isSpeaking = true;
            this.fullText = text;
            this._updateState('speaking');
            
            const response = await fetch('/api/generate-speech', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text,
                    speed: 1.0,
                    engine: 'kokoro'  // Specify to use Kokoro TTS
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, ${errorText}`);
            }

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            
            // Play the audio
            this.audio.src = audioUrl;
            await this.audio.play();
            
            // Update state when audio ends
            this.audio.onended = () => {
                this.isSpeaking = false;
                this._updateState('ended');
            };
            
        } catch (error) {
            console.error('Error with Kokoro TTS:', error);
            this.isSpeaking = false;
            this._updateState('error', { error: error.message });
            
            // Fall back to browser TTS if Kokoro TTS fails
            if (this.currentEngine === 'kokoro') {
                console.log('Falling back to browser TTS');
                this.currentEngine = 'browser';
                await this.speak(text);
            } else {
                throw error;
            }
        }
    }

    // Use OpenAI TTS
    async _speakWithOpenAI(text) {
        try {
            this.isSpeaking = true;
            this.fullText = text;
            this._updateState('speaking');
<<<<<<< HEAD
            
            const response = await fetch('/api/generate-speech', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text,
                    speed: 1.0,
                    engine: 'openai'
                })
=======

            const mediaSource = new MediaSource();
            const audioUrl = URL.createObjectURL(mediaSource);
            this.audio.src = audioUrl;

            const MIN_BUFFER_TIME = 1.0; // Increased from 0.5s for more stable playback
            const INITIAL_BUFFER_TIME = 3.0; // Increased from 0.3s for more initial buffering

            let sourceBuffer = null;
            let isBufferReady = false;
            let chunkQueue = [];
            let isPlaying = false;
            let bufferMonitor = null;

            // Handle MediaSource events
            mediaSource.addEventListener('sourceopen', () => {
                console.log('MediaSource opened, creating source buffer...');
                try {
                    sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg');
                    isBufferReady = true;

                    // Process any queued chunks immediately
                    processChunkQueue();

                    // Start playing when we have the first chunk
                    if (chunkQueue.length > 0) {
                        // Wait a bit for chunks to be processed, then start playback
                        setTimeout(() => {
                            if (sourceBuffer && sourceBuffer.buffered.length > 0) {
                                startPlayback();
                            }
                        }, 50); // Reduced from 100ms for faster startup
                    }
                } catch (error) {
                    console.error('Error creating source buffer:', error);
                    this._updateState('error', { error: 'Failed to create audio buffer' });
                }
>>>>>>> fix/tts-service
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, ${errorText}`);
            }

<<<<<<< HEAD
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            
            // Play the audio
            this.audio.src = audioUrl;
            await this.audio.play();
=======
                // Process chunks very conservatively for mobile devices
                const maxChunksToProcess = 1; // Process only 1 chunk at a time, always

                for (let i = 0; i < maxChunksToProcess && chunkQueue.length > 0; i++) {
                    const chunk = chunkQueue.shift();
                    try {
                        console.log('Processing queued chunk, size:', chunk.length);
                        sourceBuffer.appendBuffer(chunk);
                        break; // Process one chunk at a time to avoid blocking
                    } catch (error) {
                        console.error('Error appending queued chunk:', error);
                        // Put the chunk back in the queue
                        chunkQueue.unshift(chunk);
                        break;
                    }
                }

                // Schedule next processing with optimized timing
                if (chunkQueue.length > 0) {
                    const delay = chunkQueue.length > 3 ? 8 : 12; // 12ms delay between chunks
                    setTimeout(processChunkQueue, delay);
                }
            };

            // Start audio playback with buffer check
            const startPlayback = () => {
                if (isPlaying) return;

                // Check if we have enough buffered audio
                if (sourceBuffer && sourceBuffer.buffered.length > 0) {
                    const buffered = sourceBuffer.buffered;
                    const currentTime = this.audio.currentTime;
                    const bufferedEnd = buffered.end(buffered.length - 1);
                    const bufferRemaining = bufferedEnd - currentTime;

                    console.log('Buffer check:', {
                        bufferedEnd: bufferedEnd.toFixed(3),
                        currentTime: currentTime.toFixed(3),
                        bufferRemaining: bufferRemaining.toFixed(3),
                        required: MIN_BUFFER_TIME
                    });

                    // Use INITIAL_BUFFER_TIME for the first buffer check
                    const requiredBuffer = isPlaying ? MIN_BUFFER_TIME : INITIAL_BUFFER_TIME;
                    if (bufferRemaining > requiredBuffer) {
                        console.log(`Starting audio playback with ${bufferRemaining.toFixed(2)}s buffer (required: ${requiredBuffer.toFixed(2)}s)...`);
                        this.audio.play().then(() => {
                            isPlaying = true;
                            console.log('Audio playback started successfully');
                        }).catch(error => {
                            console.error('Error starting audio playback:', error);
                            // Try with a small delay
                            setTimeout(() => {
                                this.audio.play().catch(err => {
                                    console.error('Failed to start playback after delay:', err);
                                });
                            }, 100);
                        });
                    } else {
                        console.log('Insufficient buffer for playback, waiting...', {
                            bufferedEnd: bufferedEnd.toFixed(3),
                            required: MIN_BUFFER_TIME
                        });
                        // Try again after a short delay
                        setTimeout(startPlayback, 50);
                    }
                } else {
                    console.log('No buffered audio yet, waiting...');
                    // Try again after a short delay
                    setTimeout(startPlayback, 50);
                }
            };

            // Audio buffering configuration
            let lastBufferTime = 0;
            let bufferUnderrunCount = 0;
            let lastPauseTime = 0;
            let lastBufferSize = 0;
            let consecutiveLowBuffers = 0;
            
            // Dynamic buffer configuration - optimized for mobile
            const MIN_BUFFER_THRESHOLD = 2.0;   // Increased from 0.5s to 1s
            const MAX_BUFFER_THRESHOLD = 5.0;   // Increased from 1.5s to 3s
            const BUFFER_GROWTH_FACTOR = 1.2;   // More aggressive growth on underrun
            const BUFFER_SHRINK_FACTOR = 0.99;  // More conservative shrinking
>>>>>>> fix/tts-service
            
            // Update state when audio ends
            this.audio.onended = () => {
                this.isSpeaking = false;
                this._updateState('ended');
            };

            // Optimized buffer monitoring for mobile
            const bufferMonitor = setInterval(() => {
                try {
                    if (sourceBuffer && isPlaying) {
                        monitorBuffer();
                    }
                } catch (e) {
                    console.error('Error in buffer monitor:', e);
                }
            }, 30); // More frequent monitoring with error handling
            
        } catch (error) {
            console.error('Error with OpenAI TTS:', error);
            this.isSpeaking = false;
            this._updateState('error', { error: error.message });
            
            // Fall back to browser TTS if OpenAI TTS fails
            if (this.currentEngine === 'openai') {
                console.log('Falling back to browser TTS');
                this.currentEngine = 'browser';
                await this.speak(text);
            } else {
                throw error;
            }

            // Increased initial delay to allow more buffer to accumulate
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Use WebRTC for TTS streaming with optimized chunk size
            await webrtcService.generateTTS(
                {
                    text,
                    voice: 'alloy',
                    speed: 1.0,
                    chunkSize: 16384 // 16KB chunks for more efficient buffering
                },
                // onChunk callback - receives and plays audio chunks
                async (chunkArray) => {
                    try {
                        console.log('TTS Service received chunk:', {
                            type: typeof chunkArray,
                            length: chunkArray ? chunkArray.length : 'undefined',
                            firstBytes: chunkArray ? chunkArray.slice(0, 10) : 'no data'
                        });

                        // Convert array back to Uint8Array
                        const chunk = new Uint8Array(chunkArray);

                        if (!chunk || chunk.length === 0) {
                            console.log('Received empty audio chunk, skipping');
                            return;
                        }

                        console.log('Converted to Uint8Array, length:', chunk.length, 'Queue length:', chunkQueue.length);

                        if (!sourceBuffer || !isBufferReady || sourceBuffer.updating) {
                            console.log('Source buffer not ready or updating, queuing chunk...');
                            // For mobile devices, limit queue size to prevent memory issues
                            if (chunkQueue.length > 10) {
                                console.warn('Chunk queue getting large, limiting size for mobile performance');
                                chunkQueue = chunkQueue.slice(-8); // Keep only the last 8 chunks
                            }
                            chunkQueue.push(chunk);
                            return;
                        }

                        console.log('Appending chunk to source buffer, size:', chunk.length);
                        // Append the chunk to the source buffer
                        try {
                            sourceBuffer.appendBuffer(chunk);
                            console.log('Chunk appended successfully');
                        } catch (error) {
                            console.error('Error appending chunk to source buffer:', error);
                            // If we get a buffer error, queue the chunk and try again later
                            if (error.message && error.message.includes('buffer')) {
                                console.log('Buffer error, queuing chunk for retry...');
                                // Optimized queue management for mobile
                                if (chunkQueue.length > 5) { // Reduced from 10 to 5
                                    console.warn('Chunk queue getting large, limiting size for mobile performance');
                                    chunkQueue = chunkQueue.slice(-4); // Keep only the last 4 chunks
                                }
                                chunkQueue.push(chunk);
                                // Faster retry for mobile with smaller chunks
                                setTimeout(processChunkQueue, 80);
                                return;
                            }
                            throw error;
                        }

                        // Start playback if this is the first chunk and we're not playing
                        if (!isPlaying) {
                            // Wait a bit for the chunk to be processed, then start playback
                            setTimeout(() => {
                                if (!isPlaying && sourceBuffer && sourceBuffer.buffered.length > 0) {
                                    const buffered = sourceBuffer.buffered;
                                    const bufferedEnd = buffered.end(buffered.length - 1);
                                    console.log('Checking playback start - Buffered:', bufferedEnd.toFixed(3), 'Required:', MIN_BUFFER_TIME);
                                    startPlayback();
                                } else {
                                    console.log('Playback start conditions not met:', {
                                        isPlaying,
                                        hasSourceBuffer: !!sourceBuffer,
                                        bufferedLength: sourceBuffer ? sourceBuffer.buffered.length : 0
                                    });
                                }
                            }, 150);
                        }

                        // Continue processing queued chunks more conservatively for mobile
                        if (chunkQueue.length > 0) {
                            setTimeout(processChunkQueue, chunkQueue.length > 3 ? 8 : 15); // More conservative processing for mobile
                        }

                    } catch (error) {
                        console.error('Error processing audio chunk:', error);
                        this._updateState('error', { error: 'Failed to process audio chunk' });
                    }
                },
                // onStatus callback
                (status) => {
                    if (status === 'complete') {
                        console.log('TTS generation completed, waiting for final chunks to be processed...');

                        // Wait a bit to ensure all pending chunks are processed before ending stream
                        setTimeout(() => {
                            // Clear buffer monitor
                            if (bufferMonitor) {
                                clearInterval(bufferMonitor);
                            }

                            this.isSpeaking = false;
                            // Properly end the MediaSource stream
                            if (mediaSource.readyState === 'open') {
                                // Wait for any ongoing source buffer updates to complete
                                const endStreamSafely = async () => {
                                    try {
                                        if (sourceBuffer && sourceBuffer.updating) {
                                            await new Promise((resolve) => {
                                                sourceBuffer.addEventListener('updateend', resolve, { once: true });
                                            });
                                        }
                                        if (mediaSource.readyState === 'open') {
                                            mediaSource.endOfStream();
                                        }
                                    } catch (error) {
                                        console.error('Error ending MediaSource stream:', error);
                                        if (mediaSource.readyState === 'open') {
                                            try {
                                                mediaSource.endOfStream('decode');
                                            } catch (e) {
                                                console.error('Error with decode endOfStream:', e);
                                            }
                                        }
                                    }
                                };
                                endStreamSafely();
                            }
                            this._updateState('ended');
                        }, 150); // Wait 150ms for any final chunks to be processed
                    }
                },
                // onError callback
                (error) => {
                    console.error('TTS Error:', error);
                    // Clear buffer monitor
                    if (bufferMonitor) {
                        clearInterval(bufferMonitor);
                    }

                    this.isSpeaking = false;
                    this._updateState('error', { error: error.message || error });
                    // End the media source stream on error
                    if (mediaSource.readyState === 'open') {
                        mediaSource.endOfStream('decode');
                    }
                }
            );

            // // Set a timeout for TTS generation (in case OpenAI API is slow)
            // setTimeout(() => {
            //     if (this.isSpeaking) {
            //         console.warn('TTS generation timeout, falling back to browser TTS');
            //         this.isSpeaking = false;
            // Set a timeout for TTS generation (in case OpenAI API is slow)
            const ttsTimeout = setTimeout(() => {
                if (this.isSpeaking) {
                    console.warn('TTS generation timeout, falling back to browser TTS');
                    this.isSpeaking = false;
                    this._updateState('error', { error: 'TTS generation timeout' });
                    this.useOpenAITTS = false;
                    this._speakWithBrowser(text);
                }
            }, 30000); // 30 second timeout

            // Clear the timeout if TTS completes successfully
            this.audio.onended = () => {
                clearTimeout(ttsTimeout);
                this.isSpeaking = false;
                this._updateState('ended');
            };

        } catch (error) {
            console.error('Error with OpenAI TTS, falling back to browser TTS:', error);
        }
    }

    // Use browser's built-in TTS
    _speakWithBrowser(text) {
        try {
            this.isSpeaking = true;
            this.fullText = text;
            this._updateState('speaking');
            
            // Use the Web Speech API
            const utterance = new SpeechSynthesisUtterance(text);
            
            utterance.onend = () => {
                this.isSpeaking = false;
                this._updateState('ended');
            };
            
            utterance.onerror = (event) => {
                console.error('SpeechSynthesis error:', event);
                this.isSpeaking = false;
                this._updateState('error', { error: 'Speech synthesis failed' });
            };
            
            window.speechSynthesis.speak(utterance);
            
        } catch (error) {
            console.error('Error with browser TTS:', error);
            this.isSpeaking = false;
            this._updateState('error', { error: error.message });
            throw error;
        }
    }

    // Pause the current speech
    pause() {
        if (!this.isSpeaking) return;
        
        if (this.useOpenAITTS) {
            this.audio.pause();
            this.isPaused = true;
            this.isSpeaking = false;
        } else {
            this.speechSynthesis.cancel();
        }
        this._updateState('paused');
    }

    // Resume paused speech
    resume() {
        if (!this.isPaused) return;

        if (this.useOpenAITTS) {
            this.audio.play().then(() => {
                this.isPaused = false;
                this.isSpeaking = true;
                this._updateState('speaking');
            }).catch(error => {
                console.error('Error resuming TTS:', error);
                this._updateState('error', { error: 'Failed to resume speech' });
            });
        } else {
            const remainingText = this.fullText.substring(this.charIndex);
            this._speakChunk(remainingText);
            this.isPaused = false;
        }
    }

    // Stop the current speech
    stop() {
        if (this.useOpenAITTS) {
            this.audio.pause();
            this.audio.currentTime = 0;
        } else {
            this.speechSynthesis.cancel();
        }
        this.isSpeaking = false;
        this.isPaused = false;
        this._updateState('stopped');
    }

    // Internal method to speak a chunk of text
    _speakChunk(text) {
        if (!text) {
            this._updateState('ended');
            return;
        }

        this.currentUtterance = new SpeechSynthesisUtterance(text);
        this.isSpeaking = true;
        this._updateState('speaking');

        this.currentUtterance.onboundary = (event) => {
            if (event.name === 'word' || event.name === 'sentence') {
                this.charIndex = event.charIndex;
                this.lastWordTime = Date.now();
            }
        };

        this.currentUtterance.onend = () => {
            this.isSpeaking = false;
            this._updateState('ended');
        };

        this.currentUtterance.onerror = (event) => {
            console.error('TTS Error:', event);
            this.isSpeaking = false;
            this._updateState('error', event);
        };

        this.speechSynthesis.speak(this.currentUtterance);
    }

    // Update state and notify listeners
    _updateState(state, data = null) {
        if (this.onStateChange) {
            this.onStateChange({
                state,
                isSpeaking: this.isSpeaking,
                isPaused: this.isPaused,
                charIndex: this.charIndex,
                text: this.fullText,
                ...(data && { data })
            });
        }
    }
}

// Server-side TTS implementation (placeholder for future implementation)
class ServerTTSService extends TTSService {
    constructor() {
        super();
        this.audioContext = null;
        this.audioBuffer = null;
        this.audioSource = null;
        this.startTime = 0;
        this.pauseTime = 0;
    }

    async _fetchAudio(text) {
        // TODO: Implement server-side TTS API call
        // This is a placeholder for the actual implementation
        return new Promise((resolve) => {
            // In a real implementation, this would be an API call to your server
            console.log('Would fetch TTS audio for text:', text);
            resolve(null);
        });
    }

    _playAudio(buffer) {
        // TODO: Implement audio playback for server TTS
    }

    _stopAudio() {
        // TODO: Implement audio stopping for server TTS
    }
}

// Export the appropriate implementation based on configuration
export const ttsService = new TTSService();
// For server-side TTS, you would use:
// export const ttsService = new ServerTTSService();
