import path from 'path';
import { generateStoryPrompt, generatePokemonFlightStory } from '../data/promptTemplates.js';
import { generateStoryFromPrompt, generateStreamingStory } from './llmService.js';
import { ALL_CATEGORIES as allCategories, ALL_ENTITIES as allEntities } from '../data/data.js';
import { CATEGORY } from './enum.js';
import { VectorDB } from './vectorDB.js';

const DEFAULT_AGE = 8;
// Word count targets for story generation
const MIN_PROMPT_LENGTH = 300;  // Minimum word count for the story
const MAX_PROMPT_LENGTH = 500;  // Maximum word count for the story

/**
 * Finds a topic by its full ID or ID suffix if not found
 * @param {string} topicId - The ID of the topic to find
 * @param {Array<Topic>} categories - The categories to search for the topic
 * @returns {Topic | null} - The found topic or null if not found
 */
function findTopicById(topicId, categories) {
    const allTopics = categories.flatMap(cat => cat.subtopics || []);
    
    // Try to find topic by full ID first, then by ID suffix if not found
    return allTopics.find(t => t.id === topicId) ||
            allTopics.find(t => t.id.endsWith(topicId) || (topicId && t.id && topicId.endsWith(t.id)));
}
  
function getStoryContext(topic, userPrompt, category) {
    if (topic && userPrompt) {
        // Both topic and user prompt are provided - combine them
        return `${topic?.category || category}: ${topic.name} and ${userPrompt}`;
    } else if (topic) {
        // Only topic is provided
        return `${topic?.category || category}: ${topic.name}`;
    } else if (userPrompt) {
        // Only user prompt is provided
        return userPrompt;
    } else {
        // Neither is provided - use a default
        return 'Creative Story';
    }
}

class StoryGenerator {
    constructor() {
        this.ALL_CATEGORIES = allCategories;
        this.ALL_ENTITIES = allEntities;
        this.vectorDB = new VectorDB();
    }

    async initialize() {
        try {
            await this.vectorDB.ensureInitialized();
            console.log('VectorDB initialized successfully');
        } catch (error) {
            console.error('Failed to initialize VectorDB:', error);
            throw error;
        }
    }
    

    /**
     * Stores character memories in the vector database
     * @param {string} storyId - The ID of the story
     * @param {Object} memories - Object with character memories
     * @param {string} [storySummary=''] - Optional story summary to include with memories
     * @returns {Promise<Array>} - Array of memory storage results
     */
    async storeCharacterMemories(storyId, memories, storySummary = '') {
        if (!storyId || !memories || typeof memories !== 'object') {
            throw new Error('Invalid storyId or memories object');
        }

        const results = [];
        
        for (const [characterName, memoryText] of Object.entries(memories)) {
            if (memoryText && typeof memoryText === 'string') {
                try {
                    // Find character ID from ALL_ENTITIES or use name as fallback
                    let characterId = characterName;
                    if (this.ALL_ENTITIES && typeof this.ALL_ENTITIES === 'object') {
                        for (const category of Object.values(this.ALL_ENTITIES)) {
                            if (Array.isArray(category)) {
                                const entity = category.find(e => 
                                    e.character && 
                                    (e.character.name === characterName || e.id === characterName)
                                );
                                if (entity) {
                                    characterId = entity.id || characterName;
                                    break;
                                }
                            }
                        }
                    }

                    // Prepend story summary to the memory if available
                    const memoryWithContext = storySummary 
                        ? `[Story Context: ${storySummary}]\n\n${memoryText}`
                        : memoryText;

                    // Store the memory in VectorDB
                    const memoryId = await this.vectorDB.storeMemory(
                        characterId,
                        memoryWithContext,
                        storyId,
                        {
                            type: 'character_memory',
                            characterName,
                            characterId,
                            storyId,
                            timestamp: new Date().toISOString(),
                            hasStoryContext: !!storySummary
                        }
                    );

                    results.push({ 
                        characterName, 
                        characterId,
                        memoryId, 
                        success: true,
                        hasStoryContext: !!storySummary
                    });
                } catch (error) {
                    console.error(`Error storing memory for ${characterName}:`, error);
                    results.push({ 
                        characterName, 
                        success: false, 
                        error: error.message 
                    });
                }
            }
        }
        
        return results;
    }

    /**
     * Gets relevant memories for a character
     * @param {string} characterId - The ID of the character
     * @param {string} query - The search query to find relevant memories
     * @param {number} [limit=3] - Maximum number of memories to return
     * @returns {Promise<Array>} - Array of relevant memories
     */
    async getCharacterMemories(characterId, query, limit = 3) {
        try {
            return await this.vectorDB.searchSimilarMemories(
                characterId, 
                query, 
                limit
            );
        } catch (error) {
            console.error(`Error getting memories for character ${characterId}:`, error);
            return [];
        }
    }

    /**
     * Gets all memories for a character
     * @param {string} characterId - The ID of the character
     * @param {number} [limit=10] - Maximum number of memories to return
     * @returns {Promise<Array>} - Array of character memories
     */
    async getAllCharacterMemories(characterId, limit = 10) {
        try {
            return await this.vectorDB.getCharacterMemories(
                characterId, 
                limit
            ) || [];
        } catch (error) {
            console.error(`Error getting all memories for character ${characterId}:`, error);
            return [];
        }
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
    
    handleGeneratePrompt({ userPrompt, age, topicId, entityIds = [], category = 'normal', characterMemories = {}, characterContexts = {} }) {
        const categories = this.ALL_CATEGORIES[category] || [];
        
        // Get all entities for the category
        let allEntities = [];
        if (category === 'disney') {
            allEntities = this.ALL_ENTITIES.disney || [];
        } else if (category === 'all') {
            // If 'all' category, flatten all entity types
            allEntities = Object.values(this.ALL_ENTITIES).flat();
        } else {
            allEntities = this.ALL_ENTITIES[category] || [];
        }
        
        const topic = findTopicById(topicId, categories);
        
        
        // Find selected entities - handle both old and new entity structures
        let selectedEntities = [];
        
        // Debug log to help diagnose entity selection
        console.log('Available entities:', allEntities.map(e => ({
            id: e.id,
            name: e.name || e.character?.name,
            type: e.type
        })));
        
        if (Array.isArray(entityIds) && entityIds.length > 0) {
            console.log('Looking for entity IDs:', entityIds);
            
            selectedEntities = entityIds
                .map(id => {
                    if (!id) return null;
                    
                    // Try exact match first
                    let entity = allEntities.find(e => e && e.id === id);
                    
                    // If not found, try matching by character name
                    if (!entity) {
                        entity = allEntities.find(e => 
                            e && e.character && e.character.name && 
                            e.character.name.toLowerCase() === String(id).toLowerCase()
                        );
                    }
                    
                    // Try matching by entity name
                    if (!entity) {
                        entity = allEntities.find(e => 
                            e && e.name && e.name.toLowerCase() === String(id).toLowerCase()
                        );
                    }
                    
                    if (entity) {
                        console.log(`Found entity for ${id}:`, {
                            id: entity.id,
                            name: entity.name || entity.character?.name,
                            type: entity.type
                        });
                    } else {
                        console.warn(`Could not find entity with ID/name: ${id}`);
                    }
                    
                    return entity;
                })
                .filter(Boolean);
        }
        
        if (!selectedEntities || selectedEntities.length === 0) {
            console.error('No valid characters selected. Entity IDs:', entityIds);
            console.error('Available entity types:', Object.keys(this.ALL_ENTITIES));
            throw new Error('No valid characters selected. Please select at least one character.');
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
        let storyContext = getStoryContext(topic, userPrompt, category);
      
        if (category === CATEGORY.POKEMON) {
            storyPrompt = generatePokemonFlightStory(
            storyContext,
            characterDescriptions,
            storyContext,
            age || DEFAULT_AGE,
            MIN_PROMPT_LENGTH + 200,
            MAX_PROMPT_LENGTH + 200,
            characterMemories
        );
        } else {
            storyPrompt = generateStoryPrompt(
                storyContext,
                characterDescriptions,
                storyContext,
                age || DEFAULT_AGE,
                MIN_PROMPT_LENGTH,
                MAX_PROMPT_LENGTH,
                characterMemories
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
            let result;
            
            // Handle both string and object inputs
            if (typeof storyContent === 'string') {
                // Try to find the JSON part of the response if it's a string
                const jsonStart = storyContent.indexOf('{');
                const jsonEnd = storyContent.lastIndexOf('}') + 1;
                
                if (jsonStart === -1 || jsonEnd === 0) {
                    throw new Error('No JSON found in response');
                }
                
                const jsonStr = storyContent.substring(jsonStart, jsonEnd);
                result = JSON.parse(jsonStr);
            } else if (typeof storyContent === 'object' && storyContent !== null) {
                // If it's already an object, use it directly
                result = storyContent;
            } else {
                throw new Error('Invalid story content format');
            }
            
            // Log summary and memories for debugging
            console.log('=== STORY RESPONSE ===');
            if (result.summary) {
                console.log('Summary:', result.summary);
            } else {
                console.warn('No summary found in the response');
                // Generate a simple summary from the story if not provided
                const sentences = result.story.split(/[.!?]+/).filter(s => s.trim().length > 0);
                result.summary = sentences.slice(0, 3).join('. ') + '.';
                console.log('Generated summary:', result.summary);
            }

            if (result.memories && typeof result.memories === 'object') {
                console.log('=== MEMORIES ===');
                console.log('Total memories:', Object.keys(result.memories).length);
                Object.entries(result.memories).forEach(([character, memory], index) => {
                    console.log(`\nMemory #${index + 1}:`);
                    console.log(`- Character: ${character}`);
                    console.log(`- Memory: ${memory}`);
                });
            } else {
                console.warn('No memories found in the response');
                result.memories = {}; // Ensure we have an empty object
            }
            console.log('===================');
            
            // Return the parsed response with story, summary, and memories
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
     * @param {string} [params.storyId] - Unique ID for the story
     * @returns {Promise<Object>} Generated story and metadata
     */

    async handleGenerateStory(params) {
        // Destructure with defaults
        const {
            userPrompt = '',
            topicId = null,
            entityIds = [],
            category = 'normal',
            age = 8,
            forceOpenAIStory = true,
            forceOpenAITTS = false,
            onChunk = null,
            storyId = `story-${Date.now()}`
        } = params || {};
        try {
            // Get selected entities based on category
            const categoryEntities = this.ALL_ENTITIES[category] || [];
            const selectedEntities = categoryEntities.filter(entity => 
                entityIds.includes(entity.id) || 
                (entity.character && entityIds.includes(entity.character.id))
            );
            
            if (selectedEntities.length === 0) {
                console.warn(`No entities found for category: ${category}`);
            }

            // Get relevant memories for each character
            const characterMemories = {};
            const characterContexts = {};
            
            // First, collect all character memories and contexts
            for (const entity of selectedEntities) {
                if (entity.character && entity.character.name) {
                    const characterId = entity.id || entity.character.id;
                    const characterName = entity.character.name;
                    
                    try {
                        // Get relevant memories based on the user prompt
                        const categories = this.ALL_CATEGORIES[category] || [];

                        const relevantMemories = await this.getCharacterMemories(
                            characterId,
                            getStoryContext(findTopicById(topicId, categories), userPrompt, category),
                            3 // Get top 3 most relevant memories
                        );
                        
                        // Get general character context (most recent memories)
                        const generalMemories = await this.getAllCharacterMemories(
                            characterId,
                            5 // Get 5 most recent memories
                        );
                        
                        // Store relevant memories for the prompt
                        if (relevantMemories?.length > 0) {
                            characterMemories[characterName] = relevantMemories
                                .map(m => m.text)
                                .join(' ');
                        }
                        
                        // Build character context from general memories
                        if (generalMemories?.length > 0) {
                            characterContexts[characterName] = {
                                id: characterId,
                                name: characterName,
                                memories: generalMemories.map(m => ({
                                    text: m.text,
                                    timestamp: m.metadata?.timestamp || new Date().toISOString(),
                                    relevance: m.score || 0
                                })),
                                traits: entity.character.traits || [],
                                relationships: entity.character.relationships || {}
                            };
                        }
                        
                        console.log(`Retrieved ${relevantMemories?.length || 0} relevant and ${generalMemories?.length || 0} general memories for ${characterName}`);
                    } catch (error) {
                        console.error(`Error getting memories for ${characterName}:`, error);
                    }
                }
            }
            
            // First get the basic prompt structure with character memories as context
            const promptData = this.handleGeneratePrompt({
                userPrompt,
                topicId,
                entityIds, // Add entityIds here
                category,
                age,
                characterMemories: Object.keys(characterMemories).length > 0 ? characterMemories : undefined,
                characterContexts: Object.keys(characterContexts).length > 0 ? characterContexts : undefined
            });
            
            // Add debug logging for the prompt data
            if (promptData.characterContexts) {
                console.log('Included character contexts in prompt:', 
                    Object.keys(promptData.characterContexts).join(', '));
            }
            
           
            
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

            console.log('Generated story content:', storyContent);
            
            // Parse the story content and extract story and memories
            const parsedResponse = this.parseStoryResponse(storyContent, age, category);
            
            // Store and log memories for debugging
            const memoriesByCharacter = {};
            
            if (parsedResponse.memories && typeof parsedResponse.memories === 'object') {
                const memoryEntries = Object.entries(parsedResponse.memories);
                if (memoryEntries.length > 0) {
                    console.log('=== MEMORY DEBUGGING ===');
                    console.log(`Processed ${memoryEntries.length} memories`);
                    
                    memoryEntries.forEach(([character, memory], index) => {
                        console.log(`\nMemory #${index + 1}:`);
                        console.log(`- Character: ${character}`);
                        
                        // Handle both string and object memory formats
                        if (typeof memory === 'string') {
                            console.log(`- Memory: ${memory}`);
                            // Add to memoriesByCharacter for storage
                            if (!memoriesByCharacter[character]) {
                                memoriesByCharacter[character] = [];
                            }
                            memoriesByCharacter[character].push(memory);
                        } else if (typeof memory === 'object' && memory !== null) {
                            // Handle object format
                            const memoryText = memory.memory || memory.text || 'No memory content';
                            console.log(`- Memory: ${memoryText}`);
                            
                            // Log additional properties if they exist
                            if (memory.timestamp) console.log(`- Timestamp: ${memory.timestamp}`);
                            if (memory.context) console.log(`- Context: ${memory.context}`);
                            if (memory.traits?.length) {
                                console.log(`- Traits: ${memory.traits.join(', ')}`);
                            }
                            
                            // Add to memoriesByCharacter for storage
                            if (!memoriesByCharacter[character]) {
                                memoriesByCharacter[character] = [];
                            }
                            memoriesByCharacter[character].push(memoryText);
                        }
                    });
                    console.log('========================');

                    // Store memories for each character with story summary
                    const memoryResults = [];
                    const storySummary = parsedResponse.summary || '';
                    
                    for (const [character, memories] of Object.entries(memoriesByCharacter)) {
                        try {
                            const memoryText = memories.join(' ');
                            const results = await this.storeCharacterMemories(
                                storyId,
                                { [character]: memoryText },
                                storySummary  // Pass the story summary to include with memories
                            );
                            memoryResults.push(...results);
                            console.log(`Stored ${memories.length} memories for ${character} ${storySummary ? 'with story context' : ''}`);
                        } catch (error) {
                            console.error(`Failed to store memories for ${character}:`, error);
                        }
                    }
                }
            }
            
            // Return the full parsed response including story, summary, and memories
            return {
                ...parsedResponse,  // Includes story, summary, and memories
                storyId,           // Add the story ID for reference
                generatedAt: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error generating story with LLM:', error);
            
            try {
                // Ensure we have character memories to work with
                const safeCharacterMemories = {};
                
                // Get all entities for the category
                const allEntities = this.ALL_ENTITIES[category] || [];
                let selectedEntities = [];
                
                // Find entities by IDs if we have them
                if (Array.isArray(entityIds)) {
                    selectedEntities = entityIds
                        .map(id => allEntities.find(e => e && e.id === id))
                        .filter(Boolean);
                }
                
                // Get memories for each selected entity
                for (const entity of selectedEntities) {
                    if (entity?.character?.name) {
                        try {
                            const memories = await this.getCharacterMemories(
                                entity.id || entity.character.id,
                                userPrompt,
                                3
                            );
                            if (memories?.length > 0) {
                                safeCharacterMemories[entity.character.name] = memories
                                    .map(m => m.text || '')
                                    .join(' ');
                            }
                        } catch (memError) {
                            console.error(`Error getting memories for ${entity.character?.name || 'unknown'}:`, memError);
                        }
                    }
                }
                
                // Fall back to a basic prompt with any available character memories
                const memoryTexts = Object.entries(safeCharacterMemories)
                    .filter(([_, memory]) => memory && memory.trim().length > 0)
                    .map(([char, memory]) => `${char} remembers: ${memory}`)
                    .join('\n');
                    
                const enhancedUserPrompt = memoryTexts 
                    ? `${userPrompt}\n\nCharacter Memories:\n${memoryTexts}`
                    : userPrompt;
                    
                // Create a simple fallback story
                return {
                    story: `Once upon a time, an unexpected error occurred while generating the story. ${enhancedUserPrompt}`,
                    memories: {}
                };
                
            } catch (fallbackError) {
                console.error('Error in fallback story generation:', fallbackError);
                
                // If all else fails, return a very basic error message
                return {
                    story: "I'm sorry, but I encountered an error while generating your story. Please try again.",
                    memories: {}
                };
            }
        }
    }
}

// Create and export a singleton instance
const storyGenerator = new StoryGenerator();
export default storyGenerator;
