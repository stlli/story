import dotenv from 'dotenv';
dotenv.config();

import { Pinecone } from '@pinecone-database/pinecone';
import { pipeline } from '@xenova/transformers';

class VectorDB {
    constructor() {
        this.pinecone = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY
        });
        this.embeddingModel = null;
        this.indexName = 'character-memories';
        this.initialized = false;
    }

    async ensureInitialized() {
        if (!this.initialized) {
            await this.initialize();
            this.initialized = true;
        }
    }

    async initialize() {
        try {
            // Initialize the embedding model
            this.embeddingModel = await pipeline(
                'feature-extraction',
                'Xenova/all-MiniLM-L6-v2'
            );
            console.log('Vector DB initialized with embedding model');
            
            // Initialize the Pinecone index
            this.index = this.pinecone.Index(this.indexName);
            
            try {
                // Try to describe the index to check if it exists and is accessible
                const stats = await this.index.describeIndexStats();
                console.log(`Using existing index: ${this.indexName}`, stats);
            } catch (error) {
                if (error.message.includes('404')) {
                    console.log(`Index ${this.indexName} does not exist, creating...`);
                    try {
                        await this.pinecone.createIndex({
                            name: this.indexName,
                            dimension: 384, // Dimension of the all-MiniLM-L6-v2 model
                            metric: 'cosine',
                            spec: {
                                serverless: {
                                    cloud: 'aws',
                                    region: 'us-east-1'  // Using us-east-1 which is supported in the free tier
                                }
                            }
                        });
                        console.log(`Created new index: ${this.indexName}`);
                        // Wait a bit for the index to be ready
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    } catch (createError) {
                        if (createError.message.includes('ALREADY_EXISTS')) {
                            console.log(`Index ${this.indexName} already exists, using it`);
                        } else {
                            console.error('Error creating Pinecone index:', createError);
                            throw createError;
                        }
                    }
                } else {
                    console.error('Error accessing Pinecone index:', error);
                    throw error;
                }
            }
            
            console.log(`Pinecone index ${this.indexName} is ready`);
            
        } catch (error) {
            console.error('Error initializing VectorDB:', error);
            throw error;
        }
    }

    async generateEmbedding(text) {
        try {
            await this.ensureInitialized();
            if (!this.embeddingModel) {
                throw new Error('Embedding model not initialized');
            }
            const output = await this.embeddingModel(text, {
                pooling: 'mean',
                normalize: true,
            });
            return Array.from(output.data);
        } catch (error) {
            console.error('Error generating embedding:', error);
            throw error;
        }
    }

    async storeMemory(characterId, memoryText, storyId, metadata = {}) {
        try {
            await this.ensureInitialized();
            
            // Check if we need to prune old memories first
            await this.pruneOldMemories(characterId);
            
            // Generate embedding for the new memory
            const embedding = await this.generateEmbedding(memoryText);
            const id = `memory_${Date.now()}_${characterId}`;
            const now = new Date().toISOString();
            
            // Store with additional metadata
            await this.index.upsert([{
                id,
                values: embedding,
                metadata: {
                    characterId,
                    text: memoryText,
                    storyId,
                    timestamp: now,
                    lastAccessed: now,
                    accessCount: 1,
                    strength: 1.0, // Start with full strength
                    ...metadata
                }
            }]);
            
            console.log(`Stored memory for character ${characterId}`);
            return id;
        } catch (error) {
            console.error('Error storing memory:', error);
            throw error;
        }
    }

    async searchSimilarMemories(characterId, query, topK = 3) {
        try {
            await this.ensureInitialized();
            const queryEmbedding = await this.generateEmbedding(query);
            
            // First, get the list of all vectors for this character
            const allMemories = await this.getCharacterMemories(characterId, 1000); // Get up to 1000 memories
            
            if (allMemories.length === 0) return [];
            
            // Calculate similarity scores
            const memoriesWithScores = await Promise.all(allMemories.map(async (memory) => {
                const memoryEmbedding = await this.generateEmbedding(memory.text);
                const score = this.cosineSimilarity(queryEmbedding, memoryEmbedding);
                return { ...memory, score };
            }));
            
            // Sort by score and take topK
            // Sort by score and take topK
            const topMemories = memoriesWithScores
                .sort((a, b) => b.score - a.score)
                .slice(0, topK);
            
            return topMemories.map(match => ({
                id: match.id,
                score: match.score,
                text: match.text,
                ...match
            }));
        } catch (error) {
            console.error('Error searching memories:', error);
            throw error;
        }
    }

    async getCharacterMemories(characterId, limit = 10) {
        try {
            await this.ensureInitialized();
            // For getting all memories, we'll use the filter to get only the ones for this character
            const results = await this.index.query({
                vector: new Array(384).fill(0), // Dummy vector for filtering
                filter: {
                    characterId: { $eq: characterId }
                },
                topK: limit,
                includeMetadata: true
            });
            
            // Update last accessed time and access count
            const now = new Date().toISOString();
            
            // Update each memory's last accessed time and increment access count
            const updatePromises = results.matches.map(async (match) => {
                try {
                    const currentMetadata = match.metadata || {};
                    await this.index.update({
                        id: match.id,
                        metadata: {
                            ...currentMetadata,
                            lastAccessed: now,
                            accessCount: (currentMetadata.accessCount || 0) + 1
                        }
                    });
                } catch (updateError) {
                    console.error('Error updating memory access info:', updateError);
                }
            });
            
            await Promise.all(updatePromises);
            
            return results.matches.map(match => ({
                id: match.id,
                score: match.score,
                text: match.metadata.text,
                ...match.metadata
            }));
        } catch (error) {
            console.error('Error getting character memories:', error);
            throw error;
        }
    }
    
    /**
     * Prunes old or less relevant memories when a character has too many
     * @param {string} characterId - The ID of the character
     * @param {number} [maxMemories=50] - Maximum number of memories to keep
     */
    async pruneOldMemories(characterId, maxMemories = 50) {
        try {
            // Get all memories for the character
            const allMemories = await this.getCharacterMemories(characterId, maxMemories * 2);
            
            if (allMemories.length <= maxMemories) return;
            
            // Sort by strength (combination of recency and access count)
            const now = new Date();
            const sortedMemories = allMemories
                .map(memory => ({
                    ...memory,
                    // Calculate strength: decays over time but boosted by access count
                    strength: this.calculateMemoryStrength(memory, now)
                }))
                .sort((a, b) => b.strength - a.strength);
            
            // Keep only the top N memories
            const memoriesToKeep = sortedMemories.slice(0, maxMemories);
            const memoriesToDelete = sortedMemories.slice(maxMemories);
            
            // Delete the least relevant memories
            if (memoriesToDelete.length > 0) {
                await this.index.deleteMany(memoriesToDelete.map(m => m.id));
                console.log(`Pruned ${memoriesToDelete.length} old memories for character ${characterId}`);
            }
            
            return memoriesToKeep;
        } catch (error) {
            console.error('Error pruning memories:', error);
            throw error;
        }
    }
    
    /**
     * Calculates the current strength of a memory based on age and access pattern
     * @param {Object} memory - The memory object
     * @param {Date} currentTime - Current time for calculation
     * @returns {number} Memory strength score
     */
    calculateMemoryStrength(memory, currentTime = new Date()) {
        const lastAccessed = new Date(memory.lastAccessed || memory.timestamp);
        const ageInDays = (currentTime - lastAccessed) / (1000 * 60 * 60 * 24);
        const accessCount = memory.accessCount || 1;
        
        // Decay factor based on age (halves every 30 days)
        const ageDecay = Math.pow(0.5, ageInDays / 30);
        
        // Boost based on access count (logarithmic scaling)
        const accessBoost = Math.log2(accessCount + 1);
        
        return ageDecay * accessBoost;
    }
    
    /**
     * Summarizes related memories to save space
     * @param {Array} memories - Array of related memories
     * @returns {Promise<string>} Combined summary of memories
     */
    async summarizeMemories(memories) {
        try {
            if (memories.length === 0) return '';
            if (memories.length === 1) return memories[0].text;
            
            // For now, just join with a period. In a real implementation,
            // you might want to use an LLM to generate a coherent summary
            return memories.map(m => m.text).join('. ') + '.';
        } catch (error) {
            console.error('Error summarizing memories:', error);
            return '';
        }
    }
    
    /**
     * Calculate cosine similarity between two vectors
     * @param {Array} a - First vector
     * @param {Array} b - Second vector
     * @returns {number} Cosine similarity score
     */
    cosineSimilarity(a, b) {
        if (a.length !== b.length) {
            throw new Error('Vectors must have the same length');
        }
        
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        
        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        
        normA = Math.sqrt(normA);
        normB = Math.sqrt(normB);
        
        if (normA === 0 || normB === 0) {
            return 0;
        }
        
        return dotProduct / (normA * normB);
    }
}

// Export the VectorDB class
export { VectorDB };
