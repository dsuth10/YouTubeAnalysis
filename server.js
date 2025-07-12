const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { YoutubeTranscript } = require('youtube-transcript');
const { Client } = require('@notionhq/client');
const { ApifyClient } = require('apify-client');
const getSubtitles = require('youtube-captions-scraper').getSubtitles;
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Global variable to cache prompts
let cachedPrompts = null;

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Notion client
const notion = new Client({
    auth: process.env.NOTION_TOKEN,
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Utility function to extract video ID from YouTube URL
function extractVideoId(url) {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
        /youtube\.com\/v\/([^&\n?#]+)/,
        /youtube\.com\/watch\?.*v=([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

// Utility function to sanitize filename
function sanitizeFilename(filename) {
    return filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

// Get transcript from Apify YouTube Transcript Scraper
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

// Enhanced error handling for Apify
function handleApifyError(error, videoId) {
    console.error(`Apify transcript extraction failed for video ${videoId}:`, error.message);
    
    if (error.message.includes('Task not found')) {
        console.error('Apify task not found - check task ID');
    } else if (error.message.includes('insufficient funds')) {
        console.error('Apify account has insufficient funds');
    } else if (error.message.includes('rate limit')) {
        console.error('Apify rate limit exceeded');
    } else if (error.message.includes('timeout')) {
        console.error('Apify task run timed out');
    }
    
    return null;
}

// Load and cache prompts from the prompts directory
async function loadPrompts() {
    try {
        const promptsDir = path.join(__dirname, 'prompts');
        const files = await fs.readdir(promptsDir);
        
        const prompts = [];
        
        for (const file of files) {
            if (file.endsWith('.md')) {
                try {
                    const filePath = path.join(promptsDir, file);
                    const content = await fs.readFile(filePath, 'utf8');
                    
                    // Skip empty files
                    if (!content.trim()) {
                        continue;
                    }
                    
                    // Extract prompt name from first heading or filename
                    const firstLine = content.split('\n')[0];
                    let name = file.replace('.md', '');
                    
                    // If first line is a heading, use it as name
                    if (firstLine.startsWith('#')) {
                        name = firstLine.replace(/^#+\s*/, '').trim();
                    } else {
                        // Convert filename to display name
                        name = name.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    }
                    
                    const id = file.replace('.md', '');
                    
                    prompts.push({
                        id: id,
                        name: name,
                        content: content.trim()
                    });
                } catch (error) {
                    console.error(`Error reading prompt file ${file}:`, error);
                }
            }
        }
        
        // Add default prompt if no prompts found
        if (prompts.length === 0) {
            prompts.push({
                id: 'default',
                name: 'Default Analysis',
                content: `You are an assistant that extracts key information from YouTube video transcripts. 

Video Title: {{title}}
Channel: {{channel}}
Description: {{description}}

Transcript: {{transcript}}

Please analyze this video and provide a comprehensive summary in the following format:

## Topics Covered
- List the main topics and subjects discussed in the video

## Key Workflows/Processes
- Describe any step-by-step processes, workflows, or procedures mentioned

## Important Concepts
- Define and explain key concepts, terms, or ideas presented

## Learnings/Takeaways
- List the main insights, lessons, or actionable takeaways

## Suggested Tags
- Provide 5-10 relevant tags for categorizing this content

Format your response in clean markdown with proper headings and bullet points. Focus on extracting the most valuable and actionable information from the video.`
            });
        }
        
        return prompts;
    } catch (error) {
        console.error('Error loading prompts:', error);
        return [];
    }
}

// Get prompts (with caching)
async function getPrompts() {
    if (cachedPrompts === null) {
        cachedPrompts = await loadPrompts();
    }
    return cachedPrompts;
}

// Reload prompts (for development/testing)
async function reloadPrompts() {
    cachedPrompts = null;
    return await getPrompts();
}

// Get video metadata from YouTube Data API
async function getVideoMetadata(videoId) {
    try {
        const apiKey = process.env.YOUTUBE_API_KEY;
        if (!apiKey) {
            throw new Error('YouTube API key not configured');
        }

        const response = await axios.get(`https://www.googleapis.com/youtube/v3/videos`, {
            params: {
                part: 'snippet,statistics,contentDetails',
                id: videoId,
                key: apiKey
            }
        });

        if (!response.data.items || response.data.items.length === 0) {
            throw new Error('Video not found');
        }

        const video = response.data.items[0];
        return {
            title: video.snippet.title,
            channelTitle: video.snippet.channelTitle,
            publishedAt: video.snippet.publishedAt,
            description: video.snippet.description,
            viewCount: video.statistics.viewCount,
            likeCount: video.statistics.likeCount,
            duration: video.contentDetails.duration,
            tags: video.snippet.tags || []
        };
    } catch (error) {
        console.error('Error fetching video metadata:', error.message);
        throw error;
    }
}

// Get video transcript
async function getVideoTranscript(videoId) {
    try {
        console.log(`Fetching transcript for video ID: ${videoId}`);
        
        // Try multiple approaches to get transcript
        let transcript = null;
        let error = null;
        
        // Method 1: Try default fetch
        try {
            transcript = await YoutubeTranscript.fetchTranscript(videoId);
            console.log('Method 1 (default) succeeded');
        } catch (err) {
            console.log('Method 1 failed:', err.message);
            error = err;
        }
        
        // Method 2: Try with English language specification
        if (!transcript) {
            try {
                transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' });
                console.log('Method 2 (English) succeeded');
            } catch (err) {
                console.log('Method 2 failed:', err.message);
                error = err;
            }
        }
        
        // Method 3: Try with different language codes
        if (!transcript) {
            const languageCodes = ['en-US', 'en-GB', 'en-CA', 'en-AU'];
            for (const langCode of languageCodes) {
                try {
                    transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang: langCode });
                    console.log(`Method 3 (${langCode}) succeeded`);
                    break;
                } catch (err) {
                    console.log(`Method 3 (${langCode}) failed:`, err.message);
                    error = err;
                }
            }
        }
        
        // Method 4: Fallback to youtube-captions-scraper
        if (!transcript) {
            try {
                console.log('Trying fallback method with youtube-captions-scraper...');
                const subtitles = await getSubtitles({
                    videoID: videoId,
                    lang: 'en'
                });
                
                if (subtitles && subtitles.length > 0) {
                    transcript = subtitles.map(item => ({
                        text: item.text,
                        start: item.start,
                        duration: item.duration
                    }));
                    console.log('Method 4 (fallback scraper) succeeded');
                }
            } catch (err) {
                console.log('Method 4 failed:', err.message);
                error = err;
            }
        }
        
        // Method 5: Apify Actor Fallback
        if (!transcript) {
            try {
                console.log('Method 5: Trying Apify YouTube Transcript Scraper...');
                transcript = await getTranscriptFromApify(videoId);
                if (transcript) {
                    console.log('Method 5 (Apify) succeeded');
                }
            } catch (err) {
                console.log('Method 5 (Apify) failed:', err.message);
                error = err;
            }
        }
        
        if (!transcript || transcript.length === 0) {
            console.log('All methods failed - no transcript data found');
            throw new Error(`No transcript data found for this video. Last error: ${error ? error.message : 'Unknown'}`);
        }
        
        console.log(`Transcript fetched successfully. Found ${transcript.length} segments.`);
        console.log('First few segments:', transcript.slice(0, 3));
        
        const fullTranscript = transcript.map(item => item.text).join(' ');
        console.log(`Full transcript length: ${fullTranscript.length} characters`);
        console.log('First 200 characters:', fullTranscript.substring(0, 200));
        
        if (fullTranscript.trim().length === 0) {
            throw new Error('Transcript is empty after processing.');
        }
        
        return fullTranscript;
    } catch (error) {
        console.error('Error fetching transcript:', error.message);
        console.error('Full error:', error);
        throw new Error(`Could not fetch transcript: ${error.message}`);
    }
}

// Analyze content with OpenRouter API
async function analyzeContent(transcript, videoInfo, model, promptId = null, tokenLimit = 10000) {
    try {
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            throw new Error('OpenRouter API key not configured');
        }

        let promptContent;
        
        if (promptId) {
            // Load custom prompt
            const prompts = await getPrompts();
            const selectedPrompt = prompts.find(p => p.id === promptId);
            
            if (!selectedPrompt) {
                throw new Error(`Prompt with ID '${promptId}' not found`);
            }
            
            promptContent = selectedPrompt.content;
        } else {
            // Use default prompt
            promptContent = `You are an assistant that extracts key information from YouTube video transcripts. 

Video Title: {{title}}
Channel: {{channel}}
Description: {{description}}

Transcript: {{transcript}}

Please analyze this video and provide a comprehensive summary in the following format:

## Topics Covered
- List the main topics and subjects discussed in the video

## Key Workflows/Processes
- Describe any step-by-step processes, workflows, or procedures mentioned

## Important Concepts
- Define and explain key concepts, terms, or ideas presented

## Learnings/Takeaways
- List the main insights, lessons, or actionable takeaways

## Suggested Tags
- Provide 5-10 relevant tags for categorizing this content

Format your response in clean markdown with proper headings and bullet points. Focus on extracting the most valuable and actionable information from the video.`;
        }

        // Replace placeholders in the prompt
        const descSnippet = (transcript && transcript.length > 0)
            ? (videoInfo.description.length > 500 ? videoInfo.description.substring(0, 500) + '...' : videoInfo.description)
            : videoInfo.description;

        const processedPrompt = promptContent
            .replace(/\{\{title\}\}/g, videoInfo.title)
            .replace(/\{\{channel\}\}/g, videoInfo.channelTitle)
            .replace(/\{\{description\}\}/g, descSnippet)
            .replace(/\{\{transcript\}\}/g, transcript);

        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: model,
            messages: [
                {
                    role: 'system',
                    content: 'You are a helpful assistant that creates comprehensive, well-structured summaries of YouTube video content. Always format your responses in clean markdown.'
                },
                {
                    role: 'user',
                    content: processedPrompt
                }
            ],
            max_tokens: tokenLimit,
            temperature: 0.3
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('Error analyzing content:', error.message);
        throw error;
    }
}

// Generate consistent title with OpenRouter API
async function generateTitle(transcript, videoInfo, model) {
    try {
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            throw new Error('OpenRouter API key not configured');
        }

        const titlePrompt = `You are an AI assistant that creates concise instructional titles for YouTube videos.

Video Title: ${videoInfo.title}
Video Description: ${videoInfo.description.length > 500 ? videoInfo.description.substring(0, 500) + '...' : videoInfo.description}
Transcript: ${transcript}

Task: Write a concise 5–10 word instructional title summarizing the main focus of this video. The title should clearly instruct or convey the key action or topic of the content.

Output only the title (5–10 words):`;

        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: model,
            messages: [
                {
                    role: 'system',
                    content: 'You are an assistant that generates concise instructional titles.'
                },
                {
                    role: 'user',
                    content: titlePrompt
                }
            ],
            max_tokens: 20,
            temperature: 0.3
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        const newTitle = response.data.choices[0].message.content.trim();
        return newTitle;
    } catch (error) {
        console.error('Error generating title:', error.message);
        // Fallback to original title if title generation fails
        return videoInfo.title;
    }
}

// Generate markdown content
function generateMarkdown(videoInfo, analysis, generatedTitle, hasTranscript = false) {
    const publishDate = new Date(videoInfo.publishedAt).toLocaleDateString('en-AU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const markdown = `---
title: "${generatedTitle}"
url: "https://youtu.be/${videoInfo.videoId}"
channel: "${videoInfo.channelTitle}"
published: "${publishDate}"
views: ${videoInfo.viewCount || 0}
likes: ${videoInfo.likeCount || 0}
---

# ${generatedTitle} (YouTube Summary)

**Channel:** ${videoInfo.channelTitle}  
**Published:** ${publishDate}  
**Views:** ${videoInfo.viewCount ? parseInt(videoInfo.viewCount).toLocaleString() : 'N/A'}
**Likes:** ${videoInfo.likeCount ? parseInt(videoInfo.likeCount).toLocaleString() : 'N/A'}
**URL:** [https://youtu.be/${videoInfo.videoId}](https://youtu.be/${videoInfo.videoId})

## Original YouTube Description
${videoInfo.description}

---

${analysis}

---

*This summary was generated using AI analysis of the video ${hasTranscript ? 'transcript' : 'description (no transcript available)'}.*
`;

    return markdown;
}

// Main endpoint for processing videos
app.post('/api/process', async (req, res) => {
    try {
        const { url, model, promptId, tokenLimit } = req.body;
        
        if (!url) {
            return res.status(400).json({ error: 'YouTube URL is required' });
        }

        // Extract video ID
        const videoId = extractVideoId(url);
        if (!videoId) {
            return res.status(400).json({ error: 'Invalid YouTube URL' });
        }

        // Get video metadata
        const videoInfo = await getVideoMetadata(videoId);
        videoInfo.videoId = videoId;

        // Get transcript
        let transcript;
        let transcriptStatus = 'not_available';
        
        try {
            transcript = await getVideoTranscript(videoId);
            console.log(`Transcript received in main process. Length: ${transcript ? transcript.length : 'null'} characters`);
            if (transcript && transcript.length > 0) {
                transcriptStatus = 'available';
            }
        } catch (transcriptError) {
            console.log('Transcript extraction failed, proceeding without transcript');
            console.log('Transcript error details:', transcriptError.message);
            transcript = '';
            transcriptStatus = 'failed';
        }
        
        // Check if captions exist via YouTube API
        try {
            const apiKey = process.env.YOUTUBE_API_KEY;
            if (apiKey) {
                const captionsResponse = await axios.get('https://www.googleapis.com/youtube/v3/captions', {
                    params: {
                        part: 'snippet',
                        videoId: videoId,
                        key: apiKey
                    }
                });
                
                if (captionsResponse.data.items && captionsResponse.data.items.length > 0) {
                    const englishCaptions = captionsResponse.data.items.filter(caption => 
                        caption.snippet.language === 'en'
                    );
                    
                    if (englishCaptions.length > 0) {
                        console.log(`YouTube API shows ${englishCaptions.length} English caption tracks available`);
                        if (transcriptStatus === 'failed') {
                            transcriptStatus = 'api_available_but_extraction_failed';
                        }
                    }
                }
            }
        } catch (apiError) {
            console.log('Could not check caption availability via YouTube API:', apiError.message);
        }

        // Analyze content with selected prompt and token limit
        const analysis = await analyzeContent(transcript, videoInfo, model || 'openai/gpt-3.5-turbo', promptId, tokenLimit);

        // Generate title
        const title = await generateTitle(transcript, videoInfo, model || 'openai/gpt-3.5-turbo');
        console.log(`Generated title: "${title}" (Original: "${videoInfo.title}")`);

        // Add generated title to videoInfo
        videoInfo.generatedTitle = title;

        // Generate markdown
        const markdown = generateMarkdown(videoInfo, analysis, title, !!transcript);

        // Create filename
        const filename = `${sanitizeFilename(title)}_${Date.now()}.md`;

        // Save file
        const outputDir = path.join(__dirname, 'output');
        try {
            await fs.mkdir(outputDir, { recursive: true });
        } catch (err) {
            // Directory might already exist
        }

        const filePath = path.join(outputDir, filename);
        await fs.writeFile(filePath, markdown, 'utf8');

        const responseData = {
            success: true,
            filename: filename,
            filePath: filePath,
            markdown: markdown,
            videoInfo: videoInfo,
            transcript: transcript,
            rawDescription: videoInfo.description,
            transcriptStatus: transcriptStatus
        };
        
        console.log(`Sending response with transcript length: ${transcript ? transcript.length : 'null'} characters`);
        console.log(`Response data keys: ${Object.keys(responseData)}`);
        
        res.json(responseData);

    } catch (error) {
        console.error('Error processing video:', error);
        res.status(500).json({ 
            error: error.message || 'An error occurred while processing the video' 
        });
    }
});

// Get available prompts
app.get('/api/prompts', async (req, res) => {
    try {
        const prompts = await getPrompts();
        res.json({ prompts: prompts.map(p => ({ id: p.id, name: p.name })) });
    } catch (error) {
        console.error('Error fetching prompts:', error);
        res.status(500).json({ error: 'Failed to load prompts' });
    }
});

// Reload prompts (for development)
app.post('/api/prompts/reload', async (req, res) => {
    try {
        const prompts = await reloadPrompts();
        res.json({ 
            success: true, 
            message: 'Prompts reloaded successfully',
            prompts: prompts.map(p => ({ id: p.id, name: p.name }))
        });
    } catch (error) {
        console.error('Error reloading prompts:', error);
        res.status(500).json({ error: 'Failed to reload prompts' });
    }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        const prompts = await getPrompts();
        res.json({ 
            status: 'ok', 
            youtubeApi: !!process.env.YOUTUBE_API_KEY,
            openrouterApi: !!process.env.OPENROUTER_API_KEY,
            notionApi: !!process.env.NOTION_TOKEN,
            apifyApi: !!process.env.APIFY_API_KEY,
            prompts: prompts.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Get available models
app.get('/api/models', async (req, res) => {
    try {
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            return res.json({
                models: [
                    { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo (Fast & Cheap)', pricing: { input: 0.0005, output: 0.0015 } },
                    { id: 'openai/gpt-4', name: 'GPT-4 (More Accurate)', pricing: { input: 0.03, output: 0.06 } },
                    { id: 'anthropic/claude-2', name: 'Claude 2 (Balanced)', pricing: { input: 0.008, output: 0.024 } }
                ]
            });
        }

        const response = await axios.get('https://openrouter.ai/api/v1/models', {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });

        // Process all available models
        const models = response.data.data
            .filter(model => model.context_length > 0) // Only include models with context
            .map(model => ({
                id: model.id,
                name: model.name || model.id,
                description: model.description || '',
                context_length: model.context_length,
                pricing: model.pricing || { input: 0, output: 0 },
                provider: model.id.split('/')[0] || 'unknown'
            }))
            .sort((a, b) => {
                // Sort by provider first, then by name
                if (a.provider !== b.provider) {
                    return a.provider.localeCompare(b.provider);
                }
                return a.name.localeCompare(b.name);
            });

        res.json({ models });
    } catch (error) {
        console.error('Error fetching models:', error);
        res.json({
            models: [
                { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo (Fast & Cheap)', pricing: { input: 0.0005, output: 0.0015 } },
                { id: 'openai/gpt-4', name: 'GPT-4 (More Accurate)', pricing: { input: 0.03, output: 0.06 } },
                { id: 'anthropic/claude-2', name: 'Claude 2 (Balanced)', pricing: { input: 0.008, output: 0.024 } }
            ]
        });
    }
});

// Download file endpoint
app.get('/api/download/:filename', async (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(__dirname, 'output', filename);
        
        res.download(filePath, filename, (err) => {
            if (err) {
                res.status(404).json({ error: 'File not found' });
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error downloading file' });
    }
});

// Notion API endpoints

// Get available Notion databases
app.get('/api/notion/databases', async (req, res) => {
    try {
        if (!process.env.NOTION_TOKEN) {
            return res.status(400).json({ error: 'Notion API token not configured' });
        }

        const response = await notion.search({
            filter: {
                property: 'object',
                value: 'database'
            }
        });

        const databases = response.results.map(db => ({
            id: db.id,
            title: db.title[0]?.plain_text || 'Untitled Database',
            url: db.url
        }));

        res.json({ databases });
    } catch (error) {
        console.error('Error fetching Notion databases:', error);
        if (error.code === 'unauthorized') {
            res.status(401).json({ error: 'Invalid Notion API token' });
        } else if (error.code === 'forbidden') {
            res.status(403).json({ error: 'Notion integration lacks required permissions' });
        } else {
            res.status(500).json({ error: 'Failed to fetch Notion databases' });
        }
    }
});

// Save note to Notion database with child page
app.post('/api/notion/saveNote', async (req, res) => {
    try {
        const { databaseId, videoInfo, markdown } = req.body;

        if (!process.env.NOTION_TOKEN) {
            return res.status(400).json({ error: 'Notion API token not configured' });
        }

        if (!databaseId || !videoInfo || !markdown) {
            return res.status(400).json({ error: 'Missing required fields: databaseId, videoInfo, or markdown' });
        }

        // Step 1: Create main database entry with metadata
        const mainPage = await notion.pages.create({
            parent: {
                database_id: databaseId
            },
            properties: {
                'Title': {
                    title: [
                        {
                            type: 'text',
                            text: {
                                content: videoInfo.generatedTitle || videoInfo.title
                            }
                        }
                    ]
                },
                'URL': {
                    url: `https://youtu.be/${videoInfo.videoId}`
                },
                'Channel': {
                    rich_text: [
                        {
                            type: 'text',
                            text: {
                                content: videoInfo.channelTitle
                            }
                        }
                    ]
                },
                'Published Date': {
                    date: {
                        start: videoInfo.publishedAt
                    }
                },
                'Views': {
                    number: parseInt(videoInfo.viewCount) || 0
                },
                'Likes': {
                    number: parseInt(videoInfo.likeCount) || 0
                },
                'Content': {
                    url: null
                }
            }
        });

        // Step 2: Create child page with detailed content
        const childPageBlocks = createChildPageBlocks(videoInfo, markdown);
        
        // Notion has a limit of 100 blocks per request, so we need to split if needed
        const maxBlocksPerRequest = 100;
        const childPage = await notion.pages.create({
            parent: {
                page_id: mainPage.id
            },
            properties: {
                title: [
                    {
                        type: 'text',
                        text: {
                            content: `${videoInfo.generatedTitle || videoInfo.title} - Analysis`
                        }
                    }
                ]
            },
            children: childPageBlocks.slice(0, maxBlocksPerRequest)
        });

        // If we have more blocks, append them in chunks
        if (childPageBlocks.length > maxBlocksPerRequest) {
            for (let i = maxBlocksPerRequest; i < childPageBlocks.length; i += maxBlocksPerRequest) {
                const chunk = childPageBlocks.slice(i, i + maxBlocksPerRequest);
                await notion.blocks.children.append({
                    block_id: childPage.id,
                    children: chunk
                });
            }
        }

        // Step 3: Update main page to link to child page
        const childPageUrl = `https://www.notion.so/${childPage.id.replace(/-/g, '')}`;
        await notion.pages.update({
            page_id: mainPage.id,
            properties: {
                'Content': {
                    url: childPageUrl
                }
            }
        });

        res.json({
            success: true,
            pageId: mainPage.id,
            pageUrl: mainPage.url,
            childPageId: childPage.id,
            childPageUrl: childPageUrl,
            message: 'Note saved to Notion successfully!'
        });

    } catch (error) {
        console.error('Error saving to Notion:', error);
        if (error.code === 'unauthorized') {
            res.status(401).json({ error: 'Invalid Notion API token' });
        } else if (error.code === 'forbidden') {
            res.status(403).json({ error: 'Notion integration lacks access to the selected database. Please ensure the database is shared with the integration.' });
        } else if (error.code === 'validation_error') {
            if (error.message.includes('body.children.length')) {
                res.status(400).json({ error: 'Content too long for Notion. The analysis has been truncated to fit Notion\'s limits.' });
            } else {
                res.status(400).json({ 
                    error: 'Database schema mismatch. Please ensure your Notion database has the required properties: Title (title), URL (url), Channel (rich_text), Published Date (date), Views (number), Likes (number), Content (url).',
                    details: error.message
                });
            }
        } else {
            res.status(500).json({ error: 'Failed to save note to Notion' });
        }
    }
});

// Create child page blocks with detailed content
function createChildPageBlocks(videoInfo, markdown) {
    const blocks = [];
    
    // Add video metadata section
    blocks.push({
        type: 'heading_2',
        heading_2: {
            rich_text: [{
                type: 'text',
                text: { content: 'Video Information' }
            }]
        }
    });
    
    // Add metadata as rich text
    const publishDate = new Date(videoInfo.publishedAt).toLocaleDateString('en-AU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    blocks.push({
        type: 'paragraph',
        paragraph: {
            rich_text: [
                { type: 'text', text: { content: 'Channel: ' }, annotations: { bold: true } },
                { type: 'text', text: { content: videoInfo.channelTitle } }
            ]
        }
    });
    
    blocks.push({
        type: 'paragraph',
        paragraph: {
            rich_text: [
                { type: 'text', text: { content: 'Published: ' }, annotations: { bold: true } },
                { type: 'text', text: { content: publishDate } }
            ]
        }
    });
    
    blocks.push({
        type: 'paragraph',
        paragraph: {
            rich_text: [
                { type: 'text', text: { content: 'Views: ' }, annotations: { bold: true } },
                { type: 'text', text: { content: videoInfo.viewCount ? parseInt(videoInfo.viewCount).toLocaleString() : 'N/A' } }
            ]
        }
    });
    
    blocks.push({
        type: 'paragraph',
        paragraph: {
            rich_text: [
                { type: 'text', text: { content: 'Likes: ' }, annotations: { bold: true } },
                { type: 'text', text: { content: videoInfo.likeCount ? parseInt(videoInfo.likeCount).toLocaleString() : 'N/A' } }
            ]
        }
    });
    
    blocks.push({
        type: 'paragraph',
        paragraph: {
            rich_text: [
                { type: 'text', text: { content: 'URL: ' }, annotations: { bold: true } },
                { type: 'text', text: { content: `https://youtu.be/${videoInfo.videoId}`, link: { url: `https://youtu.be/${videoInfo.videoId}` } } }
            ]
        }
    });
    
    // Add divider
    blocks.push({
        type: 'divider',
        divider: {}
    });
    
    // Add video description section
    blocks.push({
        type: 'heading_2',
        heading_2: {
            rich_text: [{
                type: 'text',
                text: { content: 'Video Description' }
            }]
        }
    });
    
    // Add description (truncated if too long)
    const description = videoInfo.description.length > 500 
        ? videoInfo.description.substring(0, 500) + '...'
        : videoInfo.description;
    
    blocks.push({
        type: 'paragraph',
        paragraph: {
            rich_text: [{
                type: 'text',
                text: { content: description }
            }]
        }
    });
    
    // Add divider
    blocks.push({
        type: 'divider',
        divider: {}
    });
    
    // Parse and add the AI analysis content
    const analysisBlocks = parseMarkdownToNotionBlocks(markdown);
    blocks.push(...analysisBlocks);
    
    // Add closing note
    blocks.push({
        type: 'divider',
        divider: {}
    });
    
    blocks.push({
        type: 'paragraph',
        paragraph: {
            rich_text: [{
                type: 'text',
                text: { content: 'This summary was generated using AI analysis of the video transcript.' },
                annotations: { italic: true }
            }]
        }
    });
    
    return blocks;
}

// Parse markdown to Notion blocks
function parseMarkdownToNotionBlocks(markdown) {
    let lines = markdown.split('\n');
    // Remove YAML front matter if present
    if (lines[0].trim() === '---') {
        let end = 1;
        while (end < lines.length && lines[end].trim() !== '---') {
            end++;
        }
        lines = lines.slice(end + 1);
    }
    
    const blocks = [];
    let currentList = null;
    let currentListType = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (!line) {
            // End current list if exists
            if (currentList) {
                blocks.push(...currentList);
                currentList = null;
                currentListType = null;
            }
            continue;
        }

        // Handle headings
        if (line.startsWith('#')) {
            // End current list if exists
            if (currentList) {
                blocks.push(...currentList);
                currentList = null;
                currentListType = null;
            }

            const level = line.match(/^#+/)[0].length;
            const content = line.replace(/^#+\s*/, '');
            
            if (level === 1) {
                blocks.push({
                    type: 'heading_1',
                    heading_1: {
                        rich_text: [{
                            type: 'text',
                            text: { content }
                        }]
                    }
                });
            } else if (level === 2) {
                blocks.push({
                    type: 'heading_2',
                    heading_2: {
                        rich_text: [{
                            type: 'text',
                            text: { content }
                        }]
                    }
                });
            } else if (level === 3) {
                blocks.push({
                    type: 'heading_3',
                    heading_3: {
                        rich_text: [{
                            type: 'text',
                            text: { content }
                        }]
                    }
                });
            }
        }
        // Handle bullet points
        else if (line.startsWith('- ') || line.startsWith('* ')) {
            const content = line.replace(/^[-*]\s*/, '');
            
            if (currentListType !== 'bulleted') {
                if (currentList) {
                    blocks.push(...currentList);
                }
                currentList = [];
                currentListType = 'bulleted';
            }
            
            currentList.push({
                type: 'bulleted_list_item',
                bulleted_list_item: {
                    rich_text: [{
                        type: 'text',
                        text: { content }
                    }]
                }
            });
        }
        // Handle numbered lists
        else if (/^\d+\.\s/.test(line)) {
            const content = line.replace(/^\d+\.\s*/, '');
            
            if (currentListType !== 'numbered') {
                if (currentList) {
                    blocks.push(...currentList);
                }
                currentList = [];
                currentListType = 'numbered';
            }
            
            currentList.push({
                type: 'numbered_list_item',
                numbered_list_item: {
                    rich_text: [{
                        type: 'text',
                        text: { content }
                    }]
                }
            });
        }
        // Handle blockquotes
        else if (line.startsWith('> ')) {
            // End current list if exists
            if (currentList) {
                blocks.push(...currentList);
                currentList = null;
                currentListType = null;
            }

            const content = line.replace(/^>\s*/, '');
            blocks.push({
                type: 'quote',
                quote: {
                    rich_text: [{
                        type: 'text',
                        text: { content }
                    }]
                }
            });
        }
        // Handle code blocks
        else if (line.startsWith('```')) {
            // End current list if exists
            if (currentList) {
                blocks.push(...currentList);
                currentList = null;
                currentListType = null;
            }

            // Find the end of the code block
            let codeContent = '';
            let j = i + 1;
            while (j < lines.length && !lines[j].trim().startsWith('```')) {
                codeContent += lines[j] + '\n';
                j++;
            }
            i = j; // Skip to end of code block

            blocks.push({
                type: 'code',
                code: {
                    rich_text: [{
                        type: 'text',
                        text: { content: codeContent.trim() }
                    }],
                    language: 'plain text'
                }
            });
        }
        // Handle regular paragraphs
        else {
            // End current list if exists
            if (currentList) {
                blocks.push(...currentList);
                currentList = null;
                currentListType = null;
            }

            blocks.push({
                type: 'paragraph',
                paragraph: {
                    rich_text: [{
                        type: 'text',
                        text: { content: line }
                    }]
                }
            });
        }
    }

    // Add any remaining list items
    if (currentList) {
        blocks.push(...currentList);
    }

    return blocks;
}

// Save to Notion endpoint (separate from analysis)
app.post('/api/saveToNotion', async (req, res) => {
    try {
        const { videoInfo, markdown, databaseId } = req.body;

        if (!process.env.NOTION_TOKEN) {
            return res.status(400).json({ error: 'Notion API token not configured' });
        }

        if (!videoInfo || !markdown) {
            return res.status(400).json({ error: 'Missing required fields: videoInfo or markdown' });
        }

        // Use provided databaseId or fall back to environment variable
        const targetDatabaseId = databaseId || process.env.NOTION_DATABASE_ID;
        if (!targetDatabaseId) {
            return res.status(400).json({ error: 'No database ID provided. Please select a database or configure NOTION_DATABASE_ID in your environment.' });
        }

        // Step 1: Create main database entry with metadata
        const mainPage = await notion.pages.create({
            parent: {
                database_id: targetDatabaseId
            },
            properties: {
                'Title': {
                    title: [
                        {
                            type: 'text',
                            text: {
                                content: videoInfo.generatedTitle || videoInfo.title
                            }
                        }
                    ]
                },
                'URL': {
                    url: `https://youtu.be/${videoInfo.videoId}`
                },
                'Channel': {
                    rich_text: [
                        {
                            type: 'text',
                            text: {
                                content: videoInfo.channelTitle
                            }
                        }
                    ]
                },
                'Published Date': {
                    date: {
                        start: videoInfo.publishedAt
                    }
                },
                'Views': {
                    number: parseInt(videoInfo.viewCount) || 0
                },
                'Likes': {
                    number: parseInt(videoInfo.likeCount) || 0
                },
                'Content': {
                    url: null
                }
            }
        });

        // Step 2: Create child page with detailed content
        const childPageBlocks = createChildPageBlocks(videoInfo, markdown);
        
        // Notion has a limit of 100 blocks per request, so we need to split if needed
        const maxBlocksPerRequest = 100;
        const childPage = await notion.pages.create({
            parent: {
                page_id: mainPage.id
            },
            properties: {
                title: [
                    {
                        type: 'text',
                        text: {
                            content: `${videoInfo.generatedTitle || videoInfo.title} - Analysis`
                        }
                    }
                ]
            },
            children: childPageBlocks.slice(0, maxBlocksPerRequest)
        });

        // If we have more blocks, append them in chunks
        if (childPageBlocks.length > maxBlocksPerRequest) {
            for (let i = maxBlocksPerRequest; i < childPageBlocks.length; i += maxBlocksPerRequest) {
                const chunk = childPageBlocks.slice(i, i + maxBlocksPerRequest);
                await notion.blocks.children.append({
                    block_id: childPage.id,
                    children: chunk
                });
            }
        }

        // Step 3: Update main page to link to child page
        const childPageUrl = `https://www.notion.so/${childPage.id.replace(/-/g, '')}`;
        await notion.pages.update({
            page_id: mainPage.id,
            properties: {
                'Content': {
                    url: childPageUrl
                }
            }
        });

        res.json({
            success: true,
            pageId: mainPage.id,
            pageUrl: mainPage.url,
            childPageId: childPage.id,
            childPageUrl: childPageUrl,
            message: 'Successfully saved to Notion!'
        });

    } catch (error) {
        console.error('Error saving to Notion:', error);
        if (error.code === 'unauthorized') {
            res.status(401).json({ error: 'Invalid Notion API token' });
        } else if (error.code === 'forbidden') {
            res.status(403).json({ error: 'Notion integration lacks access to the selected database. Please ensure the database is shared with the integration.' });
        } else if (error.code === 'validation_error') {
            if (error.message.includes('body.children.length')) {
                res.status(400).json({ error: 'Content too long for Notion. The analysis has been truncated to fit Notion\'s limits.' });
            } else {
                res.status(400).json({ 
                    error: 'Database schema mismatch. Please ensure your Notion database has the required properties: Title (title), URL (url), Channel (rich_text), Published Date (date), Views (number), Likes (number), Content (url).',
                    details: error.message
                });
            }
        } else {
            res.status(500).json({ error: 'Failed to save to Notion' });
        }
    }
});

// Get processed prompt endpoint
app.post('/api/getPrompt', async (req, res) => {
    try {
        const { url, promptId, model } = req.body;
        
        if (!url) {
            return res.status(400).json({ error: 'YouTube URL is required' });
        }

        // Extract video ID
        const videoId = extractVideoId(url);
        if (!videoId) {
            return res.status(400).json({ error: 'Invalid YouTube URL' });
        }

        // Get video metadata
        const videoInfo = await getVideoMetadata(videoId);
        videoInfo.videoId = videoId;

        // Get transcript
        const transcript = await getVideoTranscript(videoId);

        // Get prompt content
        let promptContent;
        
        if (promptId) {
            // Load custom prompt
            const prompts = await getPrompts();
            const selectedPrompt = prompts.find(p => p.id === promptId);
            
            if (!selectedPrompt) {
                throw new Error(`Prompt with ID '${promptId}' not found`);
            }
            
            promptContent = selectedPrompt.content;
        } else {
            // Use default prompt
            promptContent = `You are an assistant that extracts key information from YouTube video transcripts. 

Video Title: {{title}}
Channel: {{channel}}
Description: {{description}}

Transcript: {{transcript}}

Please analyze this video and provide a comprehensive summary in the following format:

## Topics Covered
- List the main topics and subjects discussed in the video

## Key Workflows/Processes
- Describe any step-by-step processes, workflows, or procedures mentioned

## Important Concepts
- Define and explain key concepts, terms, or ideas presented

## Learnings/Takeaways
- List the main insights, lessons, or actionable takeaways

## Suggested Tags
- Provide 5-10 relevant tags for categorizing this content

Format your response in clean markdown with proper headings and bullet points. Focus on extracting the most valuable and actionable information from the video.`;
        }

        // Replace placeholders in the prompt
        const descSnippet = (transcript && transcript.length > 0)
            ? (videoInfo.description.length > 500 ? videoInfo.description.substring(0, 500) + '...' : videoInfo.description)
            : videoInfo.description;

        const processedPrompt = promptContent
            .replace(/\{\{title\}\}/g, videoInfo.title)
            .replace(/\{\{channel\}\}/g, videoInfo.channelTitle)
            .replace(/\{\{description\}\}/g, descSnippet)
            .replace(/\{\{transcript\}\}/g, transcript);

        // Create the complete API request that would be sent to OpenRouter
        const apiRequest = {
            model: model || 'openai/gpt-3.5-turbo', // Use selected model or default
            messages: [
                {
                    role: 'system',
                    content: 'You are a helpful assistant that creates comprehensive, well-structured summaries of YouTube video content. Always format your responses in clean markdown.'
                },
                {
                    role: 'user',
                    content: processedPrompt
                }
            ],
            max_tokens: 10000,
            temperature: 0.3
        };

        res.json({
            success: true,
            prompt: {
                original: promptContent,
                processed: processedPrompt,
                apiRequest: apiRequest,
                videoInfo: {
                    title: videoInfo.title,
                    channelTitle: videoInfo.channelTitle,
                    description: descSnippet,
                    videoId: videoInfo.videoId,
                    publishedAt: videoInfo.publishedAt,
                    viewCount: videoInfo.viewCount,
                    likeCount: videoInfo.likeCount
                },
                transcriptLength: transcript.length,
                promptId: promptId || 'default'
            }
        });

    } catch (error) {
        console.error('Error getting prompt:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 YouTube Analysis App running on http://localhost:${PORT}`);
    console.log(`📝 Make sure to configure your API keys in the .env file`);
}); 