// Simple test for the VectorDB class with ES modules
import dotenv from 'dotenv';
dotenv.config();

import { VectorDB } from '../services/vectorDB.js';

async function testVectorDB() {
    try {
        console.log('Starting VectorDB test...');
        
        // Create a new instance
        const vectorDB = new VectorDB();
        
        // Wait for initialization
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('VectorDB initialized successfully!');
        
        // Test storing a memory
        console.log('Testing memory storage...');
        const memoryId = await vectorDB.storeMemory(
            'test-char-1',
            'This is a test memory',
            'test-story-1',
            { test: true }
        );
        
        console.log('Memory stored with ID:', memoryId);
        
        // Test retrieving memories
        console.log('Testing memory retrieval...');
        const memories = await vectorDB.getCharacterMemories('test-char-1');
        console.log('Retrieved memories:', memories);
        
        console.log('VectorDB test completed successfully!');
    } catch (error) {
        console.error('VectorDB test failed:', error);
    }
}

testVectorDB();
