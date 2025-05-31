import React from 'react';

interface AudioPlayerProps {
  audioUrl: string | null;
  onClear: () => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl, onClear }) => {
  if (!audioUrl) return null;

  return (
    <div className="w-full p-4 bg-slate-800 rounded-md">
      <div className="flex flex-col gap-3">
        <h3 className="text-lg font-medium">Recording Playback</h3>
        
        <audio 
          className="w-full" 
          controls 
          src={audioUrl}
        >
          Your browser does not support the audio element.
        </audio>
        
        <div className="flex justify-between">
          <button
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            onClick={() => {
              const a = document.createElement('a');
              a.href = audioUrl;
              a.download = `recording-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            }}
          >
            Download Recording
          </button>
          
          <button
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md transition-colors"
            onClick={onClear}
          >
            Discard
          </button>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
