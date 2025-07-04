# YouTube Video Research App

A powerful web application that analyzes YouTube videos and generates comprehensive markdown reports with AI-driven insights. Perfect for researchers, content creators, and anyone who wants to extract valuable information from YouTube content.

## ✨ Features

- 🎥 **YouTube Video Analysis**: Extract metadata and transcripts from any YouTube video
- 🤖 **AI-Powered Insights**: Generate comprehensive summaries using OpenRouter's AI models
- 🎯 **Custom Analysis Prompts**: Choose specialized templates for different video types (tutorials, reviews, lectures, etc.)
- 📝 **Notion-Ready Markdown**: Export beautifully formatted markdown files for Notion
- 🔗 **Advanced Notion Integration**: Save notes directly to your Notion databases with structured content
- 🏗️ **Two-Tier Notion Structure**: Creates main database entries with linked child pages for detailed analysis
- 🎨 **Modern UI**: Clean, responsive interface with beautiful animations
- ⚡ **Fast & Efficient**: Optimized for quick analysis and processing
- 🔧 **Configurable**: Support for multiple AI models and API configurations
- 📊 **Health Monitoring**: Real-time API status and configuration validation

## 🎯 What You Get

For each YouTube video, the app generates a markdown report containing:

- **Video Metadata**: Title, channel, publish date, views, likes
- **Topics Covered**: Main subjects and themes discussed
- **Key Workflows**: Step-by-step processes and procedures
- **Important Concepts**: Definitions and explanations of key terms
- **Learnings/Takeaways**: Actionable insights and lessons
- **Suggested Tags**: Relevant categories for organization

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
4. **Analyze**: Click "Analyze Video" to start the process
5. **Review Results**: View the generated analysis and video information
6. **Download**: Save the markdown file to your computer
7. **Save to Notion**: Use the direct Notion integration to save notes to your database

### Custom Analysis Prompts

The app includes specialized analysis templates for different video types:

- **Default Analysis**: General-purpose analysis for any video type
- **Hardware Review Video**: Specialized for tech hardware reviews
- **Instructional Video**: Focused on educational content
- **Long-Form Discussion Video**: For podcasts and panel discussions
- **News Report Video**: For news and current events
- **Scientific Lecture Video**: For academic and scientific content
- **Software Review Video**: Specialized for software reviews
- **Tutorial Video**: For step-by-step tutorials

### Supported URL Formats

- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://youtube.com/embed/VIDEO_ID`

### AI Models Available

- **GPT-3.5 Turbo**: Fast, cheap, good for most content
- **GPT-4**: More accurate, better for complex topics
- **Claude 2**: Balanced performance and cost
- **And many more** via OpenRouter's model marketplace

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
├── server.js              # Main Node.js server
├── package.json           # Dependencies and scripts
├── env.example           # Environment variables template
├── .env                  # Your API keys (create this)
├── public/               # Frontend files
│   ├── index.html        # Main HTML interface
│   ├── styles.css        # CSS styles
│   └── script.js         # Frontend JavaScript
├── prompts/              # Custom analysis prompts
│   ├── Default Analysis.md
│   ├── Hardware Review Video.md
│   ├── Instructional Video.md
│   ├── Long-Form Discussion Video.md
│   ├── News Report Video.md
│   ├── Scientific Lecture Video.md
│   ├── Software Review Video.md
│   └── Tutorial Video.md
├── output/               # Generated markdown files
├── NOTION_SETUP.md       # Detailed Notion integration guide
├── NOTION_CHILD_PAGE_IMPLEMENTATION.md # Technical implementation details
├── CUSTOM_PROMPT_IMPLEMENTATION.md # Custom prompt feature details
├── IMPLEMENTATION_SUMMARY.md # Complete feature summary
└── README.md            # This file
```

## 🔌 API Endpoints

- `POST /api/process` - Process a YouTube video with custom prompts
- `GET /api/models` - Get available AI models
- `GET /api/prompts` - Get available analysis prompts
- `POST /api/prompts/reload` - Reload prompts from disk (development)
- `GET /api/health` - Check server and API status
- `GET /api/download/:filename` - Download generated files
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

### Customization

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
- `{{description}}` - Video description (truncated to 500 chars)
- `{{transcript}}` - Full video transcript

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
- Try a different video with captions
- Check if the video is publicly accessible

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

### Adding New Features

The app is built with a modular architecture:

- **Backend**: Express.js server with clear separation of concerns
- **Frontend**: Vanilla JavaScript with modern ES6+ features
- **Styling**: CSS with responsive design and animations
- **Prompts**: Markdown-based template system
- **Notion Integration**: Advanced two-tier database structure

### Extending Functionality

You can easily extend the app by:

1. **Adding new AI models**: Modify the models endpoint
2. **Creating custom prompts**: Add `.md` files to the `prompts/` directory
3. **Customizing Notion structure**: Modify the database schema and block generation
4. **Adding export formats**: Create new export functions

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
- [ ] Batch processing for multiple videos
- [ ] Export to other formats (PDF, Word)
- [ ] Video thumbnail generation
- [ ] Advanced filtering and search
- [ ] User accounts and history
- [ ] Mobile app version
- [ ] Prompt management UI
- [ ] Advanced Notion formatting options

---

**Happy analyzing! 🎥📝✨** 