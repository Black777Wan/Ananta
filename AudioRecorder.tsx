import React, { useState } from 'react';
import useAudioRecorder from '../hooks/useAudioRecorder';
import AudioVisualizer from './AudioVisualizer';
import RecordingTimer from './RecordingTimer';
import AudioDeviceSelector from './AudioDeviceSelector';
import AudioPlayer from './AudioPlayer';
import { Mic, Square, Pause, Play, RefreshCw, Monitor, ToggleLeft, ToggleRight } from 'lucide-react';

const AudioRecorder: React.FC = () => {
  const [permissionDenied, setPermissionDenied] = useState(false);
  
  const {
    isRecording,
    isPaused,
    recordingTime,
    audioDevices,
    selectedDeviceId,
    isCapturingDesktop,
    audioUrl,
    audioLevel,
    error,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    getAudioDevices,
    setAudioDevice,
    toggleDesktopCapture,
    clearRecording,
  } = useAudioRecorder();

  // Handle start recording with permission check
  const handleStartRecording = async () => {
    try {
      // Request permission explicitly
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // If we got here, permission was granted
      setPermissionDenied(false);
      
      // Start recording
      await startRecording();
      
    } catch (err) {
      console.error('Permission denied or error:', err);
      setPermissionDenied(true);
    }
  };

  // Render permission guidance if needed
  const renderPermissionGuidance = () => {
    if (permissionDenied) {
      return (
        <div className="p-4 bg-amber-900/50 border border-amber-700 rounded-md text-amber-200 mb-4">
          <h3 className="font-bold mb-2">Microphone Access Required</h3>
          <p className="mb-2">This application needs access to your microphone to record audio.</p>
          <ol className="list-decimal list-inside space-y-1 mb-2">
            <li>Click the lock/permission icon in your browser's address bar</li>
            <li>Ensure microphone access is set to "Allow"</li>
            <li>Refresh the page and try again</li>
          </ol>
          <p>If you're using this in a restricted environment (like a sandbox), try deploying and accessing it in your own browser.</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-6 bg-slate-900 rounded-lg shadow-xl text-white audio-recorder-container">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold">Audio Recorder</h2>
          <p className="text-slate-400">Record, playback, and download high-quality audio</p>
        </div>

        {renderPermissionGuidance()}

        {error && (
          <div className="p-4 bg-red-900/50 border border-red-700 rounded-md text-red-200">
            <h3 className="font-bold mb-1">Error</h3>
            <p>{error}</p>
            {error.includes('permissions') && (
              <button 
                className="mt-2 px-3 py-1 bg-red-700 hover:bg-red-600 rounded-md text-white text-sm"
                onClick={getAudioDevices}
              >
                Try Again
              </button>
            )}
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <AudioDeviceSelector
              devices={audioDevices}
              selectedDeviceId={selectedDeviceId}
              onDeviceChange={setAudioDevice}
              disabled={isRecording}
            />
            
            <div className="flex items-center gap-2 ml-4">
              <button
                className={`flex items-center gap-1 px-3 py-2 rounded-md transition-colors ${
                  isCapturingDesktop 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-slate-700 hover:bg-slate-600'
                }`}
                onClick={toggleDesktopCapture}
                disabled={!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia}
                title={isCapturingDesktop ? "Desktop Audio Enabled" : "Desktop Audio Disabled"}
              >
                <Monitor size={16} />
                <span className="hidden sm:inline">
                  {isCapturingDesktop ? "Desktop Audio On" : "Desktop Audio Off"}
                </span>
                {isCapturingDesktop ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
              </button>
            </div>
          </div>

          <div className="audio-visualizer-container">
            <AudioVisualizer audioLevel={audioLevel} isRecording={isRecording} />
          </div>
          
          <div className="flex justify-between items-center responsive-controls">
            <RecordingTimer 
              recordingTime={recordingTime} 
              isRecording={isRecording} 
              isPaused={isPaused} 
            />
            
            <div className="flex gap-2">
              {!isRecording ? (
                <button
                  className="p-3 bg-red-600 hover:bg-red-700 rounded-full transition-colors record-button"
                  onClick={handleStartRecording}
                  disabled={audioDevices.length === 0}
                  title="Start Recording"
                >
                  <Mic size={24} />
                </button>
              ) : (
                <>
                  <button
                    className="p-3 bg-red-600 hover:bg-red-700 rounded-full transition-colors record-button"
                    onClick={stopRecording}
                    title="Stop Recording"
                  >
                    <Square size={24} />
                  </button>
                  
                  {isPaused ? (
                    <button
                      className="p-3 bg-green-600 hover:bg-green-700 rounded-full transition-colors record-button"
                      onClick={resumeRecording}
                      title="Resume Recording"
                    >
                      <Play size={24} />
                    </button>
                  ) : (
                    <button
                      className="p-3 bg-amber-600 hover:bg-amber-700 rounded-full transition-colors record-button"
                      onClick={pauseRecording}
                      title="Pause Recording"
                    >
                      <Pause size={24} />
                    </button>
                  )}
                </>
              )}
              
              <button
                className="p-3 bg-slate-700 hover:bg-slate-600 rounded-full transition-colors record-button"
                onClick={getAudioDevices}
                title="Refresh Devices"
              >
                <RefreshCw size={24} />
              </button>
            </div>
          </div>
        </div>

        {audioUrl && (
          <div className="audio-player-container">
            <AudioPlayer audioUrl={audioUrl} onClear={clearRecording} />
          </div>
        )}
        
        <div className="mt-4 p-4 bg-slate-800 rounded-md text-sm text-slate-300">
          <h3 className="font-bold text-white mb-2">About This App</h3>
          <p className="mb-2">This audio recorder replicates the core audio recording functionality of OBS Studio:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Select from available audio input devices</li>
            <li>Record desktop audio (system sounds) along with microphone</li>
            <li>Seamlessly switch between audio devices during recording</li>
            <li>Record high-quality audio with visualization</li>
            <li>Pause and resume recordings</li>
            <li>Play back recordings directly in the browser</li>
            <li>Download recordings in WebM format</li>
          </ul>
          <p className="mt-2 text-slate-400">Note: For best results, use Chrome or Edge on desktop. Desktop audio capture requires Chrome or Edge.</p>
        </div>
      </div>
    </div>
  );
};

export default AudioRecorder;
