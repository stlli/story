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

    // Speak the provided text
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
            await this._speakWithOpenAI(text);
        } else {
            this._speakWithBrowser(text);
        }
    }

    // Use OpenAI TTS
    async _speakWithOpenAI(text) {
        try {
            this.isSpeaking = true;
            this._updateState('speaking');
            
            const response = await fetch('/api/generate-speech', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text,
                    voice: 'alloy',
                    speed: 1.0
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            
            this.audio.src = audioUrl;
            await this.audio.play();
            
        } catch (error) {
            console.error('Error with OpenAI TTS, falling back to browser TTS:', error);
            this.useOpenAITTS = false;
            this._speakWithBrowser(text);
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
