const path = require('path');
const { generateStoryPrompt, generatePokemonFlightStory } = require('../data/promptTemplates');

const DEFAULT_AGE = 8;
const MIN_PROMPT_LENGTH = 300;
const MAX_PROMPT_LENGTH = 500;

class StoryGenerator {
    constructor() {
        const { ALL_CATEGORIES, ALL_ENTITIES } = require('../data/data');
        this.ALL_CATEGORIES = ALL_CATEGORIES;
        this.ALL_ENTITIES = ALL_ENTITIES;
    }
    
    getRandomElements(array, count) {
        const shuffled = [...array].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, Math.min(count, array.length));
    }
    
    // API Handlers
    handleGetCategories(categoryType) {
        return this.ALL_CATEGORIES[categoryType] || [];
    }
    
    handleGetAllTopics() {
        return Object.values(this.ALL_CATEGORIES)
            .flatMap(categories => categories.flatMap(category => category.subtopics));
    }
    
    handleGetTopicById(topicId) {
        const allTopics = this.handleGetAllTopics();
        return allTopics.find(topic => topic.id === topicId);
    }
    
    handleGetEntities(categoryType) {
        if (categoryType === 'all') {
            return Object.values(this.ALL_ENTITIES).flat();
        }
        return this.ALL_ENTITIES[categoryType] || [];
    }
    
    handleGeneratePrompt({ userPrompt, age, topicId, entityIds, category = 'normal' }) {
        const categories = this.ALL_CATEGORIES[category] || [];
        let allEntities = [];
        
        // Handle Disney entities differently as they're already in the right format
        if (category === 'disney') {
            allEntities = this.ALL_ENTITIES.disney || [];
        } else {
            allEntities = this.ALL_ENTITIES[category] || [];
        }
        
        let topic = null;
        
        // If topicId is provided, try to find the topic
        if (topicId) {
            // Flatten topics to find the selected one
            const allTopics = categories.flatMap(cat => cat.subtopics || []);
            
            // Try to find topic by full ID first, then by ID suffix if not found
            topic = allTopics.find(t => t.id === topicId) ||
                   allTopics.find(t => t.id.endsWith(topicId) || topicId.endsWith(t.id));
            
            if (!topic) {
                console.warn(`Topic with ID '${topicId}' not found.`);
            }
        }
        
        // Find selected entities - handle both old and new entity structures
        const selectedEntities = entityIds
            .map(id => {
                // First try exact match
                let entity = allEntities.find(e => e.id === id);
                
                // If not found, try matching by name (for backward compatibility)
                if (!entity) {
                    entity = allEntities.find(e => 
                        e.name && e.name.toLowerCase() === id.toLowerCase() ||
                        e.character?.name?.toLowerCase() === id.toLowerCase()
                    );
                }
                
                // If still not found, try partial match
                if (!entity) {
                    entity = allEntities.find(e => 
                        e.id.includes(id) || id.includes(e.id) ||
                        (e.name && e.name.toLowerCase().includes(id.toLowerCase())) ||
                        (e.character?.name && e.character.name.toLowerCase().includes(id.toLowerCase()))
                    );
                }
                
                return entity;
            })
            .filter(Boolean);
            
        if (selectedEntities.length === 0) {
            throw new Error('No valid characters selected');
        }
        
        // Generate the appropriate story prompt based on category
        let storyPrompt;
        const { CATEGORY } = require('./enum');
        
        // Handle character descriptions for both old and new entity structures
        const characterDescriptions = selectedEntities.map(entity => {
            // New structure has character as a direct property, old structure has it nested under 'character'
            const char = entity.character || entity;
            const name = char.name || 'Unknown Character';
            const role = char.role || char.background?.role || 'Character';
            const origin = char.background?.origin_story || char.background?.originStory || 'No background information available';
            
            return `${name} (${role}): ${origin}`;
        }).join('\n- ');
        
        // Create the prompt based on what's available
        let storyContext = '';
        
        if (topic && userPrompt) {
            // Both topic and user prompt are provided - combine them
            storyContext = `${topic?.category || category}: ${topic.name} and ${userPrompt}`;
        } else if (topic) {
            // Only topic is provided
            storyContext = `${topic?.category || category}: ${topic.name}`;
        } else if (userPrompt) {
            // Only user prompt is provided
            storyContext = userPrompt;
        } else {
            // Neither is provided - use a default
            storyContext = 'Creative Story';
        }

        if (category === CATEGORY.POKEMON) {
            storyPrompt = generatePokemonFlightStory(
            storyContext,
            characterDescriptions,
            storyContext,
            age || DEFAULT_AGE,
            MIN_PROMPT_LENGTH + 200,
            MAX_PROMPT_LENGTH + 200
        );
        } else {
            storyPrompt = generateStoryPrompt(
                storyContext,
                characterDescriptions,
                storyContext,
                age || DEFAULT_AGE,
                MIN_PROMPT_LENGTH,
                MAX_PROMPT_LENGTH
            );
        }
        
        return {
            story: `This is a generated ${category} story based on the topic "${storyPrompt}" and characters: ${selectedEntities.map(e => e.character.name).join(', ')}.`,
            prompt: storyPrompt,
            category,
            topic,
            characters: selectedEntities.map(e => e.character.name)
        };
    }
    
    async handleGenerateStory({ userPrompt, topicId, entityIds, category = 'normal', age = 8 }) {
        // Reuse the handleGeneratePrompt logic since it's very similar
        const result = this.handleGeneratePrompt({
            userPrompt,
            topicId,
            entityIds,
            category,
            age
        });
        
        // In a real implementation, you might want to add additional story-specific logic here
        // For now, we'll just return the result as is
        return result;
    }
}

module.exports = new StoryGenerator();
