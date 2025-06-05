import React, { useState, useEffect } from 'react';
import './App.css';
import Sidebar from './components/layout/Sidebar';
import MainEditor from './components/layout/MainEditor';
import RightPanel from './components/layout/RightPanel';
import AudioPlayer from './components/audio/AudioPlayer';
import AudioRecorder from './components/audio/AudioRecorder';

function App() {
  const [currentPageId, setCurrentPageId] = useState<number | undefined>(undefined);
  const [currentPageTitle, setCurrentPageTitle] = useState<string | undefined>(undefined);
  const [currentBlockUuid, setCurrentBlockUuid] = useState<string | undefined>(undefined);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [currentRecordingId, setCurrentRecordingId] = useState<number | null>(null);

  // Handle page selection
  const handlePageSelect = (pageId: number, title: string) => {
    setCurrentPageId(pageId);
    setCurrentPageTitle(title);
    setCurrentBlockUuid(undefined); // Reset current block when changing pages
  };

  // Handle block selection
  const handleBlockSelect = (blockUuid: string) => {
    setCurrentBlockUuid(blockUuid);
  };

  // Handle recording start
  const handleRecordingStart = (recordingId: number) => {
    setIsRecording(true);
    setCurrentRecordingId(recordingId);
  };

  // Handle recording stop
  const handleRecordingStop = () => {
    setIsRecording(false);
    setCurrentRecordingId(null);
  };

  return (
    <div className="App">
      <div className="app-container">
        <div className="sidebar-container">
          <Sidebar onPageSelect={handlePageSelect} />
        </div>
        
        <div className="main-container">
          <MainEditor 
            pageId={currentPageId} 
            pageTitle={currentPageTitle}
          />
        </div>
        
        <div className="right-panel-container">
          <RightPanel pageId={currentPageId} />
        </div>
      </div>
      
      <div className="audio-container">
        <AudioPlayer blockUuid={currentBlockUuid} />
        <AudioRecorder 
          pageId={currentPageId}
          blockUuid={currentBlockUuid}
          onRecordingStart={handleRecordingStart}
          onRecordingStop={handleRecordingStop}
        />
      </div>
    </div>
  );
}

export default App;
