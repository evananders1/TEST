from flask import Flask, render_template, request, jsonify
import yt_dlp
import os
import subprocess

app = Flask(__name__)

# Set up ffmpeg path
FFMPEG_PATH = r'C:\ffmpeg\ffmpeg.exe'  # Make sure ffmpeg is correctly installed

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/download', methods=['POST'])
def download_and_convert():
    url = request.form.get('url')
    if not url:
        return jsonify({"error": "Please enter a valid YouTube URL."})

    output_dir = os.path.expanduser("~")
    
    ydl_opts = {
        'format': 'bestaudio/best',
        'extractaudio': True,
        'outtmpl': os.path.join(output_dir, '%(title)s.%(ext)s'),
        'ffmpeg_location': FFMPEG_PATH,
        'verbose': True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])

        # Get the downloaded file path
        downloaded_file = os.path.join(output_dir, f'{ydl.prepare_filename(ydl.extract_info(url, download=False))}')
        filename_without_extension, ext = os.path.splitext(downloaded_file)

        if ext.lower() != '.mp3':
            output_mp3 = filename_without_extension + '.mp3'

            ffmpeg_command = [
                FFMPEG_PATH, 
                '-i', downloaded_file,
                '-vn', 
                '-acodec', 'libmp3lame',
                '-ab', '192k', 
                output_mp3
            ]

            subprocess.run(ffmpeg_command, check=True)

            return jsonify({"success": f"Download and conversion completed! Saved as MP3: {output_mp3}"})
        else:
            return jsonify({"success": "File is already in MP3 format."})

    except yt_dlp.DownloadError as e:
        return jsonify({"error": f"Download failed: {str(e)}"})
    except Exception as e:
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"})

if __name__ == '__main__':
    app.run(debug=True)
