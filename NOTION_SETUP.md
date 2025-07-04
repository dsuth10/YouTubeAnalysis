# Notion Integration Setup Guide

This guide will help you set up the Notion integration for your YouTube Analysis app, allowing you to save AI-generated notes directly to your Notion databases.

## Prerequisites

1. A Notion account
2. A Notion workspace where you want to save your notes
3. A Notion database with the required properties (see Database Setup below)

## Step 1: Create a Notion Integration

1. Go to [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click **"New integration"**
3. Fill in the integration details:
   - **Name**: `YouTube Analysis App` (or any name you prefer)
   - **Associated workspace**: Select your workspace
   - **Capabilities**: 
     - ✅ **Read content**
     - ✅ **Update content**
     - ✅ **Insert content**
4. Click **"Submit"**
5. Copy the **Internal Integration Token** (starts with `secret_`)

## Step 2: Set Up Your Notion Database

Create a new database in Notion with the following properties:

### Required Properties:
- **Title** (Title type) - This is the default title property
- **URL** (URL type) - For the YouTube video link
- **Channel** (Text type) - For the YouTube channel name
- **Published Date** (Date type) - For the video publish date
- **Views** (Number type) - For the view count
- **Likes** (Number type) - For the like count

### Optional Properties:
- **Tags** (Multi-select type) - For categorizing your notes
- **Status** (Select type) - For tracking note status (e.g., "To Review", "Reviewed", "Archived")

### Database Setup Example:
```
Title: [Video Title]
URL: https://youtu.be/VIDEO_ID
Channel: [Channel Name]
Published Date: [Date]
Views: [Number]
Likes: [Number]
Tags: [Multi-select options]
Status: [Select options]
```

## Step 3: Share Database with Integration

1. Open your Notion database
2. Click the **"Share"** button in the top right
3. Click **"Add connections"**
4. Find and select your integration (e.g., "YouTube Analysis App")
5. Click **"Confirm"**

**Important**: The integration must have access to the database for the app to work properly.

## Step 4: Configure the App

1. Start your YouTube Analysis app
2. Click **"Settings"** in the footer
3. Enter your **Notion Integration Token** in the "Notion Integration Token" field
4. Click **"Save Settings"**

## Step 5: Using the Notion Integration

1. **Connect to Notion**: After configuring your token, click **"Connect Notion"** in the results section
2. **Select Database**: Choose your target database from the dropdown
3. **Save Notes**: After analyzing a video, click **"Save to Notion"** to create a new page in your database

## Features

### Automatic Content Parsing
The app automatically converts your AI-generated markdown notes into Notion blocks:
- **Headings** (H1, H2, H3) → Notion headings
- **Bullet points** → Notion bulleted lists
- **Numbered lists** → Notion numbered lists
- **Paragraphs** → Notion paragraph blocks
- **Blockquotes** → Notion quote blocks
- **Code blocks** → Notion code blocks

### Database Properties
Each saved note includes:
- **Title**: Video title
- **URL**: Direct link to the YouTube video
- **Channel**: YouTube channel name
- **Published Date**: Video publication date
- **Views**: View count
- **Likes**: Like count
- **Content**: Full AI analysis in structured Notion blocks

## Troubleshooting

### "Invalid Notion API token"
- Verify your integration token is correct
- Make sure you copied the entire token (starts with `secret_`)
- Check that the token hasn't been revoked

### "Notion integration lacks access to the selected database"
- Ensure you've shared the database with your integration
- Go to the database → Share → Add connections → Select your integration

### "Database schema mismatch"
- Verify your database has all required properties
- Property names must match exactly (case-sensitive)
- Check that property types are correct

### "No databases found"
- Make sure your integration has been added to at least one database
- Verify the integration has the correct permissions
- Try refreshing the database list

### "Failed to save note to Notion"
- Check your internet connection
- Verify the Notion API is accessible
- Check the browser console for detailed error messages

## Security Notes

- Your Notion integration token is stored locally in your browser
- The token is never sent to any third-party services
- Only your app communicates directly with Notion's API
- You can revoke the token at any time from your Notion integrations page

## Advanced Configuration

### Environment Variables
For server-side configuration, you can set the `NOTION_TOKEN` environment variable:

```bash
# In your .env file
NOTION_TOKEN=your_integration_token_here
```

### Custom Database Schema
If you want to use different property names, you can modify the server code in `server.js`:

```javascript
// In the saveNote endpoint, update the properties object:
properties: {
    'Your Custom Title Property': {
        title: [{ type: 'text', text: { content: videoInfo.title } }]
    },
    'Your Custom URL Property': {
        url: `https://youtu.be/${videoInfo.videoId}`
    },
    // ... other properties
}
```

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your Notion integration settings
3. Ensure your database schema matches the requirements
4. Check that your integration has the necessary permissions

For additional help, refer to the [Notion API documentation](https://developers.notion.com/). 