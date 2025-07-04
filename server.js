const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { YoutubeTranscript } = require('youtube-transcript');
const { Client } = require('@notionhq/client');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

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

// Get video metadata from YouTube Data API
async function getVideoMetadata(videoId) {
    try {
        const apiKey = process.env.YOUTUBE_API_KEY;
        if (!apiKey) {
            throw new Error('YouTube API key not configured');
        }

        const response = await axios.get(`https://www.googleapis.com/youtube/v3/videos`, {
            params: {
                part: 'snippet,statistics',
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
            duration: video.snippet.duration,
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
        const transcript = await YoutubeTranscript.fetchTranscript(videoId);
        return transcript.map(item => item.text).join(' ');
    } catch (error) {
        console.error('Error fetching transcript:', error.message);
        throw new Error('Could not fetch transcript. The video may not have captions enabled.');
    }
}

// Analyze content with OpenRouter API
async function analyzeContent(transcript, videoInfo, model) {
    try {
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            throw new Error('OpenRouter API key not configured');
        }

        const prompt = `You are an assistant that extracts key information from YouTube video transcripts. 

Video Title: ${videoInfo.title}
Channel: ${videoInfo.channelTitle}
Description: ${videoInfo.description.substring(0, 500)}...

Transcript: ${transcript}

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

        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: model,
            messages: [
                {
                    role: 'system',
                    content: 'You are a helpful assistant that creates comprehensive, well-structured summaries of YouTube video content. Always format your responses in clean markdown.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_tokens: 2000,
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

// Generate markdown content
function generateMarkdown(videoInfo, analysis) {
    const publishDate = new Date(videoInfo.publishedAt).toLocaleDateString('en-AU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const markdown = `---
title: "${videoInfo.title}"
url: "https://youtu.be/${videoInfo.videoId}"
channel: "${videoInfo.channelTitle}"
published: "${publishDate}"
views: ${videoInfo.viewCount}
likes: ${videoInfo.likeCount}
---

# ${videoInfo.title} (YouTube Summary)

**Channel:** ${videoInfo.channelTitle}  
**Published:** ${publishDate}  
**Views:** ${parseInt(videoInfo.viewCount).toLocaleString()}  
**Likes:** ${parseInt(videoInfo.likeCount).toLocaleString()}  
**URL:** [https://youtu.be/${videoInfo.videoId}](https://youtu.be/${videoInfo.videoId})

## Original YouTube Description
${videoInfo.description}

---

${analysis}

---

*This summary was generated using AI analysis of the video transcript.*
`;

    return markdown;
}

// Main endpoint for processing videos
app.post('/api/process', async (req, res) => {
    try {
        const { url, model } = req.body;
        
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

        // Analyze content
        const analysis = await analyzeContent(transcript, videoInfo, model || 'openai/gpt-3.5-turbo');

        // Generate markdown
        const markdown = generateMarkdown(videoInfo, analysis);

        // Create filename
        const filename = `${sanitizeFilename(videoInfo.title)}_${Date.now()}.md`;

        // Save file
        const outputDir = path.join(__dirname, 'output');
        try {
            await fs.mkdir(outputDir, { recursive: true });
        } catch (err) {
            // Directory might already exist
        }

        const filePath = path.join(outputDir, filename);
        await fs.writeFile(filePath, markdown, 'utf8');

        res.json({
            success: true,
            filename: filename,
            filePath: filePath,
            markdown: markdown,
            videoInfo: videoInfo
        });

    } catch (error) {
        console.error('Error processing video:', error);
        res.status(500).json({ 
            error: error.message || 'An error occurred while processing the video' 
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
                                content: videoInfo.title
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
        const childPage = await notion.pages.create({
            parent: {
                page_id: mainPage.id
            },
            properties: {
                title: [
                    {
                        type: 'text',
                        text: {
                            content: `${videoInfo.title} - Analysis`
                        }
                    }
                ]
            },
            children: childPageBlocks
        });

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
            res.status(400).json({ error: 'Database schema mismatch. Please ensure your Notion database has the required properties (Title, URL, Channel, Published Date, Views, Likes, Content).' });
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
                { type: 'text', text: { content: parseInt(videoInfo.viewCount).toLocaleString() } }
            ]
        }
    });
    
    blocks.push({
        type: 'paragraph',
        paragraph: {
            rich_text: [
                { type: 'text', text: { content: 'Likes: ' }, annotations: { bold: true } },
                { type: 'text', text: { content: parseInt(videoInfo.likeCount).toLocaleString() } }
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
    const lines = markdown.split('\n');
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
                                content: videoInfo.title
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
        const childPage = await notion.pages.create({
            parent: {
                page_id: mainPage.id
            },
            properties: {
                title: [
                    {
                        type: 'text',
                        text: {
                            content: `${videoInfo.title} - Analysis`
                        }
                    }
                ]
            },
            children: childPageBlocks
        });

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
            res.status(400).json({ error: 'Database schema mismatch. Please ensure your Notion database has the required properties (Title, URL, Channel, Published Date, Views, Likes, Content).' });
        } else {
            res.status(500).json({ error: 'Failed to save to Notion' });
        }
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        youtubeApi: !!process.env.YOUTUBE_API_KEY,
        openrouterApi: !!process.env.OPENROUTER_API_KEY,
        notionApi: !!process.env.NOTION_TOKEN
    });
});

app.listen(PORT, () => {
    console.log(`🚀 YouTube Analysis App running on http://localhost:${PORT}`);
    console.log(`📝 Make sure to configure your API keys in the .env file`);
}); 