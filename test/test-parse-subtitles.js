const { parseVttToText, parseSrtToText } = require('../server');

function assert(condition, message) {
  if (!condition) {
    console.error('FAIL:', message);
    process.exitCode = 1;
  } else {
    console.log('PASS:', message);
  }
}

// Sample VTT with header, cue id, timecodes, multi-line text, NOTE and STYLE blocks
const sampleVtt = `WEBVTT\n\nNOTE This is a note\n\nSTYLE\n::cue { color: #fff }\n\n1\n00:00:00.000 --> 00:00:02.000\nHello world\nThis is line two\n\n2\n00:00:02.500 --> 00:00:04.000\nAnother cue\n\n`;

// Expected VTT output: lines joined, no timestamps or tags
const expectedVtt = 'Hello world This is line two Another cue';

// Sample SRT with indices and timestamps
const sampleSrt = `1\n00:00:00,000 --> 00:00:02,000\nHello world\nThis is line two\n\n2\n00:00:02,500 --> 00:00:04,000\nAnother cue\n\n`;

const expectedSrt = 'Hello world This is line two Another cue';

function run() {
  const vttOut = parseVttToText(sampleVtt);
  assert(typeof vttOut === 'string', 'VTT output is a string');
  assert(vttOut.includes('Hello world') && vttOut.includes('Another cue'), 'VTT contains cue text');
  assert(!/\d{2}:\d{2}:\d{2}[\.,]\d{3}\s+-->/.test(vttOut), 'VTT has no timestamps');
  assert(vttOut.trim() === expectedVtt, 'VTT text matches expected');

  const srtOut = parseSrtToText(sampleSrt);
  assert(typeof srtOut === 'string', 'SRT output is a string');
  assert(srtOut.includes('Hello world') && srtOut.includes('Another cue'), 'SRT contains cue text');
  assert(!/\d{2}:\d{2}:\d{2}[\.,]\d{3}\s+-->/.test(srtOut), 'SRT has no timestamps');
  assert(srtOut.trim() === expectedSrt, 'SRT text matches expected');
}

run();



