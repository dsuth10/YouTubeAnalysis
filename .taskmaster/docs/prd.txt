# YouTube Video Research App - Product Requirements Document

## Overview

The YouTube Video Research App is a powerful web application that analyzes YouTube videos and generates comprehensive markdown reports with AI-driven insights. The app solves the problem of efficiently extracting and organizing valuable information from YouTube content for researchers, content creators, and anyone who needs to process large amounts of video content.

**Target Users:**
- Researchers analyzing video content for academic or professional purposes
- Content creators researching competitors and industry trends
- Marketers analyzing video performance and content strategies
- Students and educators processing educational video content
- Journalists and media professionals researching video content

**Value Proposition:**
- Automates the time-consuming process of manually transcribing and analyzing YouTube videos
- Provides structured, AI-powered insights that can be directly saved to Notion databases
- Supports multiple AI models for different analysis needs and budgets
- Offers specialized analysis templates for different video types
- Enables efficient content research and knowledge management

## Core Features

### 1. YouTube Video Analysis Engine
**What it does:** Extracts metadata, transcripts, and descriptions from any YouTube video URL
**Why it's important:** Provides the foundation for all analysis by gathering comprehensive video data
**How it works:** Uses YouTube Data API v3 to fetch video metadata, multiple transcript extraction methods (python youtube-transcript-api, youtube-transcript package, youtube-captions-scraper), with graceful fallback to description-based analysis when transcripts aren't available

### 2. AI-Powered Content Analysis
**What it does:** Generates comprehensive summaries using OpenRouter's AI models (GPT-3.5, GPT-4, Claude, and more)
**Why it's important:** Transforms raw video data into actionable insights and structured knowledge
**How it works:** Sends processed prompts with video metadata and transcripts to OpenRouter API, supporting multiple models with different pricing and performance characteristics

### 3. Custom Analysis Prompts System
**What it does:** Provides specialized templates for different video types (tutorials, reviews, lectures, etc.)
**Why it's important:** Ensures analysis quality and relevance for specific content types
**How it works:** Markdown-based template system with placeholder replacement for video metadata, supporting dynamic prompt loading and customization

### 4. Advanced Notion Integration
**What it does:** Saves notes directly to Notion databases with structured content and two-tier organization
**Why it's important:** Enables seamless knowledge management and content organization
**How it works:** Creates main database entries with linked child pages, converts markdown to Notion blocks, and maps video metadata to database properties

### 5. Multiple Export Options
**What it does:** Provides various download formats for analysis reports, raw transcripts, video descriptions, and processed prompts
**Why it's important:** Offers flexibility for different use cases and workflows
**How it works:** Generates downloadable files in markdown format with proper filename sanitization and organization

### 6. Modern Web Interface
**What it does:** Provides a clean, responsive interface with real-time feedback and status notifications
**Why it's important:** Ensures excellent user experience and accessibility
**How it works:** Vanilla JavaScript frontend with modern CSS, responsive design, and comprehensive error handling

## User Experience

### User Personas

**Primary Persona - Research Analyst:**
- Needs to process multiple videos daily for competitive analysis
- Requires structured data that can be integrated into existing workflows
- Values accuracy and comprehensive analysis over speed
- Uses Notion for knowledge management

**Secondary Persona - Content Creator:**
- Analyzes competitor videos and industry trends
- Needs quick insights to inform content strategy
- Prefers cost-effective analysis options
- Values actionable takeaways and key insights

**Tertiary Persona - Academic Researcher:**
- Processes educational and lecture content
- Requires detailed analysis with academic rigor
- Uses specialized prompts for scientific content
- Values comprehensive documentation and export options

### Key User Flows

**1. Basic Video Analysis Flow:**
1. User enters YouTube URL
2. Selects AI model (default: GPT-3.5 Turbo)
3. Chooses analysis prompt template
4. Sets token limit for analysis depth
5. Clicks "Analyze Video"
6. Views generated analysis with video metadata
7. Downloads analysis report or saves to Notion

**2. Advanced Notion Integration Flow:**
1. User configures Notion integration token
2. Connects to Notion and selects target database
3. Analyzes video as normal
4. Clicks "Save to Notion" to create database entry
5. Receives direct link to created Notion page
6. Can access detailed analysis in child page

**3. Custom Prompt Workflow:**
1. User creates custom markdown prompt file
2. Places file in prompts/ directory
3. Reloads prompts via API endpoint
4. Selects custom prompt from dropdown
5. Analyzes video with specialized template

### UI/UX Considerations

**Design Principles:**
- Clean, modern interface with intuitive navigation
- Real-time status feedback and progress indicators
- Comprehensive error handling with helpful messages
- Responsive design for desktop and mobile use
- Accessibility features for screen readers and keyboard navigation

**Key Interface Elements:**
- Prominent URL input field with validation
- Model selection with search and favorites functionality
- Prompt template dropdown with descriptions
- Token limit slider for analysis depth control
- Results section with tabbed content organization
- Download options with clear file type indicators
- Notion integration panel with connection status

## Technical Architecture

### System Components

**Backend (Node.js/Express.js):**
- `server.js`: Main application server with API endpoints
- Transcript extraction system with multiple fallback methods
- AI integration via OpenRouter API
- Notion API integration with markdown parsing
- File generation and download management

**Frontend (Vanilla JavaScript):**
- `public/index.html`: Main application interface
- `public/script.js`: Frontend logic and API communication
- `public/styles.css`: Modern CSS with responsive design
- Real-time status updates and error handling

**External Integrations:**
- YouTube Data API v3 for video metadata
- OpenRouter API for AI model access
- Notion API for database integration
- Apify API for transcript fallback (optional)

### Data Models

**Video Metadata Model:**
```javascript
{
  id: String,
  title: String,
  channel: String,
  publishedAt: Date,
  viewCount: Number,
  likeCount: Number,
  description: String,
  thumbnail: String,
  duration: String
}
```

**Analysis Result Model:**
```javascript
{
  videoInfo: VideoMetadata,
  analysis: String,
  generatedTitle: String,
  hasTranscript: Boolean,
  modelUsed: String,
  promptUsed: String,
  tokenLimit: Number
}
```

**Notion Database Schema:**
- Title (Title type) - Video title
- URL (URL type) - Video link
- Channel (Text type) - Channel name
- Published Date (Date type) - Publication date
- Views (Number type) - View count
- Likes (Number type) - Like count
- Content (URL type) - Link to child page

### APIs and Integrations

**YouTube Data API v3:**
- Endpoint: `https://www.googleapis.com/youtube/v3/videos`
- Purpose: Fetch video metadata and caption availability
- Rate limits: 10,000 units/day (free tier)
- Authentication: API key

**OpenRouter API:**
- Endpoint: `https://openrouter.ai/api/v1/chat/completions`
- Purpose: AI model access for content analysis
- Models: GPT-3.5, GPT-4, Claude, Gemini, and more
- Authentication: API key with usage-based pricing

**Notion API:**
- Endpoint: `https://api.notion.com/v1`
- Purpose: Database integration and content creation
- Features: Two-tier structure with main entries and child pages
- Authentication: Integration token

### Infrastructure Requirements

**Development Environment:**
- Node.js v14 or higher
- Python 3.x for transcript extraction
- npm for package management
- Git for version control

**Production Requirements:**
- Node.js server with Express.js
- Static file serving for frontend
- Environment variable configuration
- File system access for downloads
- Internet connectivity for API calls

**Dependencies:**
```json
{
  "@notionhq/client": "^2.2.14",
  "apify-client": "^2.12.6",
  "axios": "^1.6.0",
  "cors": "^2.8.5",
  "dotenv": "^16.3.1",
  "express": "^4.18.2",
  "multer": "^1.4.5-lts.1",
  "youtube-captions-scraper": "^2.0.3",
  "youtube-transcript": "^1.2.1"
}
```

## Development Roadmap

### Phase 1: MVP Foundation (Core Functionality)
**Requirements:**
- Basic YouTube video URL processing
- Simple transcript extraction (primary method only)
- Basic AI analysis with single model (GPT-3.5)
- Simple markdown report generation
- Basic web interface with form submission
- File download functionality
- Error handling for common issues

**Deliverables:**
- Working server with Express.js
- Basic frontend with form and results display
- YouTube API integration for metadata
- OpenRouter integration for AI analysis
- Simple transcript extraction
- Markdown report generation
- Download functionality

### Phase 2: Enhanced Analysis & User Experience
**Requirements:**
- Multiple transcript extraction methods with fallback
- Custom analysis prompts system
- Multiple AI model support
- Enhanced UI with modern design
- Real-time status feedback
- Comprehensive error handling
- Token limit configuration
- Model search and favorites functionality

**Deliverables:**
- Robust transcript handling with multiple fallback methods
- Prompt template system with markdown files
- Model selection with search and favorites
- Modern responsive UI with animations
- Comprehensive status notifications
- Advanced error handling and user guidance
- Token limit controls for analysis depth

### Phase 3: Notion Integration & Advanced Features
**Requirements:**
- Complete Notion API integration
- Two-tier database structure (main entries + child pages)
- Markdown to Notion block conversion
- Database property mapping
- Connection status management
- Advanced export options
- Health monitoring and API status

**Deliverables:**
- Full Notion integration with database management
- Two-tier content structure implementation
- Markdown parser for Notion blocks
- Database schema validation
- Connection status indicators
- Multiple download formats
- Health monitoring dashboard

### Phase 4: Advanced Features & Optimization
**Requirements:**
- Apify integration for additional transcript methods
- Enhanced prompt management
- Advanced Notion formatting options
- Performance optimizations
- Comprehensive documentation
- Testing and quality assurance

**Deliverables:**
- Apify transcript fallback system
- Prompt management UI
- Advanced Notion block formatting
- Performance optimizations
- Complete documentation suite
- Comprehensive testing

## Logical Dependency Chain

### Foundation Layer (Must be built first)
1. **Express.js Server Setup**: Core server with basic routing and middleware
2. **YouTube API Integration**: Video metadata extraction and URL validation
3. **Basic Frontend**: Simple HTML form and results display
4. **OpenRouter Integration**: AI model access for content analysis
5. **Transcript Extraction**: Primary method for getting video transcripts

### Core Functionality Layer
1. **Analysis Engine**: AI prompt processing and response handling
2. **Markdown Generation**: Report formatting and structure
3. **Download System**: File generation and download endpoints
4. **Error Handling**: Comprehensive error management and user feedback
5. **Enhanced UI**: Modern design with responsive layout

### Advanced Features Layer
1. **Multiple Transcript Methods**: Fallback systems for robust extraction
2. **Custom Prompts System**: Template loading and placeholder replacement
3. **Model Management**: Search, favorites, and model information
4. **Notion Integration**: Database connection and content creation
5. **Advanced Export Options**: Multiple download formats and Notion saving

### Optimization Layer
1. **Performance Enhancements**: Caching, optimization, and monitoring
2. **Advanced Features**: Apify integration, enhanced formatting
3. **Documentation**: Complete setup and usage guides
4. **Testing**: Comprehensive testing and quality assurance

### Getting to Usable Frontend Quickly
**Priority 1 (Week 1):**
- Basic Express server with static file serving
- Simple HTML form for YouTube URL input
- Basic YouTube API integration
- Simple results display

**Priority 2 (Week 2):**
- OpenRouter integration for AI analysis
- Basic transcript extraction
- Markdown report generation
- Download functionality

**Priority 3 (Week 3):**
- Enhanced UI with modern design
- Error handling and user feedback
- Multiple AI model support
- Custom prompts system

## Risks and Mitigations

### Technical Challenges

**Risk: YouTube API Rate Limits**
- **Impact**: High - could prevent video processing
- **Mitigation**: Implement caching, use multiple API keys, monitor usage, provide clear error messages

**Risk: Transcript Extraction Failures**
- **Impact**: Medium - affects analysis quality
- **Mitigation**: Multiple fallback methods, graceful degradation to description-based analysis, clear user feedback

**Risk: AI Model Availability and Pricing**
- **Impact**: Medium - could affect analysis capabilities
- **Mitigation**: Support multiple models, provide cost estimates, implement model fallbacks

**Risk: Notion API Changes**
- **Impact**: Low - affects integration features
- **Mitigation**: Version pinning, comprehensive error handling, alternative export options

### MVP Definition and Scope

**Risk: Feature Creep**
- **Impact**: High - could delay usable product
- **Mitigation**: Strict MVP definition, phased development approach, clear success criteria

**Risk: Over-Engineering**
- **Impact**: Medium - could increase complexity unnecessarily
- **Mitigation**: Start simple, add features incrementally, focus on core value proposition

**Risk: User Experience Complexity**
- **Impact**: Medium - could reduce adoption
- **Mitigation**: User testing, iterative design, clear documentation and guidance

### Resource Constraints

**Risk: API Costs**
- **Impact**: Medium - could affect scalability
- **Mitigation**: Cost monitoring, usage limits, multiple pricing tiers, clear cost estimates

**Risk: Development Time**
- **Impact**: High - could delay delivery
- **Mitigation**: Phased approach, clear priorities, reusable components, comprehensive documentation

**Risk: Maintenance Overhead**
- **Impact**: Medium - could affect long-term sustainability
- **Mitigation**: Clean architecture, comprehensive documentation, automated testing, modular design

## Appendix

### Research Findings

**YouTube API Analysis:**
- YouTube Data API v3 provides comprehensive video metadata
- Caption availability varies significantly across videos
- Rate limits are generous for typical usage patterns
- API is well-documented and stable

**AI Model Comparison:**
- GPT-3.5 Turbo: Best balance of cost and performance
- GPT-4: Highest quality but significantly more expensive
- Claude: Good performance with reasonable pricing
- Model availability varies by region and provider

**Notion Integration Research:**
- Notion API supports rich content creation
- Database integration requires specific property types
- Two-tier structure provides better organization
- API is well-documented with good examples

### Technical Specifications

**Supported YouTube URL Formats:**
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://youtube.com/embed/VIDEO_ID`
- `https://youtube.com/shorts/VIDEO_ID`
- `https://youtube.com/live/VIDEO_ID`

**AI Model Token Limits:**
- Minimum: 2,000 tokens (fast, concise)
- Recommended: 6,000-10,000 tokens (detailed)
- Maximum: 20,000 tokens (comprehensive)

**File Export Formats:**
- Analysis Report: Markdown with structured content
- Raw Transcript: Plain text with timestamps
- Video Description: Full or truncated description
- Processed Prompt: Exact prompt sent to AI

**Notion Block Types Supported:**
- Headings (H1, H2, H3)
- Bulleted and numbered lists
- Paragraphs with rich text
- Blockquotes
- Code blocks with syntax highlighting

### Cost Analysis

**YouTube Data API:**
- Free tier: 10,000 units/day
- Cost per video: 1 unit
- Monthly cost: $0 (within free tier)

**OpenRouter (AI Analysis):**
- GPT-3.5 Turbo: ~$0.002 per 1K tokens
- GPT-4: ~$0.03 per 1K tokens
- Claude 2: ~$0.008 per 1K tokens
- Typical cost per video: $0.01 - $0.10

**Notion Integration:**
- Cost: Free - Notion API has no usage costs

**Example Monthly Costs:**
- 100 videos/month with GPT-3.5: ~$2-5
- 100 videos/month with GPT-4: ~$15-30
- 1000 videos/month with GPT-3.5: ~$20-50

### Development Timeline

**Phase 1 (MVP):** 2-3 weeks
- Basic functionality and core features
- Simple but usable interface
- Essential error handling

**Phase 2 (Enhanced UX):** 2-3 weeks
- Modern UI and advanced features
- Multiple models and prompts
- Comprehensive error handling

**Phase 3 (Notion Integration):** 2-3 weeks
- Complete Notion integration
- Advanced export options
- Health monitoring

**Phase 4 (Optimization):** 1-2 weeks
- Performance improvements
- Advanced features
- Documentation and testing

**Total Development Time:** 7-11 weeks for complete implementation 