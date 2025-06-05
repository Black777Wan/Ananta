import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

interface AudioPlayerProps {
  blockUuid?: string;
}

interface AudioTimestamp {
  id: number;
  recording_id: number;
  block_uuid: string;
  timestamp_in_audio_ms: number;
  block_created_at_realtime: string;
  recording: {
    id: number;
    file_name: string;
    file_path: string;
    mime_type: string;
  };
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ blockUuid }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [audioTimestamps, setAudioTimestamps] = useState<AudioTimestamp[]>([]);
  const [currentRecording, setCurrentRecording] = useState<AudioTimestamp | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const waveformRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (blockUuid) {
      fetchAudioTimestamps(blockUuid);
    }
  }, [blockUuid]);

  const fetchAudioTimestamps = async (blockUuid: string) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/blocks/${blockUuid}/audio_timestamps`);
      setAudioTimestamps(response.data);
      
      // If timestamps exist, set up the first one as current recording
      if (response.data.length > 0) {
        setCurrentRecording(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching audio timestamps:', error);
    }
  };

  useEffect(() => {
    if (currentRecording && audioRef.current) {
      // Set the audio source
      audioRef.current.src = `http://localhost:5000/api/audio/files/${currentRecording.recording.file_name}`;
      
      // Set initial position to the timestamp
      audioRef.current.currentTime = currentRecording.timestamp_in_audio_ms / 1000;
      
      // Load the audio
      audioRef.current.load();
    }
  }, [currentRecording]);

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current && waveformRef.current) {
      const rect = waveformRef.current.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const newTime = (offsetX / rect.width) * duration;
      
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Generate a simple waveform visualization
  const generateWaveform = () => {
    const segments = 50;
    const bars = [];
    
    for (let i = 0; i < segments; i++) {
      // Generate random heights for the waveform bars
      // In a real app, this would use actual audio data
      const height = 20 + Math.random() * 30;
      const isActive = (i / segments) * duration <= currentTime;
      
      bars.push(
        <div 
          key={i} 
          className={`waveform-bar ${isActive ? 'active' : ''}`}
          style={{ height: `${height}%` }}
        />
      );
    }
    
    return bars;
  };

  if (!currentRecording) {
    return <div className="audio-player empty">No audio recording available</div>;
  }

  return (
    <div className="audio-player">
      <audio 
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />
      
      <div className="player-controls">
        <button 
          className={`play-pause-button ${isPlaying ? 'pause' : 'play'}`}
          onClick={handlePlayPause}
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>
        
        <div className="time-display">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>
      
      <div 
        className="waveform-container" 
        ref={waveformRef}
        onClick={handleSeek}
      >
        <div className="waveform">
          {generateWaveform()}
        </div>
      </div>
      
      <div className="recording-info">
        Recording: {currentRecording.recording.file_name.split('_')[1]}
      </div>
    </div>
  );
};

export default AudioPlayer;
