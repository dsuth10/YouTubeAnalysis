# Custom Prompt Feature Implementation

## Overview

The YouTube Analysis app now supports **custom analysis prompts** that allow users to choose specialized templates for different types of video content. This feature enables more targeted and relevant analysis based on the video type (e.g., tutorials, reviews, lectures, etc.).

## What Was Implemented

### Backend Changes (server.js)

1. **Prompt Loading System**
   - Added `loadPrompts()` function to read all `.md` files from the `prompts/` directory
   - Implemented caching mechanism with `cachedPrompts` global variable
   - Added `getPrompts()` and `reloadPrompts()` utility functions

2. **New API Endpoints**
   - `GET /api/prompts` - Returns list of available prompts
   - `POST /api/prompts/reload` - Reloads prompts from disk (for development)
   - `GET /api/health` - Health check endpoint

3. **Enhanced Analysis Function**
   - Modified `analyzeContent()` to accept `promptId` parameter
   - Added placeholder replacement system (`{{title}}`, `{{channel}}`, `{{description}}`, `{{transcript}}`)
   - Fallback to default prompt if no custom prompt is selected

4. **Updated Process Endpoint**
   - Modified `/api/process` to accept `promptId` in request body
   - Integrated custom prompt selection with existing analysis flow

### Frontend Changes

1. **UI Components**
   - Added prompt selector dropdown in `public/index.html`
   - Styled with CSS to match existing form elements
   - Added helpful text explaining the feature

2. **JavaScript Functionality**
   - Added `loadPrompts()` function to fetch available prompts
   - Added `populatePromptSelect()` to populate the dropdown
   - Modified `handleFormSubmit()` to include selected prompt ID
   - Updated `analyzeVideo()` to pass prompt ID to backend

3. **User Experience**
   - Default option shows "Default Analysis (General)"
   - Seamless integration with existing model selection
   - No disruption to existing workflow

### Prompt File Structure

All prompt files are stored in the `prompts/` directory as Markdown files:

```
prompts/
├── Default Analysis.md
├── Hardware Review Video.md
├── Instructional Video.md
├── Long-Form Discussion Video.md
├── News Report Video.md
├── Scientific Lecture Video.md
├── Software Review Video.md
└── Tutorial Video.md
```

### Prompt File Format

Each prompt file follows this structure:

```markdown
# Prompt Name

You are a [role] summarizing a [video type]...

Video Title: {{title}}
Channel: {{channel}}
Description: {{description}}

Transcript: {{transcript}}

[Analysis instructions...]
```

### Placeholder System

The following placeholders are automatically replaced:
- `{{title}}` - Video title
- `{{channel}}` - Channel name
- `{{description}}` - Video description (truncated to 500 chars)
- `{{transcript}}` - Full video transcript

## Available Prompts

1. **Default Analysis** - General-purpose analysis for any video type
2. **Hardware Review Video** - Specialized for tech hardware reviews
3. **Instructional Video** - Focused on educational content
4. **Long-Form Discussion Video** - For podcasts and panel discussions
5. **News Report Video** - For news and current events
6. **Scientific Lecture Video** - For academic and scientific content
7. **Software Review Video** - Specialized for software reviews
8. **Tutorial Video** - For step-by-step tutorials

## How to Use

1. **Select a Prompt**: Choose from the dropdown in the analysis form
2. **Analyze Video**: The selected prompt will be used for analysis
3. **View Results**: Analysis will follow the structure defined in the prompt

## Technical Details

### Error Handling
- Graceful fallback to default prompt if custom prompt fails
- Proper error messages for missing or corrupted prompt files
- Validation of prompt file format

### Performance
- Prompts are cached in memory for fast access
- Reload endpoint available for development/testing
- Minimal impact on existing performance

### Security
- Only `.md` files are loaded from `prompts/` directory
- Path traversal protection implemented
- Input sanitization for placeholder replacement

## Testing

The implementation has been tested with:
- ✅ Prompt loading and caching
- ✅ API endpoints functionality
- ✅ Frontend integration
- ✅ Placeholder replacement
- ✅ Error handling
- ✅ Health check endpoint

## Future Enhancements

1. **Prompt Management UI**
   - Upload new prompts via web interface
   - Edit existing prompts
   - Delete prompts with confirmation

2. **Prompt Preview**
   - Show prompt content before selection
   - Preview with sample data

3. **Advanced Features**
   - Prompt categories/tags
   - User-defined prompts
   - Prompt sharing

## Files Modified

- `server.js` - Backend implementation
- `public/index.html` - UI changes
- `public/script.js` - Frontend functionality
- `public/styles.css` - Styling
- `prompts/*.md` - Prompt template files

## API Reference

### GET /api/prompts
Returns list of available prompts.

**Response:**
```json
{
  "prompts": [
    {
      "id": "prompt-id",
      "name": "Display Name"
    }
  ]
}
```

### POST /api/prompts/reload
Reloads prompts from disk.

**Response:**
```json
{
  "success": true,
  "message": "Prompts reloaded successfully",
  "prompts": [...]
}
```

### POST /api/process
Enhanced to accept `promptId` parameter.

**Request:**
```json
{
  "url": "youtube-url",
  "model": "model-id",
  "promptId": "prompt-id"
}
```

## Conclusion

The custom prompt feature has been successfully implemented and provides users with specialized analysis templates for different video types. The implementation maintains backward compatibility while adding powerful new functionality to the YouTube Analysis app. 