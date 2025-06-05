import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface SidebarProps {
  onPageSelect: (pageId: number, title: string) => void;
}

interface Page {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

const Sidebar: React.FC<SidebarProps> = ({ onPageSelect }) => {
  const [pages, setPages] = useState<Page[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [micLevel, setMicLevel] = useState(0);
  const [systemAudioLevel, setSystemAudioLevel] = useState(0);
  const [availableMics, setAvailableMics] = useState<MediaDeviceInfo[]>([]);
  const [selectedMic, setSelectedMic] = useState<string>('');
  const [audioQuality, setAudioQuality] = useState('medium');

  // Fetch pages on component mount
  useEffect(() => {
    fetchPages();
  }, []);

  // Fetch available audio devices
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
  }, []);

  // Recording timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
        
        // Simulate audio levels (in a real app, these would come from AnalyserNode)
        setMicLevel(Math.random() * 10);
        setSystemAudioLevel(Math.random() * 10);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    
    return () => clearInterval(interval);
  }, [isRecording]);

  const fetchPages = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/pages');
      setPages(response.data);
    } catch (error) {
      console.error('Error fetching pages:', error);
    }
  };

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    try {
      const response = await axios.get(`http://localhost:5000/api/pages?search=${query}`);
      setPages(response.data);
    } catch (error) {
      console.error('Error searching pages:', error);
    }
  };

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // In a real app, this would start/stop the MediaRecorder
  };

  const createDailyNote = async () => {
    const today = new Date();
    const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    try {
      // Check if today's daily note already exists
      const searchResponse = await axios.get(`http://localhost:5000/api/pages?search=${dateString}`);
      const existingPage = searchResponse.data.find((page: Page) => page.title === dateString);
      
      if (existingPage) {
        onPageSelect(existingPage.id, existingPage.title);
        return;
      }
      
      // Create new daily note
      const response = await axios.post('http://localhost:5000/api/pages', {
        title: dateString
      });
      
      onPageSelect(response.data.id, response.data.title);
      fetchPages(); // Refresh the page list
    } catch (error) {
      console.error('Error creating daily note:', error);
    }
  };

  return (
    <div className="sidebar">
      {/* Audio Recording Controls */}
      <div className="recording-controls">
        <h3>Audio Recording</h3>
        <div className="recording-buttons">
          <button 
            onClick={toggleRecording}
            className={isRecording ? 'btn-stop' : 'btn-record'}
          >
            {isRecording ? '■ Stop' : '● Record'}
          </button>
          {isRecording && (
            <button className="btn-pause">❚❚ Pause</button>
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
      
      {/* Search */}
      <div className="search-container">
        <input
          type="text"
          placeholder="Search pages..."
          value={searchQuery}
          onChange={handleSearch}
          className="search-input"
        />
      </div>
      
      {/* Navigation */}
      <div className="navigation">
        <h3>Navigation</h3>
        <ul className="nav-links">
          <li>
            <button onClick={createDailyNote} className="nav-button">
              📅 Daily Notes
            </button>
          </li>
          <li>
            <button className="nav-button">
              📄 All Pages
            </button>
          </li>
          <li>
            <button className="nav-button">
              🔗 Graph View
            </button>
          </li>
        </ul>
      </div>
      
      {/* Recent Pages */}
      <div className="recent-pages">
        <h3>Recent Pages</h3>
        <ul className="page-list">
          {pages.slice(0, 10).map(page => (
            <li key={page.id} className="page-item">
              <button 
                onClick={() => onPageSelect(page.id, page.title)}
                className="page-link"
              >
                {page.title}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
