require('dotenv').config();
const { getVideoTranscript } = require('../server');

function log(msg) { console.log(`[smoke] ${msg}`); }
function assert(cond, msg) { if (!cond) { console.error(`[smoke] FAIL: ${msg}`); process.exitCode = 1; } else { console.log(`[smoke] PASS: ${msg}`); } }

async function testWithSubs() {
  const videoId = process.env.TEST_SUBS_VIDEO_ID || 'dQw4w9WgXcQ';
  log(`Testing transcript pipeline on video with subs: ${videoId}`);
  try {
    const result = await getVideoTranscript(videoId);
    assert(result && typeof result.text === 'string', 'Result contains text');
    assert(result.text.trim().length > 0, 'Transcript text is non-empty');
    log(`Source used: ${result.source}`);
  } catch (e) {
    console.error(`[smoke] Error: ${e.message}`);
    process.exitCode = 1;
  }
}

async function testASRIfConfigured() {
  const videoId = process.env.TEST_NO_SUBS_VIDEO_ID;
  if (!videoId) {
    log('Skipping ASR test (TEST_NO_SUBS_VIDEO_ID not set)');
    return;
  }
  if (!process.env.OPENAI_API_KEY) {
    log('Skipping ASR test (OPENAI_API_KEY not set)');
    return;
  }
  process.env.TRANSCRIBE_PROVIDER = process.env.TRANSCRIBE_PROVIDER || 'openai';
  log(`Testing ASR fallback on video: ${videoId}`);
  try {
    const result = await getVideoTranscript(videoId);
    assert(result && typeof result.text === 'string', 'ASR result contains text');
    assert(result.text.trim().length > 0, 'ASR transcript text is non-empty');
    log(`ASR source: ${result.source}`);
  } catch (e) {
    console.error(`[smoke] ASR error: ${e.message}`);
    // Do not fail the whole run; ASR can be flaky without cookies/yt-dlp env setup
  }
}

(async () => {
  await testWithSubs();
  await testASRIfConfigured();
})();


