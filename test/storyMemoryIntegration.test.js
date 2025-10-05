import dotenv from 'dotenv';
dotenv.config();

import storyGenerator from '../services/StoryGenerator.js';

async function testStoryMemoryIntegration() {
    try {
        console.log('=== Story Memory Integration Test ===\n');
        
        const storyId1 = 'memory-test-story-1';
        const storyId2 = 'memory-test-story-2';
        const characterName = 'TestHero';
        
        // 1. Generate and store first story with memories
        console.log('1. Generating first story and storing memories...');
        const story1 = {
            title: 'The Lost Amulet',
            content: `${characterName} found a magical amulet deep in the ancient forest. ` +
                    `The amulet is said to grant its wearer protection against dark magic. ` +
                    `${characterName} decided to keep it safe.`,
            characters: [{
                name: characterName,
                description: 'A brave adventurer seeking ancient artifacts'
            }]
        };
        
        // Store story events and character memories
        await storyGenerator.updateStoryMemory(storyId1, {
            title: story1.title,
            characters: story1.characters,
            setting: 'Ancient forest with magical properties'
        });
        
        // Add story events
        await storyGenerator.addStoryEvent(storyId1, 'discovery', 
            `${characterName} discovered a magical amulet in the ancient forest.`);
            
        // Store character memories
        await storyGenerator.storeCharacterMemories(storyId1, {
            [characterName]: `I found a magical amulet in the ancient forest. It's said to protect against dark magic.`
        });
        
        console.log('✓ First story memories stored');
        
        // 2. Generate a new story that should reference previous memories
        console.log('\n2. Generating new story that should reference memories...');
        
        // Get relevant memories
        const relevantMemories = await storyGenerator.getCharacterMemories(
            characterName, 
            'magical amulet',
            3
        );
        
        console.log('Relevant memories found:', relevantMemories.length);
        if (relevantMemories.length > 0) {
            console.log('Memory content:', relevantMemories[0].text);
        }
        
        // 3. Verify memory integration
        console.log('\n3. Verifying memory integration...');
        const memoryIntegrationWorks = relevantMemories.length > 0 && 
                                    relevantMemories[0].text.includes('amulet');
        
        console.log(`Memory integration test ${memoryIntegrationWorks ? 'PASSED' : 'FAILED'}`);
        
        if (!memoryIntegrationWorks) {
            throw new Error('Memory integration failed - no relevant memories found');
        }
        
        console.log('\n=== Test Completed Successfully ===');
        
    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}

// Run the test
testStoryMemoryIntegration();
