const { getVideoTranscript } = require('../server');
const path = require('path');

async function testIntegration() {
    console.log('--- Testing Python Transcript Integration ---');
    const testVideoId = 'hMKRBldkWEk'; // Use a known video ID

    try {
        console.log(`Attempting to fetch transcript for video ID: ${testVideoId}`);
        const result = await getVideoTranscript(testVideoId);

        console.log('Result Source:', result.source);
        console.log('Transcript Length:', result.text.length);
        console.log('Transcript Snippet:', result.text.substring(0, 100) + '...');

        if (result.text.length > 0 && result.source === 'youtube-transcript-api') {
            console.log('✅ PASS: Transcript fetched successfully using Python integration.');
        } else {
            console.error('❌ FAIL: Transcript fetched but state is unexpected.');
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ FAIL: Error during integration test:', error.message);
        process.exit(1);
    }
}

testIntegration();
