#!/usr/bin/env python3
import sys
import json
from youtube_transcript_api import YouTubeTranscriptApi


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Missing video id"}))
        sys.exit(1)
    video_id = sys.argv[1]
    languages = [
        'en', 'en-US', 'en-GB', 'en-CA', 'en-AU',
        'de', 'fr', 'es', 'pt', 'it'
    ]
    try:
        transcript_list = YouTubeTranscriptApi.get_transcript(video_id, languages=languages)
        print(json.dumps(transcript_list))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
