import { webrtcService } from './webrtcService.js';

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
        
        // Check if we're in production or development
        // This will be set when the app initializes
        this.useOpenAITTS = false; // Default to false until we know the environment
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
            // Fall back to browser TTS if OpenAI TTS fails
            if (this.useOpenAITTS) {
                console.log('Falling back to browser TTS');
                this.useOpenAITTS = false;
                this.speak(this.fullText, this.onStateChange);
            }
        };
    }

    // Initialize the environment
    async _initEnvironment() {
        try {
            // Check for forceOpenAITTS URL parameter first
            const urlParams = new URLSearchParams(window.location.search);
            const forceOpenAITTS = urlParams.get('forceOpenAITTS');
            
            if (forceOpenAITTS !== null) {
                this.useOpenAITTS = forceOpenAITTS === 'true';
                console.log(`TTS Service: ${this.useOpenAITTS ? 'Forcing OpenAI TTS' : 'Forcing Web TTS'} (from URL parameter)`);
            } else {
                // Get the environment from the server if no URL parameter is provided
                const response = await fetch('/api/environment');
                if (response.ok) {
                    const data = await response.json();
                    this.useOpenAITTS = data.environment === 'production';
                    console.log(`TTS Service: Using ${this.useOpenAITTS ? 'OpenAI TTS' : 'Web TTS'} (based on environment)`);
                }
            }
        } catch (error) {
            console.warn('Could not determine environment, falling back to Web TTS', error);
            this.useOpenAITTS = false;
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

    // Speak the provided text with optional streaming
    async speak(text, onStateChange = null) {
        if (this.isPaused) {
            this.resume();
            return;
        }

        if (this.isSpeaking) {
            this.pause();
            return;
        }

        this.fullText = text;
        this.charIndex = 0;
        this.onStateChange = onStateChange;

        if (this.useOpenAITTS) {
            // Check for mobile devices and use simpler approach to prevent frame drops
            await this._speakWithOpenAI(text);
        } else {
            this._speakWithBrowser(text);
        }
    }

    // Use OpenAI TTS with WebRTC streaming support
    async _speakWithOpenAI(text) {
        try {
            this.isSpeaking = true;
            this._updateState('speaking');

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
            });

            // Process queued chunks
            const processChunkQueue = () => {
                if (!sourceBuffer || !isBufferReady || sourceBuffer.updating) {
                    return;
                }

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
            
            const monitorBuffer = () => {
                if (!sourceBuffer || !isPlaying) return;
                
                const buffered = sourceBuffer.buffered;
                if (buffered.length === 0) return;
                
                const currentTime = this.audio.currentTime;
                const now = Date.now();
                const bufferedEnd = buffered.end(buffered.length - 1);
                const bufferRemaining = bufferedEnd - currentTime;
                
                // Track buffer size changes
                const bufferSize = bufferedEnd - buffered.start(0);
                const bufferSizeChanged = Math.abs(bufferSize - lastBufferSize) > 0.1;
                lastBufferSize = bufferSize;
                
                // Calculate dynamic buffer threshold with smoother transitions
                let bufferThreshold = MIN_BUFFER_THRESHOLD;
                
                if (bufferUnderrunCount > 0) {
                    // Exponential backoff for buffer threshold
                    bufferThreshold = Math.min(
                        MAX_BUFFER_THRESHOLD,
                        MIN_BUFFER_THRESHOLD * Math.pow(BUFFER_GROWTH_FACTOR, bufferUnderrunCount)
                    );
                    
                    // Apply gradual reduction when buffer is stable
                    if (bufferRemaining > bufferThreshold * 1.5) {
                        bufferThreshold = Math.max(
                            MIN_BUFFER_THRESHOLD,
                            bufferThreshold * BUFFER_SHRINK_FACTOR
                        );
                    }
                }
                
                // Check buffer health
                if (bufferRemaining < bufferThreshold) {
                    consecutiveLowBuffers++;
                    
                    // Only log if we've had consecutive low buffers or it's been a while
                    if (consecutiveLowBuffers > 2 || now - lastBufferTime > 1000) {
                        console.warn('Low audio buffer:', {
                            bufferedEnd: bufferedEnd.toFixed(3),
                            currentTime: currentTime.toFixed(3),
                            bufferRemaining: bufferRemaining.toFixed(3),
                            bufferThreshold: bufferThreshold.toFixed(3),
                            bufferSize: bufferSize.toFixed(3),
                            bufferUnderrunCount: bufferUnderrunCount,
                            consecutiveLowBuffers: consecutiveLowBuffers
                        });
                        lastBufferTime = now;
                    }
                    
                    // Increase underrun counter if we're actually playing and buffer is critically low
                    if (!this.audio.paused && bufferRemaining < bufferThreshold * 0.5) {
                        bufferUnderrunCount = Math.min(bufferUnderrunCount + 0.5, 20); // Smoother increase
                    }
                    
                    // Pause playback if buffer is critically low - more aggressive for mobile
                    if (bufferRemaining < 0.15 && !this.audio.paused && now - lastPauseTime > 800) {
                        console.log(`Pausing playback (buffer: ${bufferRemaining.toFixed(3)}s < 0.15s)`);
                        this.audio.pause();
                        lastPauseTime = now;
                        
                        const checkBuffer = () => {
                            if (!sourceBuffer || sourceBuffer.buffered.length === 0) {
                                if (now - lastPauseTime < 10000) {
                                    setTimeout(checkBuffer, 100);
                                }
                                return;
                            }
                            
                            const newBufferedEnd = sourceBuffer.buffered.end(sourceBuffer.buffered.length - 1);
                            const newBufferRemaining = newBufferedEnd - this.audio.currentTime;
                            const requiredBuffer = Math.min(bufferThreshold * 1.2, MAX_BUFFER_THRESHOLD); // Lower resume threshold
                            
                            if (newBufferRemaining > requiredBuffer) {
                                console.log(`Resuming playback with buffer: ${newBufferRemaining.toFixed(2)}s`);
                                this.audio.play().then(() => {
                                    consecutiveLowBuffers = 0;
                                    // Gradually reduce buffer threshold when stable
                                    if (bufferUnderrunCount > 0) {
                                        bufferUnderrunCount = Math.max(0, bufferUnderrunCount - 0.2);
                                    }
                                }).catch(err => {
                                    console.error('Playback resume failed:', err);
                                    if (now - lastPauseTime < 10000) {
                                        setTimeout(checkBuffer, 300);
                                    }
                                });
                            } else if (now - lastPauseTime < 10000) { // Don't try forever
                                setTimeout(checkBuffer, 100);
                            }
                        };
                        
                        setTimeout(checkBuffer, 100);
                    }
                } else {
                    // Buffer is healthy
                    consecutiveLowBuffers = 0;
                    
                    // Gradually reduce buffer threshold when we have excess buffer
                    if (bufferRemaining > bufferThreshold * 1.5 && bufferUnderrunCount > 0) {
                        bufferUnderrunCount = Math.max(0, bufferUnderrunCount - 0.05);
                    }
                }
            };

            // Optimized buffer monitoring for mobile
            bufferMonitor = setInterval(() => {
                try {
                    monitorBuffer();
                } catch (e) {
                    console.error('Error in buffer monitor:', e);
                }
            }, 30); // More frequent monitoring with error handling

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
            //         this._updateState('error', { error: 'TTS generation timeout' });
            //         this.useOpenAITTS = false;
            //         this._speakWithBrowser(text);
            //     }
            // }, 30000); // 30 second timeout

        } catch (error) {
            console.error('Error with OpenAI TTS, falling back to browser TTS:', error);
        }
    }

    // Use browser's built-in TTS
    _speakWithBrowser(text) {
        this._speakChunk(text);
    }

    // Pause the current speech
    pause() {
        if (!this.isSpeaking) return;
        
        if (this.useOpenAITTS) {
            this.audio.pause();
        } else {
            this.speechSynthesis.cancel();
        }
        this.isPaused = true;
        this.isSpeaking = false;
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
