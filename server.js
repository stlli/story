if (process.env.NODE_ENV !== 'production') {
    const dotenv = await import('dotenv');
    dotenv.config();
}
import express from 'express';
import path from 'path';
import cors from 'cors';
import storyGenerator from './services/StoryGenerator.js';
import { generateSpeech } from './services/openaiTtsService.js';
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
const port = process.env.PORT || 3000;

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
