if (process.env.NODE_ENV !== 'production') {
    const dotenv = await import('dotenv');
    dotenv.config();
}
import express from 'express';
import path from 'path';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import http from 'http';
import storyGenerator from './services/StoryGenerator.js';
import { generateSpeech } from './services/openaiTtsService.js';
import { generateStreamingStory } from './services/llmService.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to handle async route handlers
const asyncHandler = fn => (req, res, next) => {
    return Promise
        .resolve(fn(req, res, next))
        .catch(next);
};

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;

// Create a separate HTTP server for WebSocket
const wsServer = http.createServer();
const wsPort = 3001; // Different port for WebSocket

// WebSocket server for WebRTC signaling
const wss = new WebSocketServer({ 
    server: wsServer, // Use the separate server for WebSocket
    clientTracking: true,
    perMessageDeflate: false // Disable compression for now to rule out compression issues
});

// Start WebSocket server
wsServer.listen(wsPort, '0.0.0.0', () => {
    console.log(`WebSocket server is running on ws://localhost:${wsPort}`);
});

// Add CORS middleware for Express
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Store active connections
const connections = new Map();

// WebSocket connection handler
wss.on('connection', (ws) => {
    console.log('New WebSocket connection');
    
    // Generate a unique ID for this connection
    const connectionId = Date.now().toString();
    const connection = { ws, id: connectionId };
    connections.set(connectionId, connection);
    console.log(`Client connected: ${connectionId}`);
    
    // Send connection ID to client
    const welcomeMessage = {
        type: 'connection',
        connectionId: connectionId
    };
    
    ws.send(JSON.stringify(welcomeMessage));
    
    // Handle incoming messages
    const handleMessage = async (message) => {
        try {
            const data = JSON.parse(message);
            console.log('Received message:', data);
            
            // Handle different message types
            if (data.type === 'offer' || data.type === 'answer' || data.type === 'candidate') {
                // Forward the message to the target peer
                const target = connections.get(data.target);
                if (target && target.ws) {
                    target.ws.send(JSON.stringify({
                        ...data,
                        sender: connectionId
                    }));
                } else {
                    console.error(`Target connection not found: ${data.target}`);
                    // Notify the sender that the target is not available
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: `Target peer ${data.target} not found`
                    }));
                }
            } else if (data.type === 'rtc') {
                // Forward WebRTC signaling messages to the target peer
                if (data.target && connections.has(data.target)) {
                    const target = connections.get(data.target);
                    if (target && target.ws) {
                        target.ws.send(JSON.stringify({
                            type: 'rtc',
                            from: connectionId,
                            data: data.data
                        }));
                    }
                }
            } else if (data.type === 'generateStory') {
                // Handle story generation request
                console.log('Generating story with data:', JSON.stringify(data, null, 2));
                try {
                    // Destructure with defaults that match our client interface
                    const { 
                        userPrompt = '',
                        topicId = undefined,
                        entityIds: rawEntityIds = [],
                        category = 'normal',
                        age = 8,
                        forceOpenAITTS,
                        forceOpenAIStory
                    } = data;

                    // Validate required fields - either userPrompt or topicId is required
                    if (!userPrompt && !topicId) {
                        throw new Error('Either a prompt or a topic is required');
                    }

                    // Process entity IDs (ensure they're strings and not empty)
                    const entityIds = Array.isArray(rawEntityIds) 
                        ? rawEntityIds.map(id => String(id).trim()).filter(Boolean)
                        : [];

                    if (entityIds.length === 0) {
                        throw new Error('At least one character must be selected');
                    }

                    // Track if we've sent any chunks
                    let hasSentChunks = false;
                    let fullStory = '';
                    
                    // Call the story generation service with streaming support
                    const story = await storyGenerator.handleGenerateStory({
                        userPrompt,
                        topicId,
                        entityIds,
                        category,
                        age: parseInt(age) || 8,
                        forceOpenAITTS,
                        forceOpenAIStory,
                        onChunk: (chunk) => {
                            hasSentChunks = true;
                            fullStory += chunk;
                            
                            // Send the chunk to the client
                            try {
                                ws.send(JSON.stringify({
                                    type: 'storyChunk',
                                    chunk: chunk,
                                    isFinal: false
                                }));
                            } catch (error) {
                                console.error('Error sending story chunk:', error);
                            }
                        }
                    });
                    
                    // If no chunks were sent (non-streaming fallback), send the full story
                    if (!hasSentChunks) {
                        ws.send(JSON.stringify({
                            type: 'storyGenerated',
                            story: story
                        }));
                    } else {
                        // Send final chunk with isFinal flag
                        ws.send(JSON.stringify({
                            type: 'storyChunk',
                            chunk: '',
                            isFinal: true,
                            fullStory: story.story || story
                        }));
                    }
                } catch (error) {
                    console.error('Error generating story:', error);
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Failed to generate story: ' + (error.message || 'Unknown error')
                    }));
                }
            } else {
                console.warn('Unknown message type:', data.type);
                ws.send(JSON.stringify({
                    type: 'error',
                    message: `Unknown message type: ${data.type}`
                }));
            }
        } catch (error) {
            console.error('Error processing message:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Error processing message: ' + error.message
            }));
        }
    };
    
    // Handle client disconnection
    const handleClose = () => {
        console.log(`Client disconnected: ${connectionId}`);
        connections.delete(connectionId);
        // Clean up event listeners
        ws.off('message', handleMessage);
        ws.off('close', handleClose);
        ws.off('error', handleError);
    };
    
    // Handle errors
    const handleError = (error) => {
        console.error('WebSocket error:', error);
        connections.delete(connectionId);
        ws.terminate();
    };
    
    // Set up event listeners
    ws.on('message', handleMessage);
    ws.on('close', handleClose);
    ws.on('error', handleError);
});

// Middleware
app.use(express.json());
app.use(express.static('client'));
// Serve public files from root
app.use(express.static(path.join(__dirname, 'public')));
// Also keep the /public prefix for backward compatibility
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(cors());

// Log static file requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Serve the main page with environment variable
app.get('/', (req, res) => {
    // Inject environment variable into the HTML
    const htmlPath = path.join(__dirname, 'client', 'index.html');
    res.sendFile(htmlPath, {
        headers: {
            'Cache-Control': 'no-store',
            'X-Environment': process.env.NODE_ENV || 'development'
        }
    });
});

// API endpoint to get categories with their topics based on story type
app.get('/api/categories', (req, res) => {
    const categoryType = req.query.category || 'normal';
    const categories = storyGenerator.handleGetCategories(categoryType);
    res.json(categories);
});

// API endpoint to get environment information
app.get('/api/environment', (req, res) => {
    res.json({
        environment: process.env.NODE_ENV || 'development'
    });
});

// API endpoint to get all topics (flattened, for backward compatibility)
app.get('/api/topics', (req, res) => {
    const category = req.query.category || 'all';
    let topics;
    
    if (category === 'all') {
        topics = storyGenerator.handleGetAllTopics();
    } else {
        const categories = storyGenerator.handleGetCategories(category);
        topics = categories.flatMap(cat => cat.subtopics);
    }
    
    res.json(topics);
});

// API endpoint to get a specific topic by ID
app.get('/api/topics/:id', (req, res) => {
    const topicId = req.params.id;
    const topic = storyGenerator.handleGetTopicById(topicId);
    
    if (!topic) {
        return res.status(404).json({ error: 'Topic not found' });
    }
    
    res.json(topic);
});

// API endpoint to get entities based on story type
app.get('/api/entities', (req, res) => {
    const categoryType = req.query.category || 'normal';
    const entities = storyGenerator.handleGetEntities(categoryType);
    res.json(entities);
});

// API endpoint to generate story prompt
app.post('/api/generate-prompt', asyncHandler(async (req, res) => {
    const { prompt: userPrompt, age: ageStr, topicId, entityIds, category = 'normal' } = req.body;
    const age = parseInt(ageStr) || 8; // Default to 8 if not provided
    
    const result = await storyGenerator.handleGeneratePrompt({
        prompt: userPrompt,
        age,
        topicId,
        entityIds,
        category
    });
    
    res.json({
        status: 'success',
        message: 'Prompt generated successfully',
        structured_prompt: result.prompt,
        topic: result.topic,
        aspect: result.topic.aspects ? result.topic.aspects[0] : '',
        characters: result.characters || []
    });
}));

// API endpoint to generate a story
app.post('/api/generate-story', asyncHandler(async (req, res) => {
    console.log('Received generate-story request:', JSON.stringify(req.body, null, 2));
    const { 
        userPrompt, 
        topicId, 
        entityIds, 
        category = 'normal', 
        age
    } = req.body;
    
    // Get force flags from query parameters
    const forceOpenAIStory = req.query.forceOpenAIStory === 'true';
    const forceOpenAITTS = req.query.forceOpenAITTS === 'true';
    
    const result = await storyGenerator.handleGenerateStory({
        userPrompt,
        topicId,
        entityIds,
        category,
        age: parseInt(age, 10) || 8,
        forceOpenAIStory: forceOpenAIStory === true,
        forceOpenAITTS: forceOpenAITTS === true
    });
    
    res.json(result);
}));

// API endpoint to generate speech using OpenAI TTS
app.post('/api/generate-speech', asyncHandler(async (req, res) => {
    const { text, voice = 'alloy', speed = 1.0 } = req.body;
    
    if (!text) {
        return res.status(400).json({ error: 'Text is required' });
    }

    try {
        const audioBuffer = await generateSpeech(text, { voice, speed });
        
        res.set({
            'Content-Type': 'audio/mpeg',
            'Transfer-Encoding': 'chunked'
        });
        
        res.send(Buffer.from(audioBuffer));
    } catch (error) {
        console.error('Error generating speech:', error);
        res.status(500).json({ 
            error: 'Failed to generate speech',
            details: error.message 
        });
    }
}));

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
