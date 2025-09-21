import { generateStory } from './services/gemmaService.js';

async function testStoryGeneration() {
    try {
        console.log('🚀 Starting story generation test...');
        console.log('📥 This will download the model on first run (about 1.5GB)...');
        console.log('⏳ Please be patient, this may take several minutes...\n');
        
        const prompt = "Once upon a time in a magical forest";
        const systemMessage = "You are a creative storyteller who writes engaging children's stories.";
        
        console.log('🔍 Prompt:', prompt);
        console.log('🤖 System:', systemMessage);
        console.log('\n⚡ Generating story... (this may take a few minutes on first run)');
        
        const startTime = Date.now();
        const story = await generateStory(prompt, systemMessage, 50); // Reduced length for testing
        const endTime = Date.now();
        
        console.log(`\n✅ Story generated in ${(endTime - startTime) / 1000} seconds`);
        console.log('\n--- Generated Story ---');
        console.log(story);
        console.log('--- End of Story ---');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        if (error.message.includes('Could not locate file')) {
            console.log('\n💡 Try running with the environment variable:');
            console.log('TRANSFORMERS_CACHE=./models node --experimental-modules test-gemma.js');
        }
    }
}

// Run the test
testStoryGeneration().catch(console.error);
