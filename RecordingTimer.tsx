import React from 'react';

interface RecordingTimerProps {
  recordingTime: number;
  isRecording: boolean;
  isPaused: boolean;
}

const RecordingTimer: React.FC<RecordingTimerProps> = ({ 
  recordingTime, 
  isRecording,
  isPaused
}) => {
  // Format seconds to MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${isRecording && !isPaused ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`} />
      <span className="font-mono text-xl font-semibold">
        {formatTime(recordingTime)}
      </span>
      {isPaused && (
        <span className="text-amber-500 text-sm font-medium">PAUSED</span>
      )}
    </div>
  );
};

export default RecordingTimer;
