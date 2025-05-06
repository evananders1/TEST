import { useState, useRef, useEffect } from 'react';
import React from 'react';
import { Upload, Download, Play, Pause, X, Volume2, Volume1, VolumeX } from 'lucide-react';
import { Link } from 'react-router-dom';
import './MainScreen.css';

export default function MainScreen() {
  const [audioFiles, setAudioFiles] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volumes, setVolumes] = useState([]);
  const [positions, setPositions] = useState([]);
  const [durations, setDurations] = useState([]);
  const [audioElements, setAudioElements] = useState([]);
  const [mixedAudioUrl, setMixedAudioUrl] = useState(null);
  const [isMixing, setIsMixing] = useState(false);
  const mixedAudioRef = useRef(null);
  const [updateInterval, setUpdateInterval] = useState(null);

  // Add effect states
  const [effects, setEffects] = useState({
    chorus: false,
    phaser: false,
    compressor: 0,
    delay: 0,
    distortion: 0,
    gain: 1,
    highpass: 0,
    lowpass: 0,
    pitchShift: 0,
    reverb: 0
  });

  // Effect change handlers
  const handleEffectChange = (effect, value) => {
    setEffects(prev => ({
      ...prev,
      [effect]: value
    }));
  };

  useEffect(() => {
    setVolumes(prev => {
      const newVolumes = [...prev];
      while (newVolumes.length < audioFiles.length) {
        newVolumes.push(1.0); // Default volume is 100% (full) 
      }
      return newVolumes.slice(0, audioFiles.length);
    });

    setPositions(prev => {
      const newPositions = [...prev];
      while (newPositions.length < audioFiles.length) {
        newPositions.push(0);
      }
      return newPositions.slice(0, audioFiles.length);
    });

    setDurations(prev => {
      const newDurations = [...prev];
      while (newDurations.length < audioFiles.length) {
        newDurations.push(0);
      }
      return newDurations.slice(0, audioFiles.length);
    });
    
    // Auto generate mix preview when files change - example: when user adjusts the volume it will need to generate a new mix
    if (audioFiles.length > 0) {
      mixAudios();
    } else {
      setMixedAudioUrl(null);
    }
  }, [audioFiles.length]);

  useEffect(() => {
    // Clean up old audio elements
    audioElements.forEach(audio => {
      if (audio) {
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
      }
    });

    // Create new audio elements
    const newAudioElements = audioFiles.map((file, index) => {
      const audio = new Audio(URL.createObjectURL(file));
      
      // Initial volume
      audio.volume = volumes[index] || 1;
      
      audio.addEventListener('loadedmetadata', () => {
        handleMetadataLoaded(index, audio.duration);
      });
      
      audio.addEventListener('ended', handleAudioEnded);
      
      return audio;
    });

    setAudioElements(newAudioElements);

    return () => {
      newAudioElements.forEach(audio => {
        if (audio) {
          audio.pause();
          audio.removeAttribute('src');
          audio.load();
        }
      });
    };
  }, [audioFiles]);

  // Handle file upload
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length > 0) {
      // Limit max number of files - we can change this to whatever we feel is best later on if needed
      const totalFiles = [...audioFiles, ...files].slice(0, 8);
      setAudioFiles(totalFiles);
    }
  };

  // Remove an audio file
  const removeAudio = (index) => {
    // Pause if playing
    if (audioElements[index]) {
      audioElements[index].pause();
    }
    
    const newFiles = [...audioFiles];
    newFiles.splice(index, 1);
    setAudioFiles(newFiles);
    
    const newVolumes = [...volumes];
    newVolumes.splice(index, 1);
    setVolumes(newVolumes);
    
    const newPositions = [...positions];
    newPositions.splice(index, 1);
    setPositions(newPositions);
    
    const newDurations = [...durations];
    newDurations.splice(index, 1);
    setDurations(newDurations);
    
    const newAudioElements = [...audioElements];
    newAudioElements.splice(index, 1);
    setAudioElements(newAudioElements);
  };

  // Handle volume change for a specific audio file
  const handleVolumeChange = (index, value) => {
    const newVolumes = [...volumes];
    newVolumes[index] = parseFloat(value);
    setVolumes(newVolumes);
    
    if (audioElements[index]) {
      audioElements[index].volume = newVolumes[index];
    }
    
    // Update mix when volume changes
    mixAudios();
  };

  // Handle position change for a specific audio file
  const handlePositionChange = (index, value) => {
    const newPositions = [...positions];
    newPositions[index] = parseFloat(value);
    setPositions(newPositions);
    
    if (audioElements[index]) {
      audioElements[index].currentTime = newPositions[index];
    }
  };

  // Handle audio metadata loaded to get duration
  const handleMetadataLoaded = (index, duration) => {
    setDurations(prev => {
      const newDurations = [...prev];
      newDurations[index] = duration;
      return newDurations;
    });
  };

  // Update positions during playback
  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setPositions(prevPositions => 
          audioElements.map((audio, index) => 
            audio ? audio.currentTime : prevPositions[index]
          )
        );
      }, 100);
      setUpdateInterval(interval);
    } else if (updateInterval) {
      clearInterval(updateInterval);
      setUpdateInterval(null);
    }
    
    return () => {
      if (updateInterval) {
        clearInterval(updateInterval);
      }
    };
  }, [isPlaying, audioElements]);

  // Play or pause all audio files
  const togglePlayback = () => {
    if (isPlaying) {
      audioElements.forEach(audio => {
        if (audio) audio.pause();
      });
    } else {
      const playPromises = audioElements.map((audio, index) => {
        if (audio) {
          audio.volume = volumes[index] || 1;
          // Reset time if at the end
          if (audio.ended || audio.currentTime >= audio.duration - 0.1) {
            audio.currentTime = 0;
          }
          return audio.play().catch(err => console.error("Playback failed:", err));
        }
        return Promise.resolve();
      });
      
      Promise.all(playPromises)
        .then(() => setIsPlaying(true))
        .catch(err => console.error("Error during playback:", err));
    }
    setIsPlaying(!isPlaying);
  };

  // Reset isPlaying when audio ends
  const handleAudioEnded = () => {
    // Check if all audio files have ended
    const allEnded = audioElements.every(audio => 
      !audio || audio.ended || audio.paused
    );
    
    if (allEnded) {
      setIsPlaying(false);
    }
  };

  // Format time
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Get volume icon
  const getVolumeIcon = (volume) => {
    if (volume === 0) return <VolumeX size={16} />;
    if (volume < 0.5) return <Volume1 size={16} />;
    return <Volume2 size={16} />;
  };

  // Web Audio API to mix
  const mixAudios = async () => {
    if (audioFiles.length === 0) return;
    
    setIsMixing(true);

    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const audioBuffers = [];
      const volumeLevels = [...volumes];

      // Load all audio files
      for (let i = 0; i < audioFiles.length; i++) {
        const file = audioFiles[i];
        try {
          const arrayBuffer = await file.arrayBuffer();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          audioBuffers.push({ buffer: audioBuffer, volume: volumeLevels[i] || 1 });
        } catch (error) {
          console.error("Error decoding audio data:", error);
        }
      }

      if (audioBuffers.length === 0) {
        console.error("No audio buffers were successfully decoded");
        setIsMixing(false);
        return;
      }

      // Find the longest audio buffer for download to exend the track for that duration
      let maxLength = Math.max(...audioBuffers.map(item => item.buffer.length));
      const sampleRate = audioContext.sampleRate;
      
      const mixedBuffer = audioContext.createBuffer(
        2,
        maxLength,
        sampleRate
      );
      
      // Stack the audio buffers
      for (let item of audioBuffers) {
        const buffer = item.buffer;
        const volume = item.volume;
        
        for (let channel = 0; channel < 2; channel++) {
          const mixedChannelData = mixedBuffer.getChannelData(channel);
          const channelData = channel < buffer.numberOfChannels ? 
            buffer.getChannelData(channel) : 
            buffer.getChannelData(0);
            
          for (let i = 0; i < buffer.length; i++) {
            mixedChannelData[i] += channelData[i] * volume * (1 / Math.sqrt(audioBuffers.length));
          }
        }
      }
      
      // Convert the mixed buffer to a WAV file (prepare for download)
      const wavBuffer = audioBufferToWav(mixedBuffer);
      const blob = new Blob([wavBuffer], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      
      if (mixedAudioUrl) {
        URL.revokeObjectURL(mixedAudioUrl);
      }
      
      setMixedAudioUrl(url);
    } catch (error) {
      console.error("Error during audio mixing:", error);
    } finally {
      setIsMixing(false);
    }
  };

  // Helper function to convert AudioBuffer to WAV format
  function audioBufferToWav(buffer) {
    const numOfChannels = buffer.numberOfChannels;
    const length = buffer.length * numOfChannels * 2;
    const sampleRate = buffer.sampleRate;
    const blockAlign = numOfChannels * 2;
    const byteRate = sampleRate * blockAlign;
    const wavDataView = new DataView(new ArrayBuffer(44 + length));

    writeString(wavDataView, 0, 'RIFF');
    wavDataView.setUint32(4, 36 + length, true);
    writeString(wavDataView, 8, 'WAVE');

    writeString(wavDataView, 12, 'fmt ');
    wavDataView.setUint32(16, 16, true); // subchunk size
    wavDataView.setUint16(20, 1, true); // PCM format
    wavDataView.setUint16(22, numOfChannels, true);
    wavDataView.setUint32(24, sampleRate, true);
    wavDataView.setUint32(28, byteRate, true);
    wavDataView.setUint16(32, blockAlign, true);
    wavDataView.setUint16(34, 16, true); // bits per sample

    writeString(wavDataView, 36, 'data');
    wavDataView.setUint32(40, length, true);

    const channelData = [];
    for (let i = 0; i < numOfChannels; i++) {
      channelData.push(buffer.getChannelData(i));
    }

    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, channelData[channel][i]));
        const value = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        wavDataView.setInt16(offset, value, true);
        offset += 2;
      }
    }

    return wavDataView.buffer;
  }

  function writeString(dataView, offset, string) {
    for (let i = 0; i < string.length; i++) {
      dataView.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  // Download mixed audio
  const downloadMix = () => {
    if (!mixedAudioUrl) {
      mixAudios().then(() => {
        triggerDownload();
      });
    } else {
      triggerDownload();
    }
  };
  
  const triggerDownload = () => {
    if (!mixedAudioUrl) return;
    
    const a = document.createElement('a');
    a.href = mixedAudioUrl;
    a.download = 'audio-mix.wav';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  return (
    <div className="App">
      {/* Navigation Tabs */}
      <div className="tabs">
        <Link to="/home"><button className="home">Home</button></Link>
        <Link to="/hard"><button className="hard">Mixer</button></Link>
      </div>
      <div className="app-container">
        {/* Sidebar */}
        <div className="sidebar">
          {/* Control Buttons */}
          <div className="control-buttons">
            {/* Upload Button */}
            <label className="control-button upload-button">
              <Upload size={16} />
              <span>Upload</span>
              <input 
                type="file" 
                accept=".mp3,.wav" 
                multiple 
                onChange={handleFileUpload} 
                className="hidden-input" 
              />
            </label>
            
            {/* Download Mix Button */}
            <button 
              onClick={downloadMix}
              disabled={audioFiles.length === 0 || isMixing}
              className={`control-button download-button ${audioFiles.length === 0 || isMixing ? 'disabled' : ''}`}
            >
              <Download size={16} />
              <span>{isMixing ? 'Processing...' : 'Download'}</span>
            </button>
            
            {/* Play/Pause Button */}
            <button 
              onClick={togglePlayback}
              disabled={audioFiles.length === 0}
              className={`control-button play-button ${audioFiles.length === 0 ? 'disabled' : ''}`}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>
          </div>
          
          {/* Audio Files List */}
          <div className="audio-files-container">
            {audioFiles.length === 0 ? (
              <div className="no-files-message">
                Upload audio files to start mixing
              </div>
            ) : (
              <div className="audio-files-list">
                {audioFiles.map((file, index) => (
                  <div key={index} className="audio-track">
                    <div className="track-header">
                      <div className="track-name" title={file.name}>
                        {file.name}
                      </div>
                      <button 
                        onClick={() => removeAudio(index)}
                        className="remove-button"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    
                    {/* Volume control */}
                    <div className="volume-control">
                      <div className="volume-icon">
                        {getVolumeIcon(volumes[index] || 1)}
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="1"
                        step="0.01"
                        value={volumes[index] || 1}
                        onChange={(e) => handleVolumeChange(index, e.target.value)}
                        className="volume-slider"
                      />
                      <span className="volume-value">
                        {Math.round((volumes[index] || 1) * 100)}%
                      </span>
                    </div>
                    
                    {/* Time control */}
                    <div className="position-control">
                      <input 
                        type="range" 
                        min="0" 
                        max={durations[index] || 0}
                        step="0.1"
                        value={positions[index] || 0}
                        onChange={(e) => handlePositionChange(index, e.target.value)}
                        className="position-slider"
                      />
                      <span className="position-value">
                        {formatTime(positions[index] || 0)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Mix Preview */}
          {audioFiles.length > 0 && (
            <div className="mix-preview-sidebar">
              <h3 className="mix-preview-title">Mix Preview</h3>
              {mixedAudioUrl ? (
                <audio 
                  ref={mixedAudioRef}
                  src={mixedAudioUrl} 
                  controls 
                  className="audio-player-sidebar"
                />
              ) : (
                <div className="mix-loading">
                  Creating mix...
                </div>
              )}
            </div>
          )}
          
          {/* Max number of uploads */}
          <div className="file-count">
            {audioFiles.length} / 8 files
          </div>
        </div>
        
        {/* Main content */}
        <div className="main-content">
          {Main()}
        </div>

        {/* Effects Panel */}
        <div className="effects-panel">
          <h3 className="effects-title">Audio Effects</h3>
          
          {/* Switches */}
          <div className="effects-switches">
            <div className="effect-switch">
              <label className="switch">
                <input
                  type="checkbox"
                  checked={effects.chorus}
                  onChange={(e) => handleEffectChange('chorus', e.target.checked)}
                />
                <span className="slider round"></span>
              </label>
              <span className="effect-label">Chorus</span>
            </div>
            
            <div className="effect-switch">
              <label className="switch">
                <input
                  type="checkbox"
                  checked={effects.phaser}
                  onChange={(e) => handleEffectChange('phaser', e.target.checked)}
                />
                <span className="slider round"></span>
              </label>
              <span className="effect-label">Phaser</span>
            </div>
          </div>

          {/* Sliders */}
          <div className="effects-sliders">
            <div className="effect-slider">
              <span className="effect-label">Compressor</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={effects.compressor}
                onChange={(e) => handleEffectChange('compressor', parseFloat(e.target.value))}
                className="volume-slider"
              />
              <span className="volume-value">{Math.round(effects.compressor * 100)}%</span>
            </div>

            <div className="effect-slider">
              <span className="effect-label">Delay</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={effects.delay}
                onChange={(e) => handleEffectChange('delay', parseFloat(e.target.value))}
                className="volume-slider"
              />
              <span className="volume-value">{Math.round(effects.delay * 100)}%</span>
            </div>

            <div className="effect-slider">
              <span className="effect-label">Distortion</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={effects.distortion}
                onChange={(e) => handleEffectChange('distortion', parseFloat(e.target.value))}
                className="volume-slider"
              />
              <span className="volume-value">{Math.round(effects.distortion * 100)}%</span>
            </div>

            <div className="effect-slider">
              <span className="effect-label">Gain</span>
              <input
                type="range"
                min="0"
                max="2"
                step="0.01"
                value={effects.gain}
                onChange={(e) => handleEffectChange('gain', parseFloat(e.target.value))}
                className="volume-slider"
              />
              <span className="volume-value">{Math.round(effects.gain * 100)}%</span>
            </div>

            <div className="effect-slider">
              <span className="effect-label">Highpass</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={effects.highpass}
                onChange={(e) => handleEffectChange('highpass', parseFloat(e.target.value))}
                className="volume-slider"
              />
              <span className="volume-value">{Math.round(effects.highpass * 100)}%</span>
            </div>

            <div className="effect-slider">
              <span className="effect-label">Lowpass</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={effects.lowpass}
                onChange={(e) => handleEffectChange('lowpass', parseFloat(e.target.value))}
                className="volume-slider"
              />
              <span className="volume-value">{Math.round(effects.lowpass * 100)}%</span>
            </div>

            <div className="effect-slider">
              <span className="effect-label">Pitch Shift</span>
              <input
                type="range"
                min="-12"
                max="12"
                step="0.1"
                value={effects.pitchShift}
                onChange={(e) => handleEffectChange('pitchShift', parseFloat(e.target.value))}
                className="volume-slider"
              />
              <span className="volume-value">{effects.pitchShift.toFixed(1)}</span>
            </div>

            <div className="effect-slider">
              <span className="effect-label">Reverb</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={effects.reverb}
                onChange={(e) => handleEffectChange('reverb', parseFloat(e.target.value))}
                className="volume-slider"
              />
              <span className="volume-value">{Math.round(effects.reverb * 100)}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Main() {
  // State for YouTube converter
  const [url, setUrl] = useState('');
  const [ytMessage, setYTMessage] = useState('');
  const [ytLoading, setYTLoading] = useState(false);

  // State for audio processing
  const [file, setFile] = useState(null);
  const [stems, setStems] = useState("2stems");
  const [audioMessage, setAudioMessage] = useState('');
  const [audioLoading, setAudioLoading] = useState(false);

  // Submit for YouTube Converter
  const handleYTSubmit = async (e) => {
    e.preventDefault();
    setYTMessage('');
    setYTLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/youtube_converter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();
      setYTMessage(data.message || data.error || 'No response from server.');
    } catch {
      setYTMessage('Failed to connect to the server.');
    } finally {
      setYTLoading(false);
    }
  };

  // Submit for Audio Processor
  const handleAudioSubmit = async (e) => {
    e.preventDefault();
    setAudioMessage('');
    setAudioLoading(true);

    if (!file) {
      setAudioMessage("Please select an audio file.");
      setAudioLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("stems", stems);

    try {
      const res = await fetch("http://localhost:5000/api/process_audio", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setAudioMessage(data.message || data.error || "Unexpected response.");
    } catch {
      setAudioMessage("Failed to connect to the server.");
    } finally {
      setAudioLoading(false);
    }
  };

  return (
    <div className="App p-6 bg-gray-100 min-h-screen">
      {/* Tabs */}
      <div className="tabs mb-6">
       
      </div>


      {/* YouTube to MP3 Converter */}
      <div className="youtube-converter bg-white p-6 shadow-md rounded max-w-md mx-auto mb-8">
        <h2 className="text-xl font-bold mb-4 text-center">YouTube to MP3 Converter</h2>
        <form onSubmit={handleYTSubmit} className="flex flex-col items-center space-y-3">
          <input
            type="text"
            placeholder="Paste YouTube URL here"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded"
          />
          <button
            type="submit"
            disabled={ytLoading || !url}
            className="bg-blue-500 text-white px-6 py-2 rounded w-full disabled:opacity-50"
          >
            {ytLoading ? 'Converting...' : 'Convert'}
          </button>
          {ytMessage && <p className="text-sm text-green-700 mt-2 text-center">{ytMessage}</p>}
        </form>
      </div>

      {/* Audio Stem Splitter */}
      <div className="audio-processor bg-white p-6 shadow-md rounded max-w-md mx-auto">
        <h2 className="text-xl font-bold mb-4 text-center">Audio Stem Splitter</h2>
        <form onSubmit={handleAudioSubmit} className="flex flex-col items-center space-y-3">
          <input
            type="file"
            accept="audio/*"
            onChange={(e) => setFile(e.target.files[0])}
            className="w-full"
          />
          <select
            value={stems}
            onChange={(e) => setStems(e.target.value)}
            className="w-full border border-gray-300 px-3 py-2 rounded"
          >
            <option value="2stems">2 Stems (Vocals + Accompaniment)</option>
            <option value="4stems">4 Stems (Vocals, Drums, Bass, Other)</option>
            <option value="5stems">5 Stems (Vocals, Drums, Bass, Piano, Other)</option>
          </select>
          <button
            type="submit"
            disabled={audioLoading}
            className="bg-purple-600 text-white px-6 py-2 rounded w-full disabled:opacity-50"
          >
            {audioLoading ? 'Processing...' : 'Process Audio'}
          </button>
          {audioMessage && <p className="text-sm text-green-700 mt-2 text-center">{audioMessage}</p>}
        </form>
      </div>
    </div>
  );
}

export function Body() {
  return (
    <div className="Body">
      {/* Additional content if needed */}
    </div>
  );
}
