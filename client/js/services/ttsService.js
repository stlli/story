class TTSService {
    constructor() {
        this.isSpeaking = false;
        this.isPaused = false;
        this.currentUtterance = null;
        this.charIndex = 0;
        this.fullText = '';
        this.lastWordTime = Date.now();
        this.speechSynthesis = window.speechSynthesis;
        this.onStateChange = null;
    }

    // Initialize the TTS service
    init() {
        // Any initialization code can go here
    }

    // Speak the provided text
    speak(text, onStateChange = null) {
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
        this._speakChunk(this.fullText);
    }

    // Pause the current speech
    pause() {
        if (!this.isSpeaking) return;
        
        // Store the current state before pausing
        this.isPaused = true;
        this.isSpeaking = false;
        
        try {
            // Cancel any ongoing speech
            this.speechSynthesis.cancel();
            this._updateState('paused');
        } catch (error) {
            console.warn('Error while pausing TTS:', error);
            // If there's an error, make sure we're in a consistent state
            this.isSpeaking = false;
            this.isPaused = false;
            this._updateState('error', { error: 'pause_failed' });
        }
    }

    // Resume paused speech
    resume() {
        if (!this.isPaused) return;

        const remainingText = this.fullText.substring(this.charIndex);
        this._speakChunk(remainingText);
        this.isPaused = false;
    }

    // Stop the current speech
    stop() {
        this.speechSynthesis.cancel();
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

        try {
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
                // Don't update state if we're in the middle of pausing
                if (this.isPaused) return;
                this.isSpeaking = false;
                this._updateState('ended');
            };

            this.currentUtterance.onerror = (event) => {
                // Don't treat 'interrupted' as an error when pausing
                if (event.error === 'interrupted' && this.isPaused) return;
                
                this._handleError(event, 'speak_chunk');
            };

            this.speechSynthesis.speak(this.currentUtterance);
        } catch (error) {
            this._handleError(error, 'speak_chunk_initialization');
        }
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
    
    _handleError(error, context = '') {
        console.error(`TTS Error (${context}):`, error);
        // Only update state if we're not in the middle of pausing
        if (!this.isPaused) {
            this.isSpeaking = false;
            this.isPaused = false;
            this._updateState('error', { 
                error: error.toString(),
                context
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
