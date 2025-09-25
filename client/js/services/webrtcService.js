class WebRTCService {
    constructor() {
        this.connection = null;
        this.dataChannel = null;
        this.connectionId = null;
        this.onChunk = null;
        this.onStatus = null;
        this.onError = null;
        this.ws = null;
    }

    // Initialize WebSocket connection
    async init() {
        return new Promise((resolve, reject) => {
            // Use WebSocket on port 3001
            const wsProtocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
            const wsHost = window.location.hostname;
            const wsUrl = `${wsProtocol}${wsHost}:3001`;
            
            console.log('Connecting to WebSocket:', wsUrl);
            this.ws = new WebSocket(wsUrl);
            
            // Set binary type to arraybuffer for better performance
            this.ws.binaryType = 'arraybuffer';
            
            // Connection established
            this.ws.onopen = () => {
                console.log('WebSocket connected to', wsUrl);
                resolve();
            };

            this.ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    this.handleMessage(message);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                    this.onError && this.onError('Error processing server message');
                }
            };

            // Handle WebSocket errors
            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                const errorMsg = 'WebSocket connection error. Please check your connection and refresh the page.';
                this.onError && this.onError(errorMsg);
                reject(new Error(errorMsg));
            };
            
            // Handle connection close
            this.ws.onclose = (event) => {
                console.log('WebSocket disconnected:', event.code, event.reason);
                if (event.code !== 1000) { // 1000 is a normal closure
                    console.warn('WebSocket connection closed unexpectedly');
                    this.onError && this.onError('Connection lost. Please refresh the page.');
                }
            };

        });
    }

    // Handle incoming WebSocket messages
    handleMessage(message) {
        console.log('Received message:', message);
        
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

    // Close the connection
    close() {
        if (this.dataChannel) {
            this.dataChannel.close();
            this.dataChannel = null;
        }
        
        if (this.connection) {
            this.connection.close();
            this.connection = null;
        }
        
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}

export const webrtcService = new WebRTCService();
