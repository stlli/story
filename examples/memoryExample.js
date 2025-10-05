import dotenv from 'dotenv';
dotenv.config();

import storyGenerator from '../services/StoryGenerator.js';

async function runMemoryExample() {
    try {
        console.log('=== Memory Integration Example ===\n');
        
        const storyId = 'memory-example-story';
        const characterName = 'Alice';
        
        // 1. Store character memories
        console.log('1. Storing character memories...');
        const characterMemories = {
            'Alice': 'Alice found a magical key hidden under an ancient oak tree.',
            'Bob': 'Bob remembered the time he outsmarted the dragon with a clever riddle.',
            'Charlie': 'Charlie recalled the legend of the enchanted forest and its hidden treasures.'
        };
        
        const storageResults = await storyGenerator.storeCharacterMemories(storyId, characterMemories);
        console.log('Memory storage results:', storageResults);
        
        // 2. Search for relevant memories
        console.log('\n2. Searching for relevant memories...');
        const searchQuery = 'magical key';
        const relevantMemories = await storyGenerator.getCharacterMemories('Alice', searchQuery, 2);
        
        console.log(`Relevant memories for "${searchQuery}":`);
        if (relevantMemories && relevantMemories.length > 0) {
            relevantMemories.forEach((memory, i) => {
                console.log(`${i + 1}. ${memory.text} (Relevance: ${memory.score ? memory.score.toFixed(3) : 'N/A'})`);
            });
        } else {
            console.log('No relevant memories found.');
        }
        
        // 3. Get all memories for a character
        console.log('\n3. Getting all memories for Alice...');
        const allMemories = await storyGenerator.getAllCharacterMemories('Alice');
        
        console.log('All memories for Alice:');
        if (allMemories && allMemories.length > 0) {
            allMemories.forEach((memory, i) => {
                console.log(`${i + 1}. ${memory.text}`);
            });
        } else {
            console.log('No memories found for Alice.');
        }
        
        console.log('\n=== Memory Integration Example Complete ===');
    } catch (error) {
        console.error('Error in memory example:', error);
    }
}

// Run the example
runMemoryExample();
