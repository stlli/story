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
    async init() {
        if (this._initializing) {
            return this._initPromise;
        }
        
        this._initializing = true;
        this._initPromise = (async () => {
            try {
                // Initialize environment first to know which TTS to use
                await this._initEnvironment();
                
                if (this.useOpenAITTS) {
                    try {
                        // Only initialize WebRTC if we're using OpenAI TTS
                        await webrtcService.init();
                        console.log('TTS Service initialized with WebRTC support');
                    } catch (error) {
                        console.error('Failed to initialize WebRTC, falling back to browser TTS:', error);
                        this.useOpenAITTS = false;
                    }
                } else {
                    console.log('TTS Service initialized with browser TTS');
                }
                
                this._initialized = true;
                return true;
            } catch (error) {
                console.error('Failed to initialize TTS service:', error);
                this.useOpenAITTS = false;
                this._initialized = true;
                return false;
            } finally {
                this._initializing = false;
            }
        })();
        
        return this._initPromise;
    }

    // Speak the provided text with optional streaming
    async speak(text, onStateChange = null) {
        // If already speaking, toggle pause/play
        if (this.isSpeaking) {
            if (this.isPaused) {
                this.resume();
            } else {
                this.pause();
            }
            return;
        }

        // Initialize if not already done
        if (!this._initialized && !this._initializing) {
            try {
                await this.init();
            } catch (error) {
                console.error('Failed to initialize TTS service:', error);
                this.useOpenAITTS = false;
            }
        }

        this.fullText = text;
        this.charIndex = 0;
        this.onStateChange = onStateChange;

        try {
            if (this.useOpenAITTS) {
                await this._speakWithOpenAI(text);
            } else {
                this._speakWithBrowser(text);
            }
        } catch (error) {
            console.error('Error in TTS playback:', error);
            this._updateState('error', { error: error.message || 'TTS playback failed' });
            
            // Fall back to browser TTS if OpenAI TTS fails
            if (this.useOpenAITTS) {
                console.log('Falling back to browser TTS');
                this.useOpenAITTS = false;
                this._speakWithBrowser(text);
            }
        }
    }

    // Use OpenAI TTS with basic WebRTC streaming support
    async _speakWithOpenAI(text) {
        try {
            this.isSpeaking = true;
            this._updateState('speaking');

            // Create a new audio context
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const mediaSource = new MediaSource();
            const audioUrl = URL.createObjectURL(mediaSource);
            this.audio.src = audioUrl;

            let sourceBuffer = null;
            let isPlaying = false;
            let audioQueue = [];
            let isSourceOpen = false;

            // Handle MediaSource events
            mediaSource.addEventListener('sourceopen', () => {
                console.log('MediaSource opened, creating source buffer...');
                try {
                    sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg');
                    sourceBuffer.mode = 'sequence';
                    isSourceOpen = true;
                    
                    // Start processing the audio queue
                    processAudioQueue();
                    
                    // Start playback when we have some audio buffered
                    checkAndStartPlayback();
                } catch (error) {
                    console.error('Error creating source buffer:', error);
                    this._updateState('error', { error: 'Failed to create audio buffer' });
                }
            });

            // Process audio chunks from the queue
            const processAudioQueue = () => {
                if (!sourceBuffer || sourceBuffer.updating || audioQueue.length === 0) {
                    return;
                }

                const chunk = audioQueue.shift();
                try {
                    sourceBuffer.appendBuffer(chunk);
                    
                    // Process next chunk after this one is done
                    sourceBuffer.addEventListener('updateend', processAudioQueue, { once: true });
                } catch (error) {
                    console.error('Error appending audio chunk:', error);
                    // Requeue the chunk and try again later
                    audioQueue.unshift(chunk);
                    setTimeout(processAudioQueue, 50);
                }
            };

            // Start playback when we have enough audio
            const checkAndStartPlayback = () => {
                if (isPlaying || !sourceBuffer || sourceBuffer.buffered.length === 0) {
                    return;
                }

                const buffered = sourceBuffer.buffered;
                const currentTime = this.audio.currentTime;
                const bufferedEnd = buffered.end(buffered.length - 1);
                const bufferRemaining = bufferedEnd - currentTime;
                
                // Start playback if we have at least 0.5 seconds of audio buffered
                if (bufferRemaining > 0.5) {
                    this.audio.play().then(() => {
                        isPlaying = true;
                        console.log('Playback started with', bufferRemaining.toFixed(2), 'seconds buffered');
                    }).catch(error => {
                        console.error('Error starting playback:', error);
                        // Try again in 100ms
                        setTimeout(checkAndStartPlayback, 100);
                    });
                } else {
                    // Check again in 100ms
                    setTimeout(checkAndStartPlayback, 100);
                }
            };

            // Ensure WebRTC is initialized
            if (!webrtcService.ws || webrtcService.ws.readyState !== WebSocket.OPEN) {
                console.log('WebRTC not connected, initializing...');
                try {
                    await webrtcService.init();
                } catch (error) {
                    console.error('Failed to initialize WebRTC, falling back to browser TTS:', error);
                    this.useOpenAITTS = false;
                    return this._speakWithBrowser(text);
                }
            }

            // Start TTS generation with WebRTC
            console.log('Starting TTS generation with WebRTC...');
            webrtcService.generateTTS(
                {
                    text,
                    voice: 'alloy',
                    speed: 1.0,
                    chunkSize: 32768 // 32KB chunks for better performance
                },
                // onChunk callback
                (chunkArray) => {
                    if (!chunkArray || chunkArray.length === 0) {
                        return;
                    }

                    const chunk = new Uint8Array(chunkArray);
                    audioQueue.push(chunk);

                    // Process the queue if not already processing
                    if (isSourceOpen && (!sourceBuffer || !sourceBuffer.updating)) {
                        processAudioQueue();
                    }
                    
                    // Check if we should start playback
                    if (!isPlaying) {
                        checkAndStartPlayback();
                    }
                },
                // onStatus callback
                (status) => {
                    if (status === 'complete') {
                        console.log('TTS generation completed');
                        
                        // Wait a moment for any final chunks to be processed
                        setTimeout(() => {
                            if (mediaSource.readyState === 'open') {
                                try {
                                    mediaSource.endOfStream();
                                } catch (e) {
                                    console.error('Error ending MediaSource stream:', e);
                                }
                            }
                            
                            this.isSpeaking = false;
                            this._updateState('ended');
                        }, 200);
                    }
                },
                // onError callback
                (error) => {
                    console.error('TTS Error:', error);
                    this.isSpeaking = false;
                    this._updateState('error', { error: error.message || 'TTS generation failed' });
                    
                    if (mediaSource.readyState === 'open') {
                        try {
                            mediaSource.endOfStream('decode');
                        } catch (e) {
                            console.error('Error ending MediaSource stream on error:', e);
                        }
                    }
                }
            );

            // Set a timeout for TTS generation (reduced for faster fallback)
            // const ttsTimeout = setTimeout(() => {
            //     if (this.isSpeaking) {
            //         console.warn('TTS generation timeout, falling back to browser TTS');
            //         this.isSpeaking = false;
            //         this._updateState('error', { error: 'TTS generation timeout' });
            //         this.useOpenAITTS = false;
            //         this._speakWithBrowser(text);
            //     }
            // }, 10000); // 10 second timeout for faster fallback

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
        // Stop any current speech
        if (this.currentUtterance) {
            this.speechSynthesis.cancel();
        }
        
        // Create a new utterance
        this.currentUtterance = new SpeechSynthesisUtterance(text);
        
        // Set up event handlers
        this.currentUtterance.onstart = () => {
            this.isSpeaking = true;
            this.isPaused = false;
            this._updateState('speaking');
        };
        
        this.currentUtterance.onend = () => {
            this.isSpeaking = false;
            this.currentUtterance = null;
            this._updateState('ended');
        };
        
        this.currentUtterance.onerror = (event) => {
            console.error('SpeechSynthesis error:', event);
            this.isSpeaking = false;
            this.currentUtterance = null;
            this._updateState('error', { error: 'Speech synthesis failed' });
        };
        
        // Speak the text
        this.speechSynthesis.speak(this.currentUtterance);
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