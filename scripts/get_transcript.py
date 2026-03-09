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
        transcript = YouTubeTranscriptApi().fetch(video_id)
        # Convert objects to dictionaries for JSON serialization
        formatted_transcript = [
            {"text": segment.text, "start": segment.start, "duration": segment.duration}
            for segment in transcript
        ]
        print(json.dumps(formatted_transcript))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
