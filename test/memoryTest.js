import dotenv from 'dotenv';
dotenv.config();

import { VectorDB } from '../services/vectorDB.js';

// Create a single instance
const vectorDB = new VectorDB();

async function runMemoryTest() {
    try {
        const characterId = 'test-character-1';
        const storyId = 'test-story-1';
        
        console.log('=== Starting Memory System Test ===\n');
        
        // Test 1: Store a new memory
        console.log('1. Storing test memories...');
        const memory1 = await vectorDB.storeMemory(
            characterId, 
            'The dragon attacked the village at dawn, setting fire to the thatched roofs.',
            storyId,
            { sentiment: 'negative', importance: 'high' }
        );
        
        const memory2 = await vectorDB.storeMemory(
            characterId,
            'Found a hidden treasure map in the old oak tree near the river.',
            storyId,
            { sentiment: 'positive', importance: 'medium' }
        );
        
        console.log('✓ Stored test memories\n');
        
        // Test 2: Retrieve memories
        console.log('2. Retrieving relevant memories...');
        const relevantMemories = await vectorDB.searchSimilarMemories(
            characterId,
            'fire attack',
            3
        );
        
        console.log('Found relevant memories:', relevantMemories.map(m => ({
            text: m.text.substring(0, 50) + '...',
            score: m.score.toFixed(3)
        })));
        
        // Test 3: Get all memories
        console.log('\n3. Getting all memories...');
        const allMemories = await vectorDB.getCharacterMemories(characterId, 10);
        console.log(`Retrieved ${allMemories.length} memories for character ${characterId}`);
        
        // Test 4: Test memory strength calculation
        console.log('\n4. Testing memory strength...');
        const memoryStrength = vectorDB.calculateMemoryStrength({
            lastAccessed: new Date().toISOString(),
            accessCount: 5
        });
        console.log(`Memory strength for frequently accessed memory: ${memoryStrength.toFixed(2)}`);
        
        // Test 5: Cleanup (uncomment to delete test data)
        // console.log('\n5. Cleaning up test data...');
        // await vectorDB.index.deleteMany([memory1, memory2]);
        // console.log('✓ Test data cleaned up');
        
        console.log('\n=== Memory System Test Complete ===');
        
    } catch (error) {
        console.error('Test failed:', error);
    }
}

// Run the test
runMemoryTest();
