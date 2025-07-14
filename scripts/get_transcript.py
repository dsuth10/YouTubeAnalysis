#!/usr/bin/env python3
import sys
import json
from youtube_transcript_api import YouTubeTranscriptApi

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No video ID provided"}))
        sys.exit(1)
    video_id = sys.argv[1]
    try:
        transcript = YouTubeTranscriptApi.get_transcript(video_id)
        print(json.dumps(transcript))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
