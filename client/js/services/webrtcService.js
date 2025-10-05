class WebRTCService {
    constructor() {
        // WebRTC properties
        this.connection = null;
        this.dataChannel = null;
        this.connectionId = null;
        this.onChunk = null;
        this.onStatus = null;
        this.onError = null;
        
        // Connection state
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000; // Start with 1 second delay
        this.maxReconnectDelay = 30000; // Max 30 seconds delay
        this.heartbeatInterval = null;
        this.lastMessageTime = 0;
        this.ws = null;
        this.wsUrl = '';
    }

    // Initialize WebSocket connection
    async init() {
        return new Promise((resolve, reject) => {
            // Use WebSocket on the same port as the HTTP server
            const wsProtocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
            const wsHost = window.location.hostname;
            const wsPort = window.location.port || (window.location.protocol === 'https:' ? 443 : 80);
            this.wsUrl = wsPort === 80 || wsPort === 443
                ? `${wsProtocol}${wsHost}`
                : `${wsProtocol}${wsHost}:${wsPort}`;
            
            console.log('Connecting to WebSocket:', this.wsUrl);
            this.ws = new WebSocket(this.wsUrl);
            
            // Set binary type to arraybuffer for better performance
            this.ws.binaryType = 'arraybuffer';
            
            // Connection established
            this.ws.onopen = () => {
                console.log('WebSocket connected to', this.wsUrl);
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.lastMessageTime = Date.now();
                this.setupHeartbeat();
                resolve();
            };

            this.ws.onmessage = (event) => {
                this.lastMessageTime = Date.now();
                
                // Handle ping/pong messages
                if (typeof event.data === 'string' && (event.data === 'ping' || event.data === 'pong')) {
                    if (event.data === 'ping') {
                        this.ws.send('pong');
                    }
                    return;
                }
                
                // Handle JSON messages
                try {
                    const message = typeof event.data === 'string' 
                        ? JSON.parse(event.data) 
                        : event.data;
                    this.handleMessage(message);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error, 'Data:', event.data);
                }
            };

            // Handle WebSocket errors
            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                if (!this.isConnected) {
                    this.onError && this.onError({
                        type: 'error',
                        message: 'Connection error. Attempting to reconnect...',
                        isFatal: false
                    });
                }
            };
            
            // Handle connection close
            this.ws.onclose = (event) => {
                console.log('WebSocket disconnected:', event.code, event.reason);
                this.isConnected = false;
                this.cleanupHeartbeat();
                
                if (event.code !== 1000) { // 1000 is a normal closure
                    console.warn('WebSocket connection closed unexpectedly, attempting to reconnect...');
                    this.attemptReconnect();
                    this.onError && this.onError({
                        type: 'reconnecting',
                        message: 'Connection lost. Reconnecting...',
                        isFatal: false
                    });
                }
            };
        });
    }
    
    // Setup heartbeat to keep connection alive
    setupHeartbeat() {
        this.cleanupHeartbeat();
        
        // Send ping every 20 seconds
        this.heartbeatInterval = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                try {
                    // Check if we've received any messages in the last 50 seconds
                    if (Date.now() - this.lastMessageTime > 50000) {
                        console.warn('No messages received in the last 50 seconds, reconnecting...');
                        this.ws.close(1000, 'No activity');
                        this.attemptReconnect();
                        return;
                    }
                    
                    // Send a ping if the connection is still alive
                    this.ws.send('ping');
                } catch (e) {
                    console.error('Error sending heartbeat:', e);
                    this.ws.close(1000, 'Heartbeat error');
                }
            }
        }, 20000);
    }
    
    // Cleanup heartbeat interval
    cleanupHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }
    
    // Attempt to reconnect with exponential backoff
    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
            this.onError && this.onError({
                type: 'error',
                message: 'Connection lost. Please refresh the page to continue.',
                isFatal: true
            });
            return;
        }
        
        this.reconnectAttempts++;
        const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), this.maxReconnectDelay);
        
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
        
        // Show reconnection status in UI
        this.onError && this.onError({
            type: 'reconnecting',
            message: `Connection lost. Reconnecting (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`,
            isFatal: false
        });
        
        setTimeout(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                // Connection restored, notify UI
                this.onError && this.onError({
                    type: 'reconnected',
                    message: 'Connection restored!',
                    isFatal: false
                });
                return;
            }
            
            this.init().catch(error => {
                console.error('Reconnection failed:', error);
                this.onError && this.onError({
                    message: `Reconnection attempt ${this.reconnectAttempts} failed. Retrying...`,
                    isFatal: false
                });
                this.attemptReconnect();
            });
        }, delay);
    }

    // Handle incoming WebSocket messages
    handleMessage(message) {
        // Handle undefined or missing message type
        if (!message || typeof message !== 'object' || !message.type) {
            console.warn('Received invalid message format:', message);
            return;
        }
        
        switch (message.type) {
            case 'connection':
                this.connectionId = message.connectionId;
                this.setupWebRTC();
                break;
                
            case 'rtc':
                this.handleRTCSignaling(message);
                break;
                
            case 'chunk':
            case 'storyChunk':
                if (this.onChunk && message.chunk) {
                    this.onChunk(message.chunk);
                }
                if (message.isFinal && this.onStatus) {
                    this.onStatus('complete');
                }
                break;
            case 'ttsChunk':
                if (this.onChunk && message.chunk) {
                    // Skip empty chunks
                    if (message.chunk.length === 0) {
                        console.log('Received empty TTS chunk, skipping');
                        // Only complete if this is explicitly marked as final AND empty
                        // This handles the case where server sends empty chunk as final signal
                        if (message.isFinal && this.onStatus) {
                            console.log('Received empty final TTS chunk, calling onStatus complete');
                            this.onStatus('complete');
                        }
                        break;
                    }

                    // Process the chunk in the next tick to avoid blocking the WebSocket
                    setTimeout(() => {
                        try {
                            this.onChunk(message.chunk);
                            // If this is the final chunk, signal completion
                            if (message.isFinal && this.onStatus) {
                                console.log('Received final non-empty TTS chunk, calling onStatus complete');
                                this.onStatus('complete');
                            }
                        } catch (error) {
                            console.error('Error processing TTS chunk:', error);
                            // Try to recover by re-requesting the chunk if possible
                            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                                console.log('Requesting chunk retry...');
                                this.ws.send(JSON.stringify({
                                    type: 'retry_chunk',
                                    chunkId: message.chunkId // Assuming server sends chunk IDs
                                }));
                            }
                        }
                    }, 0);
                }
                break;
                
            case 'status':
                this.onStatus && this.onStatus(message.message);
                break;
                
            case 'complete':
                this.onStatus && this.onStatus('complete');
                break;
                
            case 'storyGenerated':
                // For backward compatibility
                if (this.onChunk && message.story) {
                    if (typeof message.story === 'object' && message.story.story) {
                        this.onChunk(message.story.story);
                    } else if (typeof message.story === 'string') {
                        this.onChunk(message.story);
                    }
                }
                if (this.onStatus) {
                    this.onStatus('complete');
                }
                break;
                
            case 'error':
                console.error('Server error:', message.error || message.message);
                this.onError && this.onError(message.message || 'An error occurred');
                break;
        }
    }

    // Set up WebRTC connection
    async setupWebRTC() {
        try {
            this.connection = new RTCPeerConnection({
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    // You may want to add TURN servers for production use
                ]
            });

            // Set up data channel for streaming text
            this.dataChannel = this.connection.createDataChannel('storyData');
            this.setupDataChannel();

            // Set up ICE candidate handling
            this.connection.onicecandidate = (event) => {
                if (event.candidate) {
                    this.sendSignal({
                        type: 'ice-candidate',
                        candidate: event.candidate
                    });
                }
            };

            // Create and send offer
            const offer = await this.connection.createOffer();
            await this.connection.setLocalDescription(offer);
            
            this.sendSignal({
                type: 'offer',
                sdp: offer.sdp
            });

        } catch (error) {
            console.error('Error setting up WebRTC:', error);
            this.onError && this.onError('Failed to set up connection');
        }
    }

    // Set up data channel event handlers
    setupDataChannel() {
        this.dataChannel.onopen = () => {
            console.log('Data channel opened');
            this.onStatus && this.onStatus('connected');
        };

        this.dataChannel.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                console.log('Data channel message:', message);
                if (message.type === 'chunk' && this.onChunk) {
                    this.onChunk(message.data);
                }
            } catch (error) {
                console.error('Error processing data channel message:', error);
            }
        };

        this.dataChannel.onclose = () => {
            console.log('Data channel closed');
            this.onStatus && this.onStatus('disconnected');
        };

        this.dataChannel.onerror = (error) => {
            console.error('Data channel error:', error);
            this.onError && this.onError('Connection error');
        };
    }

    // Handle WebRTC signaling messages
    async handleRTCSignaling(message) {
        try {
            if (!this.connection) {
                console.warn('Received signaling message but no connection exists');
                return;
            }

            const data = message.data;
            
            if (data.type === 'offer') {
                // Only process offer if we're in a stable or have-local-offer state
                if (this.connection.signalingState === 'stable' || 
                    this.connection.signalingState === 'have-local-offer') {
                    
                    await this.connection.setRemoteDescription(new RTCSessionDescription({
                        type: 'offer',
                        sdp: data.sdp
                    }));

                    const answer = await this.connection.createAnswer();
                    await this.connection.setLocalDescription(answer);

                    this.sendSignal({
                        type: 'answer',
                        sdp: answer.sdp
                    });
                }

            } else if (data.type === 'answer') {
                // Only process answer if we're in have-local-offer state
                if (this.connection.signalingState === 'have-local-offer') {
                    await this.connection.setRemoteDescription(new RTCSessionDescription({
                        type: 'answer',
                        sdp: data.sdp
                    }));
                }

            } else if (data.type === 'ice-candidate' && data.candidate) {
                try {
                    await this.connection.addIceCandidate(new RTCIceCandidate(data.candidate));
                } catch (e) {
                    if (!e.toString().includes('The operation is not supported')) {
                        console.error('Error adding ICE candidate:', e);
                    }
                }
            }
        } catch (error) {
            console.error('Error handling RTC signaling:', error);
            this.onError && this.onError('Connection error');
        }
    }

    // Send a signal through the WebSocket
    sendSignal(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'rtc',
                target: this.connectionId,
                data: data
            }));
        } else {
            console.warn('WebSocket not connected');
        }
    }

    // Start generating a story with streaming
    async generateStory(requestData, onChunk, onStatus, onError) {
        this.onChunk = onChunk;
        this.onStatus = onStatus;
        this.onError = onError;

        // Validate required parameters
        if (!requestData) {
            onError && onError('Request data is required');
            return;
        }
        
        // Either prompt or topicId is required
        if (!requestData.userPrompt && !requestData.topicId) {
            onError && onError('Either a prompt or a topic is required');
            return;
        }

        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            // Prepare the story generation request
            const request = {
                type: 'generateStory',
                ...requestData,
                connectionId: this.connectionId
            };

            console.log('Sending story generation request:', JSON.stringify(request, null, 2));
            this.ws.send(JSON.stringify(request));
        } else {
            onError && onError('Not connected to server');
        }
    }

    // Start generating TTS with streaming
    async generateTTS(requestData, onChunk, onStatus, onError) {
        this.onChunk = onChunk;
        this.onStatus = onStatus;
        this.onError = onError;

        // Validate required parameters
        if (!requestData || !requestData.text) {
            onError && onError('Text is required for TTS generation');
            return;
        }

        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            // Prepare the TTS generation request
            const request = {
                type: 'generateTTS',
                ...requestData,
                connectionId: this.connectionId
            };

            console.log('Sending TTS generation request:', JSON.stringify(request, null, 2));
            this.ws.send(JSON.stringify(request));
        } else {
            onError && onError('Not connected to server');
        }
    }
}

export const webrtcService = new WebRTCService();
