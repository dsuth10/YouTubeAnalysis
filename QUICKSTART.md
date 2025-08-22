# Quick Start Guide

Get your YouTube Video Research App running in 5 minutes! 🚀

## Step 1: Get Your API Keys

### YouTube Data API Key (Free)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable "YouTube Data API v3"
4. Create credentials → API Key
5. Copy the key

### OpenRouter API Key (Pay-per-use)
1. Visit [OpenRouter](https://openrouter.ai/)
2. Sign up and get your API key
3. Add some funds to your account ($5-10 is plenty to start)

## Step 2: Configure the App

1. **Create your environment file:**
   ```bash
   copy env.example .env
   ```

2. **Edit `.env` and add your keys:**
   ```env
   YOUTUBE_API_KEY=your_youtube_api_key_here
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   PORT=8000
   ```

## Step 3: Start the App

```bash
npm start
```

Open your browser to: `http://localhost:8000`

## Step 4: Test It Out

1. Paste a YouTube URL (any format works)
2. Select an AI model (GPT-3.5 is fastest/cheapest)
3. Click "Analyze Video"
4. Download your markdown report
5. Import into Notion!

## Example URLs to Test

- `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
- `https://youtu.be/dQw4w9WgXcQ`
- Any YouTube video with captions

## Troubleshooting

**"API key not configured"**
- Make sure your `.env` file exists and has the correct keys

**"Could not fetch transcript"**
- Try a video that has captions enabled
- Some videos don't have transcripts available

**App won't start**
- Make sure you ran `npm install`
- Check that port 8000 isn't already in use

## Cost Estimate

- **YouTube API**: Free (10,000 requests/day)
- **OpenRouter**: ~$0.01-0.10 per video (depending on length)

That's it! You're ready to analyze YouTube videos and create Notion-ready reports! 🎉 