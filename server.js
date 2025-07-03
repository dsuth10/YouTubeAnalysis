const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { YoutubeTranscript } = require('youtube-transcript');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

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
    const publishDate = new Date(videoInfo.publishedAt).toLocaleDateString('en-US', {
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

## Video Description
${videoInfo.description.substring(0, 500)}${videoInfo.description.length > 500 ? '...' : ''}

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
                    { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo (Fast & Cheap)' },
                    { id: 'openai/gpt-4', name: 'GPT-4 (More Accurate)' },
                    { id: 'anthropic/claude-2', name: 'Claude 2 (Balanced)' }
                ]
            });
        }

        const response = await axios.get('https://openrouter.ai/api/v1/models', {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });

        const models = response.data.data
            .filter(model => model.id.includes('gpt') || model.id.includes('claude'))
            .map(model => ({
                id: model.id,
                name: `${model.name} (${model.id})`
            }))
            .slice(0, 10); // Limit to top 10

        res.json({ models });
    } catch (error) {
        console.error('Error fetching models:', error);
        res.json({
            models: [
                { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo (Fast & Cheap)' },
                { id: 'openai/gpt-4', name: 'GPT-4 (More Accurate)' },
                { id: 'anthropic/claude-2', name: 'Claude 2 (Balanced)' }
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

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        youtubeApi: !!process.env.YOUTUBE_API_KEY,
        openrouterApi: !!process.env.OPENROUTER_API_KEY
    });
});

app.listen(PORT, () => {
    console.log(`🚀 YouTube Analysis App running on http://localhost:${PORT}`);
    console.log(`📝 Make sure to configure your API keys in the .env file`);
}); 