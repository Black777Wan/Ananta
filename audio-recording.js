// Enhanced Audio Recording Integration with Auto-Detection and Live Mixer

// Global variables for audio recording
let mediaRecorder = null;
let audioChunks = [];
let recordingStartTime = null;
let isRecording = false;
let recordingId = null;
let audioPlayer = null;
let audioContext = null;
let audioSources = [];
let analyzerNodes = [];
let canvasContexts = [];
let animationFrameId = null;

// Initialize audio recording functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeAudioRecording();
});

/**
 * Initialize audio recording functionality
 */
function initializeAudioRecording() {
    // Create and add recording controls to the UI
    createRecordingControls();
    
    // Create audio player element
    createAudioPlayer();
    
    // Set up event listeners for recording controls
    setupRecordingEventListeners();
    
    // Initialize audio context for visualization
    initializeAudioContext();
    
    // Detect available audio sources
    detectAudioSources();
}

/**
 * Create recording controls and add them to the UI
 */
function createRecordingControls() {
    // Create recording controls container
    const recordingControls = document.createElement('div');
    recordingControls.className = 'recording-controls';
    recordingControls.innerHTML = `
        <div class="recording-button-container">
            <button id="record-button" class="record-button" title="Start Recording">
                <i class="fas fa-microphone"></i>
            </button>
            <div class="recording-status">
                <span id="recording-indicator" class="hidden">Recording</span>
                <span id="recording-time">00:00</span>
            </div>
        </div>
        <div id="audio-mixer" class="audio-mixer hidden">
            <div class="mixer-header">Audio Sources</div>
            <div id="audio-sources-container" class="audio-sources-container">
                <!-- Audio sources will be dynamically added here -->
            </div>
        </div>
    `;
    
    // Add to the topbar
    const topbar = document.querySelector('.roam-topbar');
    topbar.appendChild(recordingControls);
}

/**
 * Create audio player element
 */
function createAudioPlayer() {
    // Create audio player container
    const audioPlayerContainer = document.createElement('div');
    audioPlayerContainer.id = 'audio-player-container';
    audioPlayerContainer.className = 'audio-player-container hidden';
    audioPlayerContainer.innerHTML = `
        <audio id="audio-player"></audio>
        <div class="audio-controls">
            <button id="play-pause-button" class="audio-control-button">
                <i class="fas fa-play"></i>
            </button>
            <div class="audio-progress">
                <div class="audio-progress-bar">
                    <div class="audio-progress-filled"></div>
                </div>
                <div class="audio-time">
                    <span id="current-time">00:00</span> / <span id="duration">00:00</span>
                </div>
            </div>
            <button id="close-player-button" class="audio-control-button">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // Add to the body
    document.body.appendChild(audioPlayerContainer);
    
    // Set audio player reference
    audioPlayer = document.getElementById('audio-player');
    
    // Set up audio player event listeners
    setupAudioPlayerEventListeners();
}

/**
 * Initialize Web Audio API context for visualization
 */
function initializeAudioContext() {
    try {
        // Create audio context
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (error) {
        console.error('Web Audio API is not supported in this browser:', error);
    }
}

/**
 * Detect available audio sources
 */
async function detectAudioSources() {
    try {
        // Get all available audio devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        
        // Clear previous sources
        audioSources = [];
        
        // Add microphone sources
        for (const input of audioInputs) {
            audioSources.push({
                id: input.deviceId,
                label: input.label || `Microphone ${audioSources.length + 1}`,
                type: 'microphone',
                stream: null,
                analyzer: null
            });
        }
        
        // Add system audio source if supported
        if (navigator.mediaDevices.getDisplayMedia) {
            audioSources.push({
                id: 'system-audio',
                label: 'System Audio',
                type: 'system',
                stream: null,
                analyzer: null
            });
        }
        
        // Create mixer UI for detected sources
        createAudioMixerUI();
        
    } catch (error) {
        console.error('Error detecting audio sources:', error);
    }
}

/**
 * Create audio mixer UI with visualizers for each source
 */
function createAudioMixerUI() {
    const sourcesContainer = document.getElementById('audio-sources-container');
    sourcesContainer.innerHTML = '';
    
    // Create elements for each audio source
    audioSources.forEach((source, index) => {
        const sourceElement = document.createElement('div');
        sourceElement.className = 'audio-source';
        sourceElement.innerHTML = `
            <div class="source-label">${source.label}</div>
            <canvas id="visualizer-${index}" class="audio-visualizer" width="100" height="30"></canvas>
            <div class="level-indicator">
                <div class="level-bar" id="level-bar-${index}"></div>
            </div>
        `;
        
        sourcesContainer.appendChild(sourceElement);
    });
    
    // Store canvas contexts for visualization
    canvasContexts = audioSources.map((_, index) => {
        const canvas = document.getElementById(`visualizer-${index}`);
        return canvas.getContext('2d');
    });
}

/**
 * Set up event listeners for recording controls
 */
function setupRecordingEventListeners() {
    const recordButton = document.getElementById('record-button');
    const audioMixer = document.getElementById('audio-mixer');
    
    // Record button click
    recordButton.addEventListener('click', function() {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    });
    
    // Show mixer on hover
    recordButton.addEventListener('mouseenter', function() {
        audioMixer.classList.remove('hidden');
        
        // Start visualizing audio levels if not already recording
        if (!isRecording) {
            startAudioVisualization();
        }
    });
    
    // Hide mixer when mouse leaves the area
    const recordingControls = document.querySelector('.recording-controls');
    recordingControls.addEventListener('mouseleave', function() {
        if (!isRecording) {
            audioMixer.classList.add('hidden');
            stopAudioVisualization();
        }
    });
}

/**
 * Set up event listeners for audio player
 */
function setupAudioPlayerEventListeners() {
    const audioPlayer = document.getElementById('audio-player');
    const playPauseButton = document.getElementById('play-pause-button');
    const closePlayerButton = document.getElementById('close-player-button');
    const progressBar = document.querySelector('.audio-progress-bar');
    const progressFilled = document.querySelector('.audio-progress-filled');
    const currentTimeDisplay = document.getElementById('current-time');
    const durationDisplay = document.getElementById('duration');
    
    // Play/pause button
    playPauseButton.addEventListener('click', function() {
        if (audioPlayer.paused) {
            audioPlayer.play();
            playPauseButton.innerHTML = '<i class="fas fa-pause"></i>';
        } else {
            audioPlayer.pause();
            playPauseButton.innerHTML = '<i class="fas fa-play"></i>';
        }
    });
    
    // Close player button
    closePlayerButton.addEventListener('click', function() {
        audioPlayer.pause();
        document.getElementById('audio-player-container').classList.add('hidden');
    });
    
    // Progress bar click
    progressBar.addEventListener('click', function(e) {
        const percent = e.offsetX / progressBar.offsetWidth;
        audioPlayer.currentTime = percent * audioPlayer.duration;
    });
    
    // Update progress bar and time display
    audioPlayer.addEventListener('timeupdate', function() {
        const percent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
        progressFilled.style.width = percent + '%';
        currentTimeDisplay.textContent = formatTime(audioPlayer.currentTime);
    });
    
    // Update duration display when metadata is loaded
    audioPlayer.addEventListener('loadedmetadata', function() {
        durationDisplay.textContent = formatTime(audioPlayer.duration);
    });
    
    // Reset play button when audio ends
    audioPlayer.addEventListener('ended', function() {
        playPauseButton.innerHTML = '<i class="fas fa-play"></i>';
    });
}

/**
 * Start audio visualization for all sources
 */
async function startAudioVisualization() {
    // Stop any existing visualization
    stopAudioVisualization();
    
    // Initialize analyzers for each source
    for (let i = 0; i < audioSources.length; i++) {
        const source = audioSources[i];
        
        try {
            // Get stream based on source type
            if (source.type === 'microphone') {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: { deviceId: source.id !== 'default' ? { exact: source.id } : undefined }
                });
                source.stream = stream;
            } else if (source.type === 'system' && !source.stream) {
                // For system audio, we just show a placeholder visualization
                // Actual capture will happen during recording
            }
            
            // Create analyzer for the stream if we have one
            if (source.stream && audioContext) {
                const sourceNode = audioContext.createMediaStreamSource(source.stream);
                const analyzerNode = audioContext.createAnalyser();
                analyzerNode.fftSize = 256;
                sourceNode.connect(analyzerNode);
                source.analyzer = analyzerNode;
                analyzerNodes[i] = analyzerNode;
            }
        } catch (error) {
            console.warn(`Could not initialize audio source ${source.label}:`, error);
        }
    }
    
    // Start visualization loop
    visualize();
}

/**
 * Stop audio visualization
 */
function stopAudioVisualization() {
    // Cancel animation frame
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    
    // Stop and clean up all streams
    audioSources.forEach(source => {
        if (source.stream && !isRecording) {
            source.stream.getTracks().forEach(track => track.stop());
            source.stream = null;
            source.analyzer = null;
        }
    });
    
    // Clear analyzers
    analyzerNodes = [];
}

/**
 * Visualize audio levels for all sources
 */
function visualize() {
    // Update each visualizer
    audioSources.forEach((source, index) => {
        const ctx = canvasContexts[index];
        const analyzer = analyzerNodes[index];
        const levelBar = document.getElementById(`level-bar-${index}`);
        
        if (ctx && analyzer) {
            // Get frequency data
            const bufferLength = analyzer.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            analyzer.getByteFrequencyData(dataArray);
            
            // Calculate average level
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
            }
            const average = sum / bufferLength;
            const level = average / 255; // Normalize to 0-1
            
            // Update level bar
            if (levelBar) {
                levelBar.style.width = (level * 100) + '%';
                
                // Change color based on level
                if (level > 0.8) {
                    levelBar.style.backgroundColor = '#e74c3c';
                } else if (level > 0.5) {
                    levelBar.style.backgroundColor = '#f39c12';
                } else {
                    levelBar.style.backgroundColor = '#2ecc71';
                }
            }
            
            // Draw visualization
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.fillStyle = '#2ecc71';
            
            const barWidth = (ctx.canvas.width / bufferLength) * 2.5;
            let x = 0;
            
            for (let i = 0; i < bufferLength; i++) {
                const barHeight = (dataArray[i] / 255) * ctx.canvas.height;
                
                // Change color based on frequency intensity
                if (dataArray[i] > 210) {
                    ctx.fillStyle = '#e74c3c';
                } else if (dataArray[i] > 130) {
                    ctx.fillStyle = '#f39c12';
                } else {
                    ctx.fillStyle = '#2ecc71';
                }
                
                ctx.fillRect(x, ctx.canvas.height - barHeight, barWidth, barHeight);
                x += barWidth + 1;
            }
        } else if (ctx) {
            // Draw placeholder for system audio or unavailable sources
            if (source.type === 'system') {
                // Simulate random activity for system audio preview
                const barCount = 20;
                const barWidth = ctx.canvas.width / barCount;
                
                ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                
                for (let i = 0; i < barCount; i++) {
                    const barHeight = Math.random() * ctx.canvas.height * 0.8;
                    ctx.fillStyle = '#aaa';
                    ctx.fillRect(i * barWidth, ctx.canvas.height - barHeight, barWidth - 1, barHeight);
                }
                
                if (levelBar) {
                    // Simulate random level for preview
                    const randomLevel = Math.random() * 0.3; // Keep it low for preview
                    levelBar.style.width = (randomLevel * 100) + '%';
                    levelBar.style.backgroundColor = '#aaa';
                }
            } else {
                // Clear canvas for unavailable sources
                ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                ctx.fillStyle = '#ddd';
                ctx.fillText('Not available', 10, 15);
                
                if (levelBar) {
                    levelBar.style.width = '0%';
                }
            }
        }
    });
    
    // Continue animation loop
    animationFrameId = requestAnimationFrame(visualize);
}

/**
 * Start recording audio from all available sources
 */
async function startRecording() {
    try {
        // Initialize audio context if needed
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        // Create destination for combined audio
        const destination = audioContext.createMediaStreamDestination();
        
        // Start visualization if not already running
        if (!animationFrameId) {
            await startAudioVisualization();
        }
        
        // Connect all available sources to the destination
        let hasAudioSource = false;
        
        // Add microphone sources
        for (const source of audi
(Content truncated due to size limit. Use line ranges to read in chunks)