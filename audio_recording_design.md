# Audio Recording and Playback Integration Design

## Technical Constraints Analysis

### Browser-Based Audio Capture
1. **Microphone Recording**: 
   - Fully supported via MediaStream Recording API
   - Requires user permission but works reliably across modern browsers
   - Can be implemented with `navigator.mediaDevices.getUserMedia({audio: true})`

2. **System Audio Capture**:
   - Limited browser support for capturing desktop audio
   - Possible via Screen Capture API with `getDisplayMedia()` and audio sharing option
   - Requires explicit user interaction for each recording session
   - Inconsistent implementation across browsers and platforms
   - Not as seamless as OBS's system audio capture

3. **Multi-Source Recording**:
   - Combining multiple audio inputs (mic + system) requires Web Audio API
   - Can use AudioContext to mix streams but depends on browser support
   - Example approach: connect multiple MediaStreamAudioSourceNodes to a single destination

### Hybrid Approach Considerations
1. **Browser Extension**:
   - Could provide deeper system integration for audio capture
   - More permissions than standard web apps
   - Still limited by browser security model

2. **Desktop Companion App**:
   - Could provide true OBS-like functionality for system audio capture
   - Would require installation and integration with web app
   - Communication via WebSockets or similar technology
   - Adds complexity but provides best audio capture capabilities

## Proposed Architecture

### Backend Storage Design
1. **Audio File Storage**:
   - Store audio recordings as separate files (WebM or MP3 format)
   - Use unique identifiers for each recording session
   - Implement chunked storage for long recordings to support streaming playback

2. **Metadata Storage**:
   - Store recording metadata in database:
     - Recording ID
     - Start/end timestamps
     - Associated note/page ID
     - File format and size
     - Recording source (mic, system, mixed)

3. **Block-Audio Timestamp Association**:
   - Create a separate table/collection for timestamp mappings:
     - Block ID
     - Recording ID
     - Timestamp within recording (in milliseconds)
     - Block content snapshot at time of recording

### Frontend Integration
1. **Recording Controls**:
   - Add recording button to main interface
   - Provide source selection (mic, system audio if available, or both)
   - Show recording status and duration
   - Allow pause/resume functionality

2. **Block-Level Integration**:
   - Add small play button next to each block when associated with recording
   - Store creation timestamp for each block during recording sessions
   - Implement playback from specific timestamp when play button is clicked

3. **Playback Interface**:
   - Mini audio player that appears when playback starts
   - Controls for play/pause, seek, and volume
   - Visual indicator showing current playback position
   - Option to download recording

## Implementation Approach

### Phase 1: Basic Microphone Recording
1. Implement microphone recording using MediaStream Recording API
2. Add recording controls to UI
3. Store audio files and basic metadata
4. Implement block timestamp tracking during recording
5. Add play buttons to blocks with timestamp associations

### Phase 2: Enhanced Audio Capture
1. Implement Screen Capture API with audio sharing for supported browsers
2. Add source selection UI (mic, screen+audio, or both)
3. Implement audio mixing for multiple sources
4. Improve timestamp accuracy and synchronization

### Phase 3: Advanced Features (Optional)
1. Develop desktop companion app for true system audio capture
2. Implement WebSocket communication between web app and desktop app
3. Add audio processing features (noise reduction, normalization)
4. Implement audio transcription integration

## Technical Implementation Details

### Audio Recording
```javascript
// Basic microphone recording setup
async function setupMicrophoneRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mediaRecorder = new MediaRecorder(stream);
  const audioChunks = [];
  
  mediaRecorder.ondataavailable = (event) => {
    audioChunks.push(event.data);
  };
  
  mediaRecorder.onstop = () => {
    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
    saveRecording(audioBlob);
  };
  
  return mediaRecorder;
}

// Screen capture with audio (where supported)
async function setupScreenAudioRecording() {
  const stream = await navigator.mediaDevices.getDisplayMedia({ 
    video: true,
    audio: true 
  });
  
  // Extract audio track only
  const audioTracks = stream.getAudioTracks();
  if (audioTracks.length === 0) {
    throw new Error("No audio track available from screen capture");
  }
  
  const audioStream = new MediaStream([audioTracks[0]]);
  const mediaRecorder = new MediaRecorder(audioStream);
  // ... similar handling as microphone recording
  
  return mediaRecorder;
}

// Combining multiple audio sources
async function setupCombinedRecording() {
  const audioContext = new AudioContext();
  const destination = audioContext.createMediaStreamDestination();
  
  // Add microphone source
  const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const micSource = audioContext.createMediaStreamSource(micStream);
  micSource.connect(destination);
  
  // Add screen audio source if available
  try {
    const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
      video: true, 
      audio: true 
    });
    
    if (screenStream.getAudioTracks().length > 0) {
      const screenSource = audioContext.createMediaStreamSource(
        new MediaStream([screenStream.getAudioTracks()[0]])
      );
      screenSource.connect(destination);
    }
  } catch (err) {
    console.warn("Screen audio capture not available:", err);
  }
  
  // Create recorder from combined stream
  const mediaRecorder = new MediaRecorder(destination.stream);
  // ... handle recording as before
  
  return mediaRecorder;
}
```

### Timestamp Tracking
```javascript
// Track block creation during recording
function trackBlockTimestamps(recordingId) {
  // Listen for block creation events
  document.addEventListener('block-created', (event) => {
    if (!isRecording) return;
    
    const { blockId, content } = event.detail;
    const timestamp = Date.now() - recordingStartTime;
    
    // Store association
    storeBlockTimestamp(recordingId, blockId, timestamp, content);
  });
}

// Store timestamp association
async function storeBlockTimestamp(recordingId, blockId, timestamp, content) {
  try {
    await fetch('/api/timestamps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recordingId,
        blockId,
        timestamp,
        content
      })
    });
  } catch (err) {
    console.error("Failed to store timestamp:", err);
  }
}
```

### Block Playback Integration
```javascript
// Add play buttons to blocks with recordings
function addPlayButtonsToBlocks() {
  // Fetch all blocks with associated recordings
  fetch('/api/blocks/with-recordings')
    .then(response => response.json())
    .then(blocks => {
      blocks.forEach(block => {
        const blockElement = document.querySelector(`[data-block-id="${block.blockId}"]`);
        if (blockElement) {
          addPlayButton(blockElement, block.recordingId, block.timestamp);
        }
      });
    });
}

// Add play button to a specific block
function addPlayButton(blockElement, recordingId, timestamp) {
  const playButton = document.createElement('button');
  playButton.className = 'block-play-button';
  playButton.innerHTML = '<i class="fas fa-play"></i>';
  playButton.addEventListener('click', () => {
    playRecordingFromTimestamp(recordingId, timestamp);
  });
  
  // Insert before the block content
  const bulletElement = blockElement.querySelector('.block-bullet');
  bulletElement.parentNode.insertBefore(playButton, bulletElement.nextSibling);
}

// Play recording from specific timestamp
function playRecordingFromTimestamp(recordingId, timestamp) {
  // Fetch recording URL
  fetch(`/api/recordings/${recordingId}`)
    .then(response => response.json())
    .then(recording => {
      const audioPlayer = document.getElementById('audio-player') || createAudioPlayer();
      audioPlayer.src = recording.url;
      audioPlayer.currentTime = timestamp / 1000; // Convert ms to seconds
      audioPlayer.play();
      
      // Show the player UI
      showAudioPlayerUI();
    });
}

// Create audio player element if it doesn't exist
function createAudioPlayer() {
  const audioPlayer = document.createElement('audio');
  audioPlayer.id = 'audio-player';
  audioPlayer.controls = false; // We'll create custom controls
  document.body.appendChild(audioPlayer);
  return audioPlayer;
}
```

## Database Schema

### Recordings Table
```sql
CREATE TABLE recordings (
  id VARCHAR(36) PRIMARY KEY,
  note_id VARCHAR(36) NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  duration INTEGER,
  file_path VARCHAR(255) NOT NULL,
  file_format VARCHAR(10) NOT NULL,
  file_size INTEGER,
  source_type VARCHAR(20) NOT NULL,
  FOREIGN KEY (note_id) REFERENCES notes(id)
);
```

### Block Timestamps Table
```sql
CREATE TABLE block_timestamps (
  id VARCHAR(36) PRIMARY KEY,
  recording_id VARCHAR(36) NOT NULL,
  block_id VARCHAR(36) NOT NULL,
  timestamp INTEGER NOT NULL, -- milliseconds from recording start
  content TEXT,
  created_at TIMESTAMP NOT NULL,
  FOREIGN KEY (recording_id) REFERENCES recordings(id),
  FOREIGN KEY (block_id) REFERENCES blocks(id)
);
```

## Next Steps

1. Implement basic microphone recording functionality
2. Create UI for recording controls and status
3. Develop timestamp tracking system for blocks
4. Implement block-level playback buttons
5. Test and refine the core functionality
6. Explore advanced options for system audio capture
