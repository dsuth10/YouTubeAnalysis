const { extractVideoId } = require('./server');

function test(url, expected) {
  const result = extractVideoId(url);
  if (result !== expected) {
    console.error(`FAIL: ${url} -> ${result}, expected ${expected}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${url} -> ${result}`);
  }
}

const tests = [
  ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
  ['https://youtu.be/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
  ['https://www.youtube.com/embed/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
  ['https://www.youtube.com/shorts/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
  ['https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1s', 'dQw4w9WgXcQ']
];

for (const [url, id] of tests) {
  test(url, id);
}
