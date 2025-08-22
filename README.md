# YouTube Video Research App

A powerful web application that analyzes YouTube videos and generates comprehensive markdown reports with AI-driven insights. Perfect for researchers, content creators, and anyone who wants to extract valuable information from YouTube content.

## ✨ Features

- 🎥 **YouTube Video Analysis**: Extract metadata, transcripts, and descriptions from any YouTube video
- 🤖 **AI-Powered Insights**: Generate comprehensive summaries using OpenRouter's AI models (GPT-3.5, GPT-4, Claude, and more)
- 🎯 **Custom Analysis Prompts**: Choose specialized templates for different video types (tutorials, reviews, lectures, etc.)
- 📝 **Multiple Export Options**: Download analysis reports, raw transcripts, video descriptions, and processed prompts
- 🔗 **Advanced Notion Integration**: Save notes directly to your Notion databases with structured content
- 🏗️ **Two-Tier Notion Structure**: Creates main database entries with linked child pages for detailed analysis
- 🎨 **Modern UI**: Clean, responsive interface with beautiful animations and real-time feedback
- ⚡ **Fast & Efficient**: Optimized for quick analysis and processing with fallback mechanisms
- 🔧 **Configurable**: Support for multiple AI models, token limits, and API configurations
- 📊 **Health Monitoring**: Real-time API status and configuration validation
- 🎯 **Robust Transcript Handling**: Multiple extraction methods with graceful fallback to description-based analysis
- 📱 **Enhanced User Experience**: Detailed status notifications, progress tracking, and error handling
 - 🧩 **Transcript Pipeline UX**: Shows which method produced the transcript, attempts count, raw subtitle download (when available), and a built-in yt-dlp health check

## 🎯 What You Get

For each YouTube video, the app generates a comprehensive markdown report containing:

- **Video Metadata**: Title, channel, publish date, views, likes, and direct video link
- **Video Overview**: Brief summary of the video content
- **Topics Covered**: Main subjects and themes discussed or likely covered
- **Key Information Extracted**: Important facts, data, and key points presented
- **Important Concepts**: Definitions and explanations of key terms and ideas
- **Learnings/Takeaways**: Actionable insights and lessons from the content
- **Content Analysis**: Content type, target audience, and quality indicators
- **Suggested Tags**: Relevant categories for organization
- **Analysis Limitations**: Notes about what additional insights might be available

### 📥 Download Options
- **Analysis Report**: Complete AI-generated summary in markdown format
- **Raw Transcript**: Original transcript extracted from YouTube (when available)
- **Video Description**: Full video description as provided by the creator
- **Processed Prompt**: The exact prompt sent to the AI for analysis

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- YouTube Data API key
- OpenRouter API key
- Notion account (optional, for direct integration)

### Installation

1. **Clone or download the project**
   ```bash
   git clone <repository-url>
   cd youtube-analysis-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   pip install youtube-transcript-api
   ```

3. **Configure API keys**
   ```bash
   cp env.example .env
   ```
   
   Edit the `.env` file and add your API keys:
   ```env
   YOUTUBE_API_KEY=your_youtube_api_key_here
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   NOTION_TOKEN=your_notion_integration_token_here
   NOTION_DATABASE_ID=your_notion_database_id_here
   PORT=3000
   ```

4. **Start the application**
   ```bash
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 🔑 Getting API Keys

### YouTube Data API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the YouTube Data API v3
4. Create credentials (API Key)
5. Copy the API key to your `.env` file

**Note**: YouTube Data API is free with generous quotas (10,000 units/day)

### OpenRouter API Key

1. Visit [OpenRouter](https://openrouter.ai/)
2. Sign up for an account
3. Get your API key from the dashboard
4. Add funds to your account (required for API usage)
5. Copy the API key to your `.env` file

**Cost**: Pay-per-use based on the AI model you choose:
- GPT-3.5 Turbo: ~$0.002 per 1K tokens
- GPT-4: ~$0.03 per 1K tokens
- Claude 2: ~$0.008 per 1K tokens

### Notion Integration Token (Optional)

For direct Notion integration:

1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Click **"New integration"**
3. Name it (e.g., "YouTube Analysis App")
4. Select your workspace
5. Enable **Read content**, **Update content**, and **Insert content** capabilities
6. Click **"Submit"**
7. Copy the **Internal Integration Token** (starts with `secret_`)
8. Add it to your `.env` file

**Note**: You'll also need to share your Notion database with the integration. See [NOTION_SETUP.md](NOTION_SETUP.md) for detailed setup instructions.

**Cost**: Free - Notion API has no usage costs

## 🎯 Usage

### Basic Workflow

1. **Enter YouTube URL**: Paste any YouTube video URL in the input field
2. **Select AI Model**: Choose from available models (GPT-3.5 is fastest and cheapest)
3. **Choose Analysis Prompt**: Select a specialized template for your video type
4. **Set Token Limit**: Configure analysis depth (2,000 to 20,000 tokens)
5. **Analyze**: Click "Analyze Video" to start the process
6. **Review Results**: View the generated analysis and video information
7. **Download Options**: 
   - Download the complete analysis report
   - Download raw transcript (if available)
   - Download video description
   - Download the processed prompt
8. **Save to Notion**: Use the direct Notion integration to save notes to your database

### Custom Analysis Prompts

The app includes specialized analysis templates for different video types:

- **Default Analysis**: Enhanced general-purpose analysis that works with or without transcripts
- **Hardware Review Video**: Specialized for tech hardware reviews
- **Instructional Video**: Focused on educational content
- **Long-Form Discussion Video**: For podcasts and panel discussions
- **News Report Video**: For news and current events
- **SaaS Multiple Review**: For videos reviewing multiple software products
- **Scientific Lecture Video**: For academic and scientific content
- **Software Review Video**: Specialized for software reviews
- **Tutorial Video**: For step-by-step tutorials

### Transcript Handling

- The app uses multiple methods to extract transcripts in a prioritized order:
- **Primary**: yt-dlp subtitles (VTT/SRT) using your browser cookies for robust access
- **Secondary**: python `youtube-transcript-api`
- **Tertiary**: `youtube-transcript` (JS)
- **Fallback**: `youtube-captions-scraper` and Apify actor
- **Final Fallback (ASR)**: Download audio via yt-dlp and transcribe with OpenAI Whisper (or other providers when configured)
- **Verification**: YouTube Data API can check caption existence but cannot download third-party caption content with API key alone
- **Graceful Degradation**: Full analysis using video description when transcripts aren't available

#### UI Indicators & Tools
- The result view shows a label like "Transcript via: subs_ytdlp | subs_python | subs_js_* | subs_scraper | subs_apify | asr_<provider>" and the number of attempts tried
- "Download Raw Subtitles" button appears when yt-dlp subtitles were used (returns raw or plain text fallback)
- "Test yt-dlp" button runs a backend health check to confirm yt-dlp is available on the server

### Running Tests

This project includes small Node test harnesses.

- Extract video ID tests:
  - `node test-extract-video-id.js`
- Subtitle parsing tests (VTT/SRT):
  - `npm run test:subtitles`
- Transcript pipeline smoke test:
  - Configure env (PowerShell on Windows):
    - `$env:TEST_SUBS_VIDEO_ID="<videoIdWithSubs>"` (optional; defaults to `dQw4w9WgXcQ`)
    - `$env:TEST_NO_SUBS_VIDEO_ID="<videoIdLikelyNoSubs>"` (optional)
    - `$env:OPENAI_API_KEY="<yourKey>"` (required for ASR test)
  - Ensure yt-dlp is installed and cookies configured (see yt-dlp setup above)
  - Run: `npm run test:smoke`
  - The test will skip ASR if keys or IDs are not set and won’t fail CI for ASR-only issues.

### Supported URL Formats

- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://youtube.com/embed/VIDEO_ID`

### AI Models Available

- **GPT-3.5 Turbo**: Fast, cheap, good for most content (~$0.002 per 1K tokens)
- **GPT-4**: More accurate, better for complex topics (~$0.03 per 1K tokens)
- **Claude 2**: Balanced performance and cost (~$0.008 per 1K tokens)
- **Gemini 2.5 Flash**: Google's latest model for comprehensive analysis
- **And many more** via OpenRouter's model marketplace

### Token Limits

Configure analysis depth with token limits:
- **2,000 tokens**: Fast, concise analysis
- **4,000 tokens**: Balanced detail
- **6,000-10,000 tokens**: Detailed analysis (recommended)
- **15,000-20,000 tokens**: Maximum detail for complex content

## 🏗️ Advanced Notion Integration

The app features a sophisticated Notion integration that creates a two-tier structure:

### Main Database Entry
- **Title**: Video title
- **URL**: Direct link to the YouTube video
- **Channel**: YouTube channel name
- **Published Date**: Video publication date
- **Views**: View count
- **Likes**: Like count
- **Content**: Link to detailed analysis page

### Child Analysis Page
- **Video Information**: Complete metadata with formatting
- **Video Description**: Full or truncated description
- **AI Analysis**: Structured content with proper Notion formatting
- **Rich Content**: Headings, lists, paragraphs, and code blocks

### Database Requirements

Your Notion database must have these properties:
- **Title** (Title type) - Required
- **URL** (URL type) - For video links
- **Channel** (Text type) - For channel names
- **Published Date** (Date type) - For video dates
- **Views** (Number type) - For view counts
- **Likes** (Number type) - For like counts
- **Content** (URL type) - Link to child analysis page

## 📁 File Structure

```
youtube-analysis-app/
├── server.js              # Main Node.js server with enhanced transcript handling
├── package.json           # Dependencies and scripts
├── env.example           # Environment variables template
├── .env                  # Your API keys (create this)
├── public/               # Frontend files
│   ├── index.html        # Main HTML interface with download options
│   ├── styles.css        # CSS styles with modern UI
│   └── script.js         # Frontend JavaScript with enhanced UX
├── prompts/              # Custom analysis prompts
│   ├── Default Analysis.md
│   ├── Hardware Review Video.md
│   ├── Instructional Video.md
│   ├── Long-Form Discussion Video.md
│   ├── News Report Video.md
│   ├── SaaS Multiple Review.md
│   ├── Scientific Lecture Video.md
│   ├── Software Review Video.md
│   └── Tutorial Video.md
├── output/               # Generated markdown files
├── Debug Examples/       # Debug and testing files
├── NOTION_SETUP.md       # Detailed Notion integration guide
├── NOTION_CHILD_PAGE_IMPLEMENTATION.md # Technical implementation details
├── CUSTOM_PROMPT_IMPLEMENTATION.md # Custom prompt feature details
├── IMPLEMENTATION_SUMMARY.md # Complete feature summary
├── FAVORITES_IMPLEMENTATION_SUMMARY.md # Model favorites feature
└── README.md            # This file
```

## 🔌 API Endpoints

- `POST /api/process` - Process a YouTube video with enhanced transcript handling
- `GET /api/models` - Get available AI models with favorites support
- `GET /api/prompts` - Get available analysis prompts
- `POST /api/prompts/reload` - Reload prompts from disk (development)
- `GET /api/health` - Check server and API status
- `GET /api/yt-dlp-health-check` - Verify yt-dlp is available on the server
- `GET /api/download/:filename` - Download generated files
- `GET /api/download-raw-subs/:videoId` - Download raw subtitles when available (falls back to plain text)
- `POST /api/getPrompt` - Get processed prompt for debugging
- `GET /api/notion/databases` - Get available Notion databases
- `POST /api/notion/saveNote` - Save note to Notion database
- `POST /api/saveToNotion` - Export analysis to Notion

## ⚙️ Configuration Options

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `YOUTUBE_API_KEY` | YouTube Data API key | Yes |
| `OPENROUTER_API_KEY` | OpenRouter API key | Yes |
| `NOTION_TOKEN` | Notion integration token | No |
| `NOTION_DATABASE_ID` | Notion database ID | No |
| `PORT` | Server port (default: 3000) | No |
| `YT_DLP_PATH` | Absolute path to `yt-dlp` (empty to use PATH) | No |
| `YT_DLP_COOKIES` | Cookie source: `browser:edge`, `browser:chrome`, or `file:/path/to/cookies.txt` | Recommended |
| `YT_DLP_SUB_LANGS` | Preferred subtitle languages (e.g., `en.*,en`) | No |
| `YT_DLP_SUB_FORMATS` | Preferred subtitle formats (e.g., `vtt/srt/best`) | No |
| `YT_DLP_USER_AGENT` | Optional custom User-Agent | No |
| `TRANSCRIBE_PROVIDER` | ASR provider: `openai` | `assemblyai` | `deepgram` | No |
| `OPENAI_API_KEY` | API key for OpenAI Whisper | If `TRANSCRIBE_PROVIDER=openai` |
| `OPENAI_WHISPER_MODEL` | Whisper model (default `whisper-1`) | No |
| `ASSEMBLYAI_API_KEY` | API key for AssemblyAI | If used |
| `DEEPGRAM_API_KEY` | API key for Deepgram | If used |

### Customization
## 🔧 yt-dlp & ASR Setup (Windows-friendly)

1) Install yt-dlp

```powershell
pipx install yt-dlp
# or
pip install --user yt-dlp
```

2) Configure cookies for YouTube

Set `YT_DLP_COOKIES=browser:edge` (Windows default) or `browser:chrome` in your `.env`. Optionally set `YT_DLP_PATH` to the yt-dlp binary and `YT_DLP_USER_AGENT` for a custom UA. This allows yt-dlp to reuse your browser session to access age-restricted/consent-gated captions reliably.

3) Test subtitles availability and download

```powershell
# List available subtitle languages
yt-dlp --list-subs https://www.youtube.com/watch?v=VIDEO_ID

# Write auto-generated subtitles (no media download)
yt-dlp --skip-download --write-auto-subs --sub-langs "en.*,en" --sub-format "vtt/srt/best" --cookies-from-browser edge https://www.youtube.com/watch?v=VIDEO_ID
```

4) ASR fallback (OpenAI Whisper / pluggable)

Set `TRANSCRIBE_PROVIDER=openai` and `OPENAI_API_KEY` in `.env`. When no subtitles exist, the server will download audio (via yt-dlp) and transcribe it using Whisper. Placeholders exist for `assemblyai` and `deepgram` providers; add their keys to enable when implemented.

### Important limitation (YouTube Data API)

The YouTube Data API v3 cannot download caption track content for third-party videos using API key authentication alone. We use yt-dlp + browser cookies to fetch subtitles where available. The API may still be used to check that caption tracks exist.

#### Custom Analysis Prompts
You can create custom analysis prompts by adding `.md` files to the `prompts/` directory. Each prompt should follow this format:

```markdown
# Your Prompt Name

You are a [role] summarizing a [video type]...

Video Title: {{title}}
Channel: {{channel}}
Description: {{description}}

Transcript: {{transcript}}

[Your analysis instructions...]
```

#### Placeholder System
The following placeholders are automatically replaced:
- `{{title}}` - Video title
- `{{channel}}` - Channel name
- `{{description}}` - Video description (full description when no transcript, truncated when transcript available)
- `{{transcript}}` - Full video transcript or "No transcript available"

## 🔧 Troubleshooting

### Common Issues

**"YouTube API key not configured"**
- Make sure you've created a `.env` file
- Verify your YouTube API key is correct
- Ensure YouTube Data API v3 is enabled in Google Cloud Console

**"OpenRouter API key not configured"**
- Check your OpenRouter API key in the `.env` file
- Verify you have funds in your OpenRouter account
- Ensure the API key has proper permissions

**"Could not fetch transcript"**
- Some videos don't have captions enabled
- The app will automatically fall back to description-based analysis
- Check the status notifications for transcript availability
- Videos with captions may still fail due to YouTube API restrictions

**"Invalid YouTube URL"**
- Ensure the URL is in a supported format
- Check that the video exists and is public
- Remove any extra parameters from the URL

**"Notion integration issues"**
- Verify your Notion token is correct
- Ensure the database is shared with your integration
- Check that the database has the required properties
- See [NOTION_SETUP.md](NOTION_SETUP.md) for detailed troubleshooting

### Performance Tips

- Use GPT-3.5 Turbo for faster, cheaper analysis
- For longer videos, the analysis may take more time
- Consider the transcript length when choosing models (longer transcripts cost more)
- Custom prompts can be optimized for specific content types
- The app automatically handles transcript extraction failures gracefully
- Use higher token limits for more detailed analysis when needed

## 💰 Cost Analysis

### YouTube Data API
- **Free tier**: 10,000 units/day
- **Cost per video**: 1 unit
- **Monthly cost**: $0 (within free tier)

### OpenRouter (AI Analysis)
- **GPT-3.5 Turbo**: ~$0.002 per 1K tokens
- **GPT-4**: ~$0.03 per 1K tokens
- **Typical cost per video**: $0.01 - $0.10 (depending on length and model)

### Example Costs
- 10-minute video with GPT-3.5: ~$0.02
- 30-minute video with GPT-4: ~$0.15
- 100 videos/month: ~$2-15 (depending on model choice)

### Notion Integration
- **Cost**: Free - Notion API has no usage costs

## 🛠️ Development

### Running in Development Mode

```bash
npm run dev
```

This uses nodemon for automatic server restarts during development.

### Tech Stack

- **Backend**: Node.js with Express.js
- **Frontend**: Vanilla JavaScript (ES6+) with modern CSS
- **AI Integration**: OpenRouter API for multiple AI models
- **YouTube Integration**: YouTube Data API v3
- **Transcript Extraction**: youtube-transcript + youtube-captions-scraper
- **Notion Integration**: Notion API with two-tier database structure
- **Styling**: CSS Grid, Flexbox, and modern animations

### Adding New Features

The app is built with a modular architecture:

- **Backend**: Express.js server with clear separation of concerns
- **Frontend**: Vanilla JavaScript with modern ES6+ features
- **Styling**: CSS with responsive design and animations
- **Prompts**: Markdown-based template system
- **Notion Integration**: Advanced two-tier database structure
- **Transcript Handling**: Multi-method extraction with fallback mechanisms
- **Download System**: Multiple export options for different use cases

### Extending Functionality

You can easily extend the app by:

1. **Adding new AI models**: Modify the models endpoint
2. **Creating custom prompts**: Add `.md` files to the `prompts/` directory
3. **Customizing Notion structure**: Modify the database schema and block generation
4. **Adding export formats**: Create new export functions
5. **Enhancing transcript extraction**: Add new transcript extraction methods
6. **Adding new download options**: Extend the download system

## 📚 Documentation

- **[NOTION_SETUP.md](NOTION_SETUP.md)**: Complete Notion integration setup guide
- **[NOTION_CHILD_PAGE_IMPLEMENTATION.md](NOTION_CHILD_PAGE_IMPLEMENTATION.md)**: Technical details of the two-tier Notion structure
- **[CUSTOM_PROMPT_IMPLEMENTATION.md](CUSTOM_PROMPT_IMPLEMENTATION.md)**: Custom prompt feature implementation
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)**: Complete feature summary and technical overview
- **[QUICKSTART.md](QUICKSTART.md)**: Quick setup guide for getting started

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the troubleshooting section above
2. Review the console logs for error messages
3. Ensure all API keys are properly configured
4. Try with a different YouTube video
5. Check the detailed documentation files

## 🗺️ Roadmap

Future enhancements planned:

- [x] Direct Notion API integration
- [x] Custom prompt templates
- [x] Two-tier Notion structure with child pages
- [x] Advanced health monitoring
- [x] Enhanced transcript handling with fallback mechanisms
- [x] Multiple download options (transcript, description, prompt)
- [x] Robust error handling and user feedback
- [x] Model favorites and search functionality
- [ ] Batch processing for multiple videos
- [ ] Export to other formats (PDF, Word)
- [ ] Video thumbnail generation
- [ ] Advanced filtering and search
- [ ] User accounts and history
- [ ] Mobile app version
- [ ] Prompt management UI
- [ ] Advanced Notion formatting options
- [ ] Manual transcript upload feature

---

**Happy analyzing! 🎥📝✨** 