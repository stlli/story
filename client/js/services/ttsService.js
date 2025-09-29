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
