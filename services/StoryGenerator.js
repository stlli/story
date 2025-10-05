import path from 'path';
import { generateStoryPrompt, generatePokemonFlightStory } from '../data/promptTemplates.js';
import { generateStoryFromPrompt, generateStreamingStory } from './llmService.js';
import { ALL_CATEGORIES as allCategories, ALL_ENTITIES as allEntities } from '../data/data.js';
import { CATEGORY } from './enum.js';

const DEFAULT_AGE = 8;
// Word count targets for story generation
const MIN_PROMPT_LENGTH = 500;  // Minimum word count for the story
const MAX_PROMPT_LENGTH = 800;  // Maximum word count for the story

class StoryGenerator {
    constructor() {
        this.ALL_CATEGORIES = allCategories;
        this.ALL_ENTITIES = allEntities;
        this.storyMemory = new Map(); // Store story progression by storyId
    }
    
    /**
     * Updates the story memory with new events and details
     * @param {string} storyId - Unique identifier for the story
     * @param {Object} storyData - Story data to store
     * @param {string} [storyData.title] - Title of the story
     * @param {string} [storyData.summary] - Brief summary of the story
     * @param {Array} [storyData.characters] - Array of character objects
     * @param {string} [storyData.setting] - Description of the story setting
     * @param {Array} [storyData.events] - Array of story events that have occurred
     * @param {Object} [storyData.metadata] - Additional metadata about the story
     */
    updateStoryMemory(storyId, storyData) {
        if (!storyId) return;
        
        const currentMemory = this.storyMemory.get(storyId) || {
            title: '',
            summary: '',
            characters: [],
            setting: '',
            events: [],
            metadata: {},
            lastUpdated: new Date().toISOString()
        };
        
        // Update only provided fields
        const updatedMemory = {
            ...currentMemory,
            ...storyData,
            lastUpdated: new Date().toISOString()
        };
        
        this.storyMemory.set(storyId, updatedMemory);
        return updatedMemory;
    }
    
    /**
     * Adds a new event to the story's memory
     * @param {string} storyId - Unique identifier for the story
     * @param {string} eventType - Type of event (e.g., 'introduction', 'conflict', 'resolution')
     * @param {string} description - Description of the event
     * @param {Object} [details] - Additional details about the event
     */
    addStoryEvent(storyId, eventType, description, details = {}) {
        const event = {
            type: eventType,
            description,
            timestamp: new Date().toISOString(),
            ...details
        };
        
        const currentMemory = this.storyMemory.get(storyId) || { events: [] };
        const updatedEvents = [...(currentMemory.events || []), event];
        
        return this.updateStoryMemory(storyId, { events: updatedEvents });
    }
    
    /**
     * Retrieves the current state of a story's memory
     * @param {string} storyId - Unique identifier for the story
     * @returns {Object} The story's memory object
     */
    getStoryMemory(storyId) {
        return this.storyMemory.get(storyId) || null;
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

        console.log('=== GENERATED PROMPT ===', storyPrompt);
        
        return {
            story: `This is a generated ${category} story based on the topic "${storyPrompt}" and characters: ${selectedEntities.map(e => e.character.name).join(', ')}.`,
            prompt: storyPrompt,
            category,
            topic,
            characters: selectedEntities.map(e => e.character.name)
        };
    }

     // Parse the JSON response from the story generation
     parseStoryResponse(storyContent, age, category) {
        try {
            // First, try to find the JSON part of the response
            const jsonStart = storyContent.indexOf('{');
            const jsonEnd = storyContent.lastIndexOf('}') + 1;
            
            if (jsonStart === -1 || jsonEnd === 0) {
                throw new Error('No JSON found in response');
            }
            
            const jsonStr = storyContent.substring(jsonStart, jsonEnd);
            const result = JSON.parse(jsonStr);
            
            // Log memories for debugging
            if (result.memories && typeof result.memories === 'object') {
                console.log('=== MEMORIES (DEBUG) ===');
                console.log('Total memories:', Object.keys(result.memories).length);
                Object.entries(result.memories).forEach(([character, memory], index) => {
                    console.log(`\nMemory #${index + 1}:`);
                    console.log(`- Character: ${character}`);
                    console.log(`- Memory: ${memory}`);
                });
                console.log('========================');
            } else {
                console.log('No memories found in the response');
            }
            
            // Return just the story content for now
            return result;
        } catch (error) {
            console.error('Error parsing story response:', error);
            // Fallback to treating the entire content as the story
            return {
                story: storyContent,
                metadata: {
                    title: 'Generated Story',
                    age_group: age,
                    topic: category,
                    word_count: storyContent.split(/\s+/).length,
                    characters: [],
                    generatedAt: new Date().toISOString()
                },
                memories: []
            };
        }
    };
    
    /**
     * Handles story generation with optional flags to force OpenAI usage
     * @param {Object} params - Story generation parameters
     * @param {string} params.userPrompt - The user's story prompt
     * @param {string} params.topicId - ID of the selected topic
     * @param {string[]} params.entityIds - Array of entity IDs
     * @param {string} [params.category=normal] - Story category
     * @param {number} [params.age=8] - Target age group
     * @param {boolean} [params.forceOpenAIStory] - Force using OpenAI for story generation
     * @param {boolean} [params.forceOpenAITTS] - Force using OpenAI for TTS
     * @returns {Promise<Object>} Generated story and metadata
     */

    async handleGenerateStory({ 
        userPrompt, 
        topicId, 
        entityIds, 
        category = 'normal', 
        age = 8,
        forceOpenAIStory = true,
        forceOpenAITTS = false,
        onChunk
    }) {
        try {
            // First get the basic prompt structure
            const promptData = this.handleGeneratePrompt({
                userPrompt,
                topicId,
                entityIds,
                category,
                age
            });
            
           
            
            // Generate the story content with streaming support
            const storyContent = await generateStreamingStory(
                promptData.prompt, 
                age, 
                // TODO: Use the passed onchunk to enable streaming.
                null, // onChunk, 
                0.7, 
                1000, 
                forceOpenAIStory
            );
            
            // Parse the story content and extract story and memories
            const parsedResponse = this.parseStoryResponse(storyContent, age, category);
            
            // Store and log memories for debugging
            if (parsedResponse.memories?.length > 0) {
                console.log('=== MEMORY DEBUGGING ===');
                console.log(`Processed ${parsedResponse.memories.length} memories`);
                
                parsedResponse.memories.forEach((memory, index) => {
                    console.log(`\nMemory #${index + 1}:`);
                    console.log(`- Character: ${memory.character}`);
                    console.log(`- Memory: ${memory.memory}`);
                    console.log(`- Timestamp: ${memory.timestamp}`);
                    console.log(`- Context: ${memory.story_context}`);
                    if (memory.character_traits?.length) {
                        console.log(`- Traits: ${memory.character_traits.join(', ')}`);
                    }
                    if (memory.relationships) {
                        console.log(`- Relationship: ${memory.relationships.with_character} (${memory.relationships.type})`);
                    }
                });
                console.log('========================');
                
                // Here you can add code to store memories in your vector database
                // For example: await memoryDatabase.storeMemories(parsedResponse.memories);
            }
            
            // Only return the story content and basic metadata to the client
            return parsedResponse.story;
        } catch (error) {
            console.error('Error generating story with LLM:', error);
            
            // Fall back to the basic prompt if LLM fails
            return this.handleGeneratePrompt({
                userPrompt,
                topicId,
                entityIds,
                category,
                age
            });
        }
    }
}

const storyGenerator = new StoryGenerator();
export default storyGenerator;
