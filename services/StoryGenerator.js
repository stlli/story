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
    
    handleGeneratePrompt({ prompt, age, topicId, entityIds, category = 'normal' }) {
        const categories = this.ALL_CATEGORIES[category] || [];
        const allEntities = this.ALL_ENTITIES[category] || [];
        
        // Flatten topics to find the selected one
        const allTopics = categories.flatMap(cat => cat.subtopics);
        
        // Try to find topic by full ID first, then by ID suffix if not found
        let topic = allTopics.find(t => t.id === topicId);
        
        // If not found by full ID, try to match by the end of the ID
        if (!topic) {
            topic = allTopics.find(t => t.id.endsWith(topicId) || topicId.endsWith(t.id));
        }
        
        if (!topic) {
            console.error('Topic not found. Available topics:', allTopics.map(t => t.id));
            throw new Error('Invalid topic selected');
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
            `${entity.character.name} (${entity.character.role}): ${entity.character.background?.origin_story}`
        ).join('\n- ');
        
        storyPrompt = generatePokemonFlightStory(
            `${topic.category}: ${topic.name}`,
            characterDescriptions,
            topic.name,
            age || DEFAULT_AGE,
            MIN_PROMPT_LENGTH,
            MAX_PROMPT_LENGTH
        );
        
        return {
            story: `This is a generated ${category} story based on the topic "${topic.name}" and characters: ${selectedEntities.map(e => e.character.name).join(', ')}.\n\n${storyPrompt}`,
            prompt: storyPrompt,
            category,
            topic,
            characters: selectedEntities.map(e => e.character.name)
        };
    }
    
    async handleGenerateStory({ topicId, entityIds, category = 'normal', age = 8 }) {
        // Reuse the handleGeneratePrompt logic since it's very similar
        const result = this.handleGeneratePrompt({
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
