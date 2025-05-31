import { useState, useRef, useCallback, useEffect } from 'react';

interface AudioRecorderState {
  isRecording: boolean;
  isPaused: boolean;
  recordingTime: number;
  audioDevices: MediaDeviceInfo[];
  selectedDeviceId: string;
  isCapturingDesktop: boolean;
  audioBlob: Blob | null;
  audioUrl: string | null;
  audioLevel: number;
  error: string | null;
}

interface UseAudioRecorderReturn extends AudioRecorderState {
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  getAudioDevices: () => Promise<void>;
  setAudioDevice: (deviceId: string) => void;
  toggleDesktopCapture: () => void;
  clearRecording: () => void;
}

const useAudioRecorder = (): UseAudioRecorderReturn => {
  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    isPaused: false,
    recordingTime: 0,
    audioDevices: [],
    selectedDeviceId: 'default',
    isCapturingDesktop: false,
    audioBlob: null,
    audioUrl: null,
    audioLevel: 0,
    error: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const desktopStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  // Clean up resources when component unmounts
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (desktopStreamRef.current) {
        desktopStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (state.audioUrl) {
        URL.revokeObjectURL(state.audioUrl);
      }
    };
  }, [state.audioUrl]);

  // Get available audio devices
  const getAudioDevices = useCallback(async () => {
    try {
      // Check if browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setState(prev => ({
          ...prev,
          error: 'Your browser does not support audio recording. Please use Chrome, Firefox, or Edge.',
        }));
        return;
      }
      
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioDevices = devices.filter(device => device.kind === 'audioinput');
      
      setState(prev => ({
        ...prev,
        audioDevices,
        error: null,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Error accessing audio devices. Please check permissions.',
      }));
      console.error('Error getting audio devices:', error);
    }
  }, []);

  // Set selected audio device
  const setAudioDevice = useCallback((deviceId: string) => {
    setState(prev => ({
      ...prev,
      selectedDeviceId: deviceId,
    }));
    
    // If already recording, switch devices seamlessly
    if (state.isRecording && !state.isPaused) {
      switchAudioDevice(deviceId);
    }
  }, [state.isRecording, state.isPaused]);

  // Switch audio device during recording
  const switchAudioDevice = useCallback(async (deviceId: string) => {
    try {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;
      
      // Get new stream with selected device
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      
      // If we're using an audio context for mixing, replace the source
      if (audioContextRef.current && audioDestinationRef.current) {
        // Stop old tracks
        if (streamRef.current) {
          streamRef.current.getAudioTracks().forEach(track => track.stop());
        }
        
        // Create new source from the new stream
        const newSource = audioContextRef.current.createMediaStreamSource(newStream);
        
        // Connect to the existing destination
        newSource.connect(audioDestinationRef.current);
        
        // Update stream reference
        streamRef.current = newStream;
        
        // Setup analyzer for the new stream
        setupAudioAnalyzer(audioDestinationRef.current.stream);
      } else {
        // If not using audio context (simple recording), need to restart recording
        const currentRecorder = mediaRecorderRef.current;
        const chunks = audioChunksRef.current;
        
        // Stop current recorder but keep chunks
        currentRecorder.stop();
        
        // Stop old tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        
        // Update stream reference
        streamRef.current = newStream;
        
        // Create new recorder
        const options = getSupportedMimeType();
        const newRecorder = new MediaRecorder(newStream, options);
        mediaRecorderRef.current = newRecorder;
        
        // Setup data available handler
        newRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };
        
        // Start new recorder
        newRecorder.start(100);
        
        // Setup analyzer for the new stream
        setupAudioAnalyzer(newStream);
      }
      
      console.log('Audio device switched successfully');
    } catch (error) {
      console.error('Error switching audio device:', error);
      setState(prev => ({
        ...prev,
        error: 'Error switching audio device. Please try again.',
      }));
    }
  }, []);

  // Toggle desktop audio capture
  const toggleDesktopCapture = useCallback(async () => {
    try {
      const isCurrentlyCapturing = state.isCapturingDesktop;
      
      // If we're already recording, we need to update the stream
      if (state.isRecording) {
        if (isCurrentlyCapturing) {
          // Turn off desktop capture
          if (desktopStreamRef.current) {
            desktopStreamRef.current.getTracks().forEach(track => track.stop());
            desktopStreamRef.current = null;
          }
          
          // If we have an audio context, we need to rebuild the stream
          if (audioContextRef.current && audioDestinationRef.current && streamRef.current) {
            // Clear existing connections
            audioContextRef.current.close();
            
            // Create new audio context
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            audioContextRef.current = new AudioContextClass();
            
            // Create new destination
            audioDestinationRef.current = audioContextRef.current.createMediaStreamDestination();
            
            // Connect microphone only
            const micSource = audioContextRef.current.createMediaStreamSource(streamRef.current);
            micSource.connect(audioDestinationRef.current);
            
            // Restart recording with new stream
            restartRecordingWithStream(audioDestinationRef.current.stream);
          }
        } else {
          // Turn on desktop capture
          try {
            // Request screen capture with audio
            const displayStream = await navigator.mediaDevices.getDisplayMedia({ 
              video: true,
              audio: true 
            });
            
            // Store reference to desktop stream
            desktopStreamRef.current = displayStream;
            
            // If we have an audio context, we need to add the desktop audio
            if (audioContextRef.current && audioDestinationRef.current && streamRef.current) {
              // Create source for desktop audio
              const desktopSource = audioContextRef.current.createMediaStreamSource(displayStream);
              
              // Connect to destination
              desktopSource.connect(audioDestinationRef.current);
              
              // Restart recording with combined stream
              restartRecordingWithStream(audioDestinationRef.current.stream);
            } else {
              // Create new audio context for mixing
              const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
              audioContextRef.current = new AudioContextClass();
              
              // Create destination for mixed audio
              audioDestinationRef.current = audioContextRef.current.createMediaStreamDestination();
              
              // Add microphone audio if available
              if (streamRef.current) {
                const micSource = audioContextRef.current.createMediaStreamSource(streamRef.current);
                micSource.connect(audioDestinationRef.current);
              }
              
              // Add desktop audio
              const desktopSource = audioContextRef.current.createMediaStreamSource(displayStream);
              desktopSource.connect(audioDestinationRef.current);
              
              // Restart recording with combined stream
              restartRecordingWithStream(audioDestinationRef.current.stream);
            }
            
            // Handle when user ends screen sharing
            displayStream.getVideoTracks()[0].onended = () => {
              setState(prev => ({
                ...prev,
                isCapturingDesktop: false,
              }));
              
              if (desktopStreamRef.current) {
                desktopStreamRef.current.getTracks().forEach(track => track.stop());
                desktopStreamRef.current = null;
              }
              
              // Rebuild stream without desktop audio if still recording
              if (state.isRecording && streamRef.current) {
                restartRecordingWithStream(streamRef.current);
              }
            };
          } catch (err) {
            console.error('Error getting display media:', err);
            setState(prev => ({
              ...prev,
              error: 'Could not capture desktop audio. User denied permission or browser does not support it.',
            }));
            return;
          }
        }
      }
      
      // Update state
      setState(prev => ({
        ...prev,
        isCapturingDesktop: !isCurrentlyCapturing,
      }));
    } catch (error) {
      console.error('Error toggling desktop capture:', error);
      setState(prev => ({
        ...prev,
        error: 'Error toggling desktop audio capture.',
      }));
    }
  }, [state.isCapturingDesktop, state.isRecording]);

  // Restart recording with a new stream
  const restartRecordingWithStream = useCallback((newStream: MediaStream) => {
    try {
      if (!mediaRecorderRef.current) return;
      
      const currentRecorder = mediaRecorderRef.current;
      const chunks = audioChunksRef.current;
      
      // Stop current recorder but keep chunks
      if (currentRecorder.state !== 'inactive') {
        currentRecorder.stop();
      }
      
      // Create new recorder with the new stream
      const options = getSupportedMimeType();
      const newRecorder = new MediaRecorder(newStream, options);
      mediaRecorderRef.current = newRecorder;
      
      // Setup data available handler
      newRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      // Start new recorder
      newRecorder.start(100);
      
      // Setup analyzer for the new stream
      setupAudioAnalyzer(newStream);
      
      console.log('Recording restarted with new stream');
    } catch (error) {
      console.error('Error restarting recording:', error);
      setState(prev => ({
        ...prev,
        error: 'Error updating audio stream. Please try again.',
      }));
    }
  }, []);

  // Get supported MIME type for recording
  const getSupportedMimeType = useCallback(() => {
    const mimeTypes = [
      'audio/webm',
      'audio/webm;codecs=opus',
      'audio/ogg;codecs=opus',
      'audio/mp4'
    ];
    
    let mimeType = '';
    for (const type of mimeTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        mimeType = type;
        break;
      }
    }
    
    return mimeType ? { mimeType } : undefined;
  }, []);

  // Setup audio analyzer for visualizing audio levels
  const setupAudioAnalyzer = useCallback((stream: MediaStream) => {
    try {
      if (!audioContextRef.current) {
        // Use window.AudioContext for cross-browser compatibility
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) {
          console.error('AudioContext not supported in this browser');
          return;
        }
        audioContextRef.current = new AudioContextClass();
      }
      
      const audioContext = audioContextRef.current;
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      analyserRef.current = analyser;
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
      
      // Start analyzing audio levels
      const updateAudioLevel = () => {
        if (!analyserRef.current || !dataArrayRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
        const values = dataArrayRef.current;
        let sum = 0;
        
        for (let i = 0; i < values.length; i++) {
          sum += values[i];
        }
        
        const average = sum / values.length;
        const level = Math.min(1, average / 128); // Normalize to 0-1
        
        setState(prev => ({
          ...prev,
          audioLevel: level,
        }));
        
        if (state.isRecording && !state.isPaused) {
          requestAnimationFrame(updateAudioLevel);
        }
      };
      
      requestAnimationFrame(updateAudioLevel);
    } catch (error) {
      console.error('Error setting up audio analyzer:', error);
    }
  }, [state.isRecording, state.isPaused]);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      // Reset state
      audioChunksRef.current = [];
      
      // Check for browser support
      if (!window.MediaRecorder) {
        setState(prev => ({
          ...prev,
          error: 'Your browser does not support MediaRecorder. Please use Chrome, Firefox, or Edge.',
        }));
        return;
      }
      
      // Get microphone stream
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: state.selectedDeviceId ? { exact: state.selectedDeviceId } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      
      streamRef.current = micStream;
      
      // Initialize final stream to record from
      let finalStream = micStream;
      
      // If desktop capture is enabled, get desktop stream and mix with mic
      if (state.isCapturingDesktop) {
        try {
          // Request screen capture with audio
          const displayStream = await navigator.mediaDevices.getDisplayMedia({ 
            video: true,
            audio: true 
          });
          
          desktopStreamRef.current = displayStream;
          
          // Create audio context for mixing
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          audioContextRef.current = new AudioContextClass();
          
          // Create destination for mixed audio
          audioDestinationRef.current = audioContextRef.current.createMediaStreamDestination();
          
          // Add microphone audio
          const micSource = audioContextRef.current.createMediaStreamSource(micStream);
          micSource.connect(audioDestinationRef.current);
          
          // Add desktop audio
          const desktopSource = audioContextRef.current.createMediaStreamSource(displayStream);
          desktopSource.connect(audioDestinationRef.current);
          
          // Use the mixed stream
          finalStream = audioDestinationRef.current.stream;
          
          // Handle when user ends screen sharing
          displayStream.getVideoTracks()[0].onended = () => {
            setState(prev => ({
              ...prev,
              isCapturingDesktop: false,
            }));
            
            if (desktopStreamRef.current) {
              desktopStreamRef.current.getTracks().forEach(track => track.stop());
              desktopStreamRef.current = null;
            }
            
            // Rebuild stream without desktop audio if still recording
            if (state.isRecording && streamRef.current) {
              restartRecordingWithStream(streamRef.current);
            }
          };
        } catch (err) {
          console.error('Error getting display media:', err);
          setState(prev => ({
            ...prev,
            error: 'Could not capture desktop audio. User denied permission or browser does not support it.',
            isCapturingDesktop: false,
          }));
          
          // Continue with just microphone
          finalStream = micStream;
        }
      }
      
      // Setup audio analyzer
      setupAudioAnalyzer(finalStream);
      
      // Determine supported MIME types
      const options = getSupportedMimeType();
      
      // Create media recorder
      const mediaRecorder = new MediaRecorder(finalStream, options);
      mediaRecorderRef.current = mediaRecorder;
      
      // Handle data available event
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms
      
      // Start timer
      timerRef.current = window.setInterval(() => {
        setState(prev => ({
          ...prev,
          recordingTime: prev.recordingTime + 1,
        }));
      }, 1000);
      
      setState(prev => ({
        ...prev,
        isRecording: true,
        isPaused: false,
        recordingTime: 0,
        audioBlob: null,
        audioUrl: null,
        error: null,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Error starting recording. Please check permissions.',
      }));
      console.error('Error starting recording:', error);
    }
  }, [state.selectedDeviceId, state.isCapturingDesktop, setupAudioAnalyzer, getSupportedMimeType, restartRecordingWithStream]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (!mediaRecorderRef.current) return;
    
    // Stop media recorder
    if (mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    // Stop all tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (desktopStreamRef.current) {
      desktopStreamRef.current.getTracks().forEach(track => track.stop());
      desktopStreamRef.current = null;
    }
    
    // Clear timer
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Create audio blob and URL
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    const audioUrl = URL.createObjectURL(audioBlob);
    
    setState(prev => ({
      ...prev,
      isRecording: false,
      isPaused: false,
      audioBlob,
      audioUrl,
      audioLevel: 0,
    }));
  }, []);

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') return;
    
    // Check if pause is supported
    if (typeof mediaRecorderRef.current.pause !== 'function') {
      console.warn('MediaRecorder pause not supported in this browser');
      return;
    }
    
    mediaRecorderRef.current.pause();
    
    // Clear timer
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setState(prev => ({
      ...prev,
      isPaused: true,
    }));
  }, []);

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'paused') return;
    
    // Check if resume is supported
    if (typeof mediaRecorderRef.current.resume !== 'function') {
      console.warn('MediaRecorder resume not supported in this browser');
      return;
    }
    
    mediaRecorderRef.current.resume();
    
    // Restart timer
    timerRef.current = window.setInterval(() => {
      setState(prev => ({
        ...prev,
        recordingTime: prev.recordingTime + 1,
      }));
    }, 1000);
    
    setState(prev => ({
      ...prev,
      isPaused: false,
    }));
  }, []);

  // Clear recording
  const clearRecording = useCallback(() => {
    if (state.audioUrl) {
      URL.revokeObjectURL(state.audioUrl);
    }
    
    setState(prev => ({
      ...prev,
      audioBlob: null,
      audioUrl: null,
      recordingTime: 0,
    }));
  }, [state.audioUrl]);

  // Load audio devices on mount
  useEffect(() => {
    getAudioDevices();
    
    // Listen for device changes
    const handleDeviceChange = () => {
      getAudioDevices();
    };
    
    // Check if mediaDevices is supported
    if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
      
      return () => {
        navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      };
    }
  }, [getAudioDevices]);

  return {
    ...state,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    getAudioDevices,
    setAudioDevice,
    toggleDesktopCapture,
    clearRecording,
  };
};

export default useAudioRecorder;
