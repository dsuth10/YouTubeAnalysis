https://console.apify.com/actors/faVsWy9VTSNVIhWpR/information/latest/readme#youtube-transcript-scraper-actor-documentation

YouTube Transcript Scraper Actor Documentation
Overview
The YouTube Transcript Scraper is a powerful tool designed to extract transcripts from YouTube videos quickly and efficiently. This actor simplifies retrieving textual content from YouTube videos, making it ideal for researchers, content creators, educators, and developers who need video transcripts for analysis, subtitles, or other use cases.

This actor supports publicly available YouTube videos with transcripts enabled, ensuring a hassle-free experience.

Features
Fast and Efficient: Retrieves YouTube video transcripts in seconds.
Accurate Extraction: Captures the full transcript, segmented by timestamps.
SEO-Friendly: Extracted transcripts are perfect for creating optimized written content to boost your website's SEO.
Use Cases
Content Repurposing: Turn video content into blog posts or articles.
SEO Optimization: Use transcripts to enhance website indexing and organic traffic.
Academic Research: Quickly access and analyze video content for studies.
Subtitling: Generate subtitles or captions for accessibility and localization.
Input Parameters
The actor requires a single input parameter to function.

Input Parameter
Parameter Name	Type	Description
videoUrl	String	The full URL of the YouTube video to scrape the transcript from. Example: https://www.youtube.com/watch?v=IELMSD2kdmk.
Default Value
const { videoUrl = 'https://www.youtube.com/watch?v=IELMSD2kdmk' } = input;

If no videoUrl is provided, the actor will use the default YouTube link.

Output
The actor outputs the transcript in JSON and table format.

Example Output
{
  "searchResult": [
    {
      "start": "0.320",
      "dur": "4.080",
      "text": "Apache spark an open- Source data"
    },
    {
      "start": "2.480",
      "dur": "3.839",
      "text": "analytics engine that can process"
    },
    ...
  ]
}

Key Fields
videoUrl: The input video URL.
transcript: An array of objects containing:
start: The timestamp indicating when the text appears.
dur: The duration of the text.
text: The transcript text associated with the timestamp.
How to Use
Set Up the Input:
Provide the videoUrl parameter, either through the Apify interface or via an API call.

Run the Actor:
Start the actor to begin scraping the transcript.

Retrieve the Output:
Access the generated transcript in JSON format, ready for your projects.

SEO Benefits
Using the YouTube Transcript Scraper can significantly enhance your website's SEO by enabling you to:

Boost Keyword Density: Include naturally occurring keywords from video transcripts in your content.
Enhance Accessibility: Provide transcript-based content for users who prefer text over videos.
Increase Content Visibility: Use transcripts to optimize metadata and descriptions.
Limitations
The actor works only with public YouTube videos that have transcripts enabled.
Private or restricted videos are not supported.
