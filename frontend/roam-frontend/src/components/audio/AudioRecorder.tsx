import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

interface AudioRecorderProps {
  pageId?: number;
  blockUuid?: string;
  onRecordingStart?: (recordingId: number) => void;
  onRecordingStop?: () => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ 
  pageId, 
  blockUuid, 
  onRecordingStart, 
  onRecordingStop 
}) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [micLevel, setMicLevel] = useState<number>(0);
  const [systemAudioLevel, setSystemAudioLevel] = useState<number>(0);
  const [availableMics, setAvailableMics] = useState<MediaDeviceInfo[]>([]);
  const [selectedMic, setSelectedMic] = useState<string>('');
  const [audioQuality, setAudioQuality] = useState<string>('medium');
  const [recordingId, setRecordingId] = useState<number | null>(null);
  
  const micStreamRef = useRef<MediaStream | null>(null);
  const systemStreamRef = useRef<MediaStream | null>(null);
  const micRecorderRef = useRef<MediaRecorder | null>(null);
  const systemRecorderRef = useRef<MediaRecorder | null>(null);
  const micChunksRef = useRef<Blob[]>([]);
  const systemChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  // Fetch available audio devices on component mount
  useEffect(() => {
    const getDevices = async () => {
      try {
        // Request permission to use media devices
        await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Get list of audio input devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        
        setAvailableMics(audioInputs);
        if (audioInputs.length > 0) {
          setSelectedMic(audioInputs[0].deviceId);
        }
      } catch (error) {
        console.error('Error accessing media devices:', error);
      }
    };
    
    getDevices();
    
    // Clean up on unmount
    return () => {
      stopRecording();
    };
  }, []);
  
  // Update audio levels during recording
  useEffect(() => {
    if (isRecording && !isPaused && analyserRef.current) {
      const updateLevels = () => {
        if (!analyserRef.current) return;
        
        const micDataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(micDataArray);
        
        // Calculate average level
        const micAvg = micDataArray.reduce((acc, val) => acc + val, 0) / micDataArray.length;
        setMicLevel(micAvg / 255 * 10); // Scale to 0-10
        
        // For system audio, we'd need a separate analyser
        // This is a placeholder that simulates system audio levels
        setSystemAudioLevel(Math.random() * 5);
        
        if (isRecording && !isPaused) {
          requestAnimationFrame(updateLevels);
        }
      };
      
      requestAnimationFrame(updateLevels);
    }
  }, [isRecording, isPaused]);
  
  // Timer for recording duration
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording, isPaused]);
  
  const startRecording = async () => {
    try {
      // Initialize audio context
      audioContextRef.current = new AudioContext();
      
      // Get microphone stream
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: selectedMic ? { exact: selectedMic } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });
      micStreamRef.current = micStream;
      
      // Set up analyzer for mic levels
      const analyser = audioContextRef.current.createAnalyser();
      const micSource = audioContextRef.current.createMediaStreamSource(micStream);
      micSource.connect(analyser);
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      
      // Try to get system audio (this requires user to select a tab/window to share)
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
        
        // Extract audio track from display capture
        const systemAudioTrack = displayStream.getAudioTracks()[0];
        if (systemAudioTrack) {
          const systemStream = new MediaStream([systemAudioTrack]);
          systemStreamRef.current = systemStream;
        }
        
        // Stop video track as we only need audio
        displayStream.getVideoTracks().forEach(track => track.stop());
      } catch (error) {
        console.warn('Could not capture system audio:', error);
        // Continue with just microphone recording
      }
      
      // Set up MediaRecorder for microphone
      const micOptions = { mimeType: 'audio/webm;codecs=opus' };
      const micRecorder = new MediaRecorder(micStream, micOptions);
      micRecorderRef.current = micRecorder;
      
      micRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          micChunksRef.current.push(event.data);
        }
      };
      
      // Set up MediaRecorder for system audio if available
      if (systemStreamRef.current) {
        const systemRecorder = new MediaRecorder(systemStreamRef.current, micOptions);
        systemRecorderRef.current = systemRecorder;
        
        systemRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            systemChunksRef.current.push(event.data);
          }
        };
        
        systemRecorder.start(1000); // Collect data every second
      }
      
      // Start recording
      micRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setIsPaused(false);
      startTimeRef.current = new Date();
      
      // Create recording entry in database
      const formData = new FormData();
      formData.append('file_name', `placeholder_${new Date().toISOString()}.webm`);
      if (pageId) formData.append('page_id', pageId.toString());
      if (blockUuid) formData.append('block_id_context_start', blockUuid);
      formData.append('mic_device_name', availableMics.find(m => m.deviceId === selectedMic)?.label || 'Default Microphone');
      formData.append('system_audio_device_name', systemStreamRef.current ? 'System Audio' : 'None');
      formData.append('audio_quality', audioQuality);
      
      // Create an empty file for now - we'll update it when recording stops
      const emptyBlob = new Blob([], { type: 'audio/webm;codecs=opus' });
      formData.append('file', emptyBlob, `placeholder_${new Date().toISOString()}.webm`);
      
      const response = await axios.post('http://localhost:5000/api/audio/recordings', formData);
      setRecordingId(response.data.id);
      
      if (onRecordingStart) {
        onRecordingStart(response.data.id);
      }
      
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };
  
  const pauseRecording = () => {
    if (micRecorderRef.current && isRecording && !isPaused) {
      micRecorderRef.current.pause();
      if (systemRecorderRef.current) {
        systemRecorderRef.current.pause();
      }
      setIsPaused(true);
    } else if (micRecorderRef.current && isRecording && isPaused) {
      micRecorderRef.current.resume();
      if (systemRecorderRef.current) {
        systemRecorderRef.current.resume();
      }
      setIsPaused(false);
    }
  };
  
  const stopRecording = async () => {
    if (!isRecording) return;
    
    try {
      // Stop recorders
      if (micRecorderRef.current && micRecorderRef.current.state !== 'inactive') {
        micRecorderRef.current.stop();
      }
      
      if (systemRecorderRef.current && systemRecorderRef.current.state !== 'inactive') {
        systemRecorderRef.current.stop();
      }
      
      // Stop all tracks
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (systemStreamRef.current) {
        systemStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Create final audio blob
      const micBlob = new Blob(micChunksRef.current, { type: 'audio/webm;codecs=opus' });
      
      // In a real app, we would mix the mic and system audio here
      // For now, we'll just use the mic audio
      
      // Upload the final audio file
      if (recordingId) {
        const formData = new FormData();
        formData.append('file', micBlob, `recording_${new Date().toISOString()}.webm`);
        
        // Update the recording with the final file
        await axios.put(`http://localhost:5000/api/audio/recordings/${recordingId}`, formData);
        
        // Update recording metadata
        const endTime = new Date();
        const durationMs = startTimeRef.current ? endTime.getTime() - startTimeRef.current.getTime() : 0;
        
        await axios.put(`http://localhost:5000/api/audio/recordings/${recordingId}`, {
          end_timestamp: endTime.toISOString(),
          duration_ms: durationMs
        });
      }
      
      // Reset state
      setIsRecording(false);
      setIsPaused(false);
      setRecordingTime(0);
      micChunksRef.current = [];
      systemChunksRef.current = [];
      startTimeRef.current = null;
      
      if (onRecordingStop) {
        onRecordingStop();
      }
      
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  };
  
  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="audio-recorder">
      <div className="recording-controls">
        <h3>Audio Recording</h3>
        <div className="recording-buttons">
          {!isRecording ? (
            <button 
              onClick={startRecording}
              className="btn-record"
              disabled={isRecording}
            >
              ● Record
            </button>
          ) : (
            <>
              <button 
                onClick={stopRecording}
                className="btn-stop"
              >
                ■ Stop
              </button>
              <button 
                onClick={pauseRecording}
                className="btn-pause"
              >
                {isPaused ? '▶ Resume' : '❚❚ Pause'}
              </button>
            </>
          )}
        </div>
        
        {isRecording && (
          <div className="recording-status">
            <div className="recording-time">Recording: {formatTime(recordingTime)}</div>
            <div className="audio-levels">
              <div className="level-label">Mic:</div>
              <div className="level-meter">
                <div className="level-fill" style={{ width: `${micLevel * 10}%` }}></div>
              </div>
              <div className="level-label">System:</div>
              <div className="level-meter">
                <div className="level-fill" style={{ width: `${systemAudioLevel * 10}%` }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div className="recording-settings">
          <div className="setting-group">
            <label htmlFor="mic-select">Microphone:</label>
            <select 
              id="mic-select" 
              value={selectedMic}
              onChange={(e) => setSelectedMic(e.target.value)}
              disabled={isRecording}
            >
              {availableMics.map(device => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Microphone ${device.deviceId.slice(0, 5)}`}
                </option>
              ))}
            </select>
          </div>
          
          <div className="setting-group">
            <label htmlFor="quality-select">Quality:</label>
            <select 
              id="quality-select" 
              value={audioQuality}
              onChange={(e) => setAudioQuality(e.target.value)}
              disabled={isRecording}
            >
              <option value="low">Low (64kbps)</option>
              <option value="medium">Medium (96kbps)</option>
              <option value="high">High (128kbps)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioRecorder;
