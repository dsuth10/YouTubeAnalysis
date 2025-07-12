const { ApifyClient } = require('apify-client');
require('dotenv').config();

// Import the function from server.js (we'll need to test it separately)
async function getTranscriptFromApify(videoId) {
    if (!process.env.APIFY_API_KEY) {
        throw new Error('Apify API key not configured');
    }

    console.log(`Attempting to get transcript via Apify for video: ${videoId}`);
    
    const client = new ApifyClient({
        token: process.env.APIFY_API_KEY,
    });

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    try {
        // Configure the task run
        const runInput = {
            start_urls: [{ url: videoUrl }]
        };

        console.log('Starting Apify task run...');
        
        // Run the task and wait for completion
        const run = await client.task('dsuth10~test-youtube-structured-transcript-extractor-task').call(runInput);
        
        console.log(`Apify task run completed with ID: ${run.id}`);
        
        // Fetch results from the dataset
        const { items } = await client.dataset(run.defaultDatasetId).listItems();
        
        if (items && items.length > 0) {
            // Extract transcript from the first item
            const transcriptData = items[0];
            
            if (transcriptData.transcript && transcriptData.transcript.length > 0) {
                // Handle different transcript formats
                let fullTranscript = '';
                
                if (Array.isArray(transcriptData.transcript)) {
                    // If transcript is an array of objects with text property
                    fullTranscript = transcriptData.transcript
                        .map(item => item.text || item)
                        .join(' ');
                } else if (typeof transcriptData.transcript === 'string') {
                    // If transcript is already a string
                    fullTranscript = transcriptData.transcript;
                }
                
                console.log(`Apify transcript extracted successfully (${fullTranscript.length} characters)`);
                return fullTranscript.trim();
            }
        }
        
        throw new Error('No transcript data found in Apify response');
        
    } catch (error) {
        console.error('Apify transcript extraction failed:', error.message);
        throw error;
    }
}

async function testApifyIntegration() {
    console.log('=== Apify YouTube Transcript Scraper Integration Test ===\n');
    
    // Test cases
    const testVideos = [
        {
            id: 'dQw4w9WgXcQ',
            name: 'Rick Astley - Never Gonna Give You Up',
            expected: 'success'
        },
        {
            id: 'jNQXAC9IVRw', 
            name: 'Me at the zoo (first YouTube video)',
            expected: 'success'
        },
        {
            id: 'invalid_id',
            name: 'Invalid Video ID',
            expected: 'error'
        }
    ];
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const testCase of testVideos) {
        console.log(`\n--- Testing: ${testCase.name} (${testCase.id}) ---`);
        
        try {
            const startTime = Date.now();
            const transcript = await getTranscriptFromApify(testCase.id);
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            if (transcript) {
                console.log(`✅ SUCCESS: ${transcript.substring(0, 100)}...`);
                console.log(`📊 Duration: ${duration}ms`);
                console.log(`📏 Length: ${transcript.length} characters`);
                successCount++;
            } else {
                console.log(`❌ FAILED: No transcript returned`);
                errorCount++;
            }
            
        } catch (error) {
            console.log(`❌ ERROR: ${error.message}`);
            errorCount++;
        }
    }
    
    console.log('\n=== Test Summary ===');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log(`📊 Success Rate: ${((successCount / testVideos.length) * 100).toFixed(1)}%`);
    
    // Environment check
    console.log('\n=== Environment Check ===');
    console.log(`🔑 APIFY_API_KEY configured: ${process.env.APIFY_API_KEY ? 'Yes' : 'No'}`);
    
    if (!process.env.APIFY_API_KEY) {
        console.log('⚠️  WARNING: APIFY_API_KEY not found in environment variables');
        console.log('   Please add your Apify API key to the .env file');
    }
}

// Run the test
if (require.main === module) {
    testApifyIntegration()
        .then(() => {
            console.log('\n🎉 Test completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Test failed with error:', error);
            process.exit(1);
        });
}

module.exports = { getTranscriptFromApify, testApifyIntegration }; 