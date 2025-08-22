# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Common Development Commands

- **Install dependencies**:
  - `npm install` (Node backend/frontend)
  - `pip install youtube-transcript-api` (Python transcript fallback)

- **Run the app locally**:
  - `npm start` (starts Express server at http://localhost:3000)

- **Run in development mode** (auto-restart on code change):
  - `npm run dev` (uses nodemon)

- **Run test scripts**:
  - `node test-extract-video-id.js` (video ID extraction)
  - `npm run test:subtitles` (subtitle parsing)
  - `npm run test:smoke` (transcript pipeline)

- **Configure environment variables**:
  1. Copy `env.example` to `.env` and edit with your API keys and configuration ([see README/QUICKSTART for details]).

## Codebase Structure & Key Patterns

- **Backend**: `server.js` (Node.js/Express)
  - Main API endpoints for video analysis, prompt management, and Notion export
  - Transcript pipeline: attempts multiple extraction methods in order:
    - yt-dlp (via browser cookies)
    - Python `youtube-transcript-api` (calls `scripts/get_transcript.py`)
    - JS libraries and Apify (fallbacks)
    - Final fallback: ASR with OpenAI Whisper
  - Prompt loader: Loads `.md` prompt templates from `prompts/`, supports custom user-defined analysis templates
  - Notion integration: uses `@notionhq/client` to save analysis results, creates a main database entry and a linked child page (see NOTION_SETUP.md)
  - Exposes endpoints to download reports, transcripts, and raw prompts

- **Frontend**: `public/` directory
  - Vanilla JS (+ HTML/CSS), handles user input, status updates, downloads, and Notion UI
  - UI features: model/prompt selection, token limits, export/download, favorites system, progress and feedback

- **Prompts**: `prompts/` directory
  - Markdown files define the structure for content analysis tasks
  - Placeholders like `{{title}}`, `{{channel}}`, `{{transcript}}` are replaced server-side
  - API supports hot-reloading and listing available prompts

- **Testing**: `test/` directory
  - Contains utility and E2E scripts to check subtitle extraction, transcript pipeline, and integrations

## Notable Integrations & Features

- **Notion integration:**
  - Requires Notion integration token and database with required schema (see NOTION_SETUP.md).
  - Saves both metadata and rich analysis (markdown→Notion blocks) with main+child page structure for easy navigation and organization.
  - All token configuration can be via `.env` or through browser settings UI.

- **Analysis workflow:**
  1. User supplies YouTube URL + model + (optional) custom prompt
  2. Backend fetches video data and attempts transcript extraction using prioritized pipeline
  3. Assembles analysis prompt and calls OpenRouter API
  4. Response is parsed, downloadable as markdown, and optionally exported to Notion

- **Model Favorites and Prompt Templates:**
  - AI models can be favorited (saved in localStorage), surfacing preferred models in the UI
  - Custom prompt templates enable tailored analysis by video type or user intent
  - API supports hot-reloading prompt templates (for development)

- **Error handling and UX:**
  - Graceful fallback through transcript extraction/order, fallback to descriptions if transcripts fail
  - Extensive real-time feedback in UI
  - Download and export options for all key artifacts (report, transcript, AI prompt, video description)

## References to Existing Documentation
- Most setup and troubleshooting flows are covered in `README.md`, `QUICKSTART.md`, and `NOTION_SETUP.md`.
- Technical/feature summaries can be found in `PROJECT_SUMMARY.md`, `PRD_YOUTUBE_ANALYSIS_APP.md`, and implementation summary files.
- For Notion, ensure database schema matches expectation; see NOTION_SETUP.md for field types and integration setup.


## When Adding or Modifying Features
- Use the prompt system for any extension on video analysis flows
- When updating Notion sync/export logic, ensure child-linking is preserved for analysis content
- Maintain API endpoints and document non-obvious configuration in the main README or a new section in this file
- Place new custom prompt templates as Markdown files in `prompts/` and reload the backend prompts API


