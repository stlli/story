const path = require('path');
const { PREDEFINED_ENTITIES } = require('../data/entities');
const { POKEMON_ENTITIES } = require('../data/entities_pm');
const { NORMAL_TOPICS } = require('../data/topics');
const { TOPICS_PM } = require('../data/topics_pm');
const { generateStoryPrompt, generatePokemonFlightStory } = require('../data/promptTemplates');

const DEFAULT_AGE = 8;
const MIN_PROMPT_LENGTH = 300;
const MAX_PROMPT_LENGTH = 500;

class StoryGenerator {
    constructor() {
        // Create category structures
        this.NORMAL_CATEGORIES = this.createCategoryStructure(NORMAL_TOPICS, 'normal');
        this.POKEMON_CATEGORIES = this.createCategoryStructure(TOPICS_PM, 'pokemon');
        
        // Combine all categories for easy access
        this.ALL_CATEGORIES = {
            normal: this.NORMAL_CATEGORIES,
            pokemon: this.POKEMON_CATEGORIES
        };
        
        // Add IDs to entities for easier reference
        this.NORMAL_ENTITIES = PREDEFINED_ENTITIES.map((entity, index) => ({
            id: `normal-entity-${index}`,
            type: 'normal',
            ...entity
        }));
        
        this.POKEMON_ENTITIES_WITH_IDS = POKEMON_ENTITIES.map((entity, index) => ({
            id: `pokemon-entity-${index}`,
            type: 'pokemon',
            ...entity
        }));
        
        this.ALL_ENTITIES = {
            normal: this.NORMAL_ENTITIES,
            pokemon: this.POKEMON_ENTITIES_WITH_IDS
        };
    }
    
    createCategoryStructure(topics, categoryName) {
        return topics.map(category => ({
            id: `${categoryName}-${category.category.toLowerCase().replace(/\s+/g, '-')}`,
            name: category.category,
            type: categoryName,
            subtopics: category.subtopics.map(subtopic => ({
                id: `${categoryName}-${category.category.toLowerCase().replace(/\s+/g, '-')}-${subtopic.name.toLowerCase().replace(/\s+/g, '-')}`,
                name: subtopic.name,
                aspects: subtopic.aspects,
                category: category.category,
                type: categoryName
            }))
        }));
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
        return this.ALL_ENTITIES[categoryType] || [];
    }
    
    handleGeneratePrompt({ userPrompt, age, topicId, entityIds, category = 'normal' }) {
        const categories = this.ALL_CATEGORIES[category] || [];
        const allEntities = this.ALL_ENTITIES[category] || [];
        
        let topic = null;
        
        // If topicId is provided, try to find the topic
        if (topicId) {
            // Flatten topics to find the selected one
            const allTopics = categories.flatMap(cat => cat.subtopics);
            
            // Try to find topic by full ID first, then by ID suffix if not found
            topic = allTopics.find(t => t.id === topicId) ||
                   allTopics.find(t => t.id.endsWith(topicId) || topicId.endsWith(t.id));
            
            if (!topic) {
                console.warn(`Topic with ID '${topicId}' not found.`);
            }
        }
        
        // Find selected entities
        const selectedEntities = entityIds
            .map(id => allEntities.find(e => e.id === id))
            .filter(Boolean);
            
        if (selectedEntities.length === 0) {
            throw new Error('No valid characters selected');
        }
        
        // Generate the appropriate story prompt based on category
        let storyPrompt;
        const { CATEGORY } = require('./enum');
        const characterDescriptions = selectedEntities.map(entity => 
            `${entity.character.name} (${entity.character.role}): ${entity.character.background?.origin_story || ''}`
        ).join('\n- ');
        
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
