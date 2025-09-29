#!/usr/bin/env python3
import sys
import json
from gtts import gTTS
import io

def generate_speech(text, speed=1.0):
    # gTTS doesn't support speed adjustment directly, but we can adjust the speed
    # by changing the text processing or using a different approach
    tts = gTTS(text=text, lang='en', slow=(speed < 0.8))
    
    # Save to bytes buffer
    buffer = io.BytesIO()
    tts.write_to_fp(buffer)
    return buffer.getvalue()

if __name__ == "__main__":
    # Read input from stdin
    input_data = json.loads(sys.stdin.read())
    text = input_data.get('text', '')
    speed = float(input_data.get('speed', 1.0))
    
    try:
        audio_data = generate_speech(text, speed)
        # Output the binary MP3 data to stdout
        sys.stdout.buffer.write(audio_data)
        sys.stdout.flush()
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)
