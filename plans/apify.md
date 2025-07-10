# Integration Plan for Apify Transcript API

The existing backend (Node/Express) fetches YouTube transcripts via the `youtube-transcript` package and a captions scraper.  In the current code, all methods are tried sequentially and if none return a transcript, an error is thrown (“All methods failed – no transcript data found”).  To improve robustness, we will add the Apify “YouTube video to Transcript” actor (ID `faVsWy9VTSNVIhWpR`) as a fallback.  The `.env` configuration already includes an `APIFY_API_KEY` variable, which we will use to authenticate API calls.

* **Use the Apify Actor as a fallback.**  In `getVideoTranscript`, after the existing methods fail, check for `process.env.APIFY_API_KEY`. If present, invoke the Apify actor via its API. For example, using Apify’s JavaScript client (install with `npm install apify-client`):

  ```js
  const { ApifyClient } = require('apify-client');
  const client = new ApifyClient({ token: process.env.APIFY_API_KEY });
  const runInput = { start_urls: [{ url: `https://www.youtube.com/watch?v=${videoId}` }] }; 
  const { defaultDatasetId } = await client.actor('scrapingxpert/youtube-video-to-transcript').call({ runInput });
  const { items } = await client.dataset(defaultDatasetId).listItems();
  ```

  (Each item typically contains a `transcript` field.)   This approach is analogous to examples in Apify’s docs (the actor ID `scrapingxpert/youtube-video-to-transcript` corresponds to `faVsWy9VTSNVIhWpR`).  If using Python/Flask instead, one could use the Apify Python SDK similarly (initialize `ApifyClient(token)` and call the actor) – the concept is the same.

* **Extract the transcript from Apify output.**  After the actor run completes, fetch items from the default dataset.  These items should include the video’s full transcript (for example, a JSON field named `transcript` or `text`).  Combine all segments into one string.  (As an example, one community integration uses an `ActorRunner` that returns an array of segments from the actor; each segment has a `text` field.  We would mirror that by concatenating item texts into a single `fullTranscript`.)  If the actor returns multiple items (e.g. due to pagination or chunking), concatenate them in order.

* **Integrate into existing flow.**  Add this Apify call as “Method 5” in `getVideoTranscript`, after the existing methods and before final error throw.  Pseudo-code:

  ```js
  if (!transcript) {
    console.log('Trying Apify actor for transcript...');
    if (!process.env.APIFY_API_KEY) throw new Error('Apify API key not configured');
    const client = new ApifyClient({ token: process.env.APIFY_API_KEY });
    const runInput = { start_urls: [{ url: videoURL }] };
    const { defaultDatasetId } = await client.actor('scrapingxpert/youtube-video-to-transcript').call({ runInput });
    const { items } = await client.dataset(defaultDatasetId).listItems();
    if (items && items.length > 0) {
      transcript = items.map(it => it.transcript || it.text || '').join(' ');
      console.log('Method 5 (Apify) succeeded');
    }
  }
  if (!transcript) {
    throw new Error('No transcript data found');
  }
  ```

  This ensures the Apify actor is only used when other methods fail. (As a safety check, do not call Apify if the key is missing.)

* **Error handling and timeouts.**  Wrap the Apify call in `try/catch`. If the actor run errors or times out, log the error and allow the overall process to fail gracefully.  The Apify Node client’s `.call()` waits until completion (or failure) of the actor run.  Set a reasonable timeout or use Apify’s `waitSecs` parameter if needed.  If the actor succeeds but returns no items, handle it like a missing transcript (skip or report an error).

* **Use transcripts and description in analysis.**  Once the transcript is obtained (either via Apify or earlier methods), append it to the video’s description and proceed with the existing AI-analysis pipeline. This matches the current flow (existing code replaces `{{transcript}}` in the prompt template) and ensures downstream APIs receive the transcript text.

By adding the Apify actor as described, the system gains a robust fallback path. The actor ID `faVsWy9VTSNVIhWpR` is known to extract YouTube captions reliably. With the `APIFY_API_KEY` configured and proper error handling around the actor call, this integration should improve transcript coverage without disrupting the existing workflow.

**Sources:** The project’s code shows the current transcript logic and error handling, the `.env` example indicates an `APIFY_API_KEY` slot, and community usage confirms the actor ID for YouTube transcripts. These guide where and how to insert the Apify API calls into the system.
