const express = require('express');
const path = require('path');
const cors = require('cors');
const storyGenerator = require('./services/StoryGenerator');

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
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(cors());

// Log static file requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

// API endpoint to get available category types
app.get('/api/category-types', (req, res) => {
    const categories = Object.keys(storyGenerator.ALL_CATEGORIES).map(key => ({
        id: key,
        name: key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    }));
    res.json(categories);
});

// API endpoint to get categories with their topics based on story type
app.get('/api/categories', (req, res) => {
    const categoryType = req.query.category || 'normal';
    const categories = storyGenerator.handleGetCategories(categoryType);
    res.json(categories);
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
    const { userPrompt, topicId, entityIds, category = 'normal', age } = req.body;
    
    const result = await storyGenerator.handleGenerateStory({
        userPrompt,
        topicId,
        entityIds,
        category,
        age: age || 8
    });
    
    res.json(result);
}));

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
