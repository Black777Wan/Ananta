# Audio Recording and Playback Feature Guide

## Overview

Your Roam Research clone now includes powerful audio recording capabilities similar to OBS, allowing you to:

1. Record audio from your microphone or system audio
2. Associate recordings with specific bullet points
3. Play back audio from the exact timestamp when a bullet was written

This guide explains how to use these new features effectively.

## Recording Audio

### Starting a Recording

1. Look for the recording controls in the top bar of your note-taking app
2. Select your audio source from the dropdown menu:
   - **Microphone**: Records from your default microphone
   - **Screen**: Records system audio (requires browser support)
   - **Combined**: Records both microphone and system audio when available
3. Click the red microphone button to start recording
4. A red indicator will appear showing that recording is in progress

### During Recording

While recording is active:

1. Every new bullet point you create is automatically timestamped
2. Edits to existing bullets also create timestamps
3. A recording timer shows the current duration
4. A red bar at the top of the screen indicates active recording

### Stopping a Recording

1. Click the stop button (square icon) to end the recording
2. The recording is automatically saved and associated with your current note
3. Play buttons will appear next to all bullets created or edited during the recording

## Playing Back Audio

### From Individual Bullets

1. Each bullet point created during a recording session will have a small play button next to it
2. Click this button to start playback from the exact moment that bullet was created
3. The audio player will appear at the bottom right of the screen

### Using the Audio Player

The audio player provides:

1. Play/pause controls
2. A progress bar for navigation
3. Current time and total duration display
4. A close button to dismiss the player

## Technical Considerations

### Browser Support

- **Microphone recording**: Supported in all modern browsers
- **System audio recording**: Limited support, works best in Chrome
- **Combined recording**: Requires browser support for both sources

### Permissions

- Your browser will ask for permission to access your microphone
- For system audio recording, you'll need to select "Share audio" when prompted
- These permissions may need to be granted each session depending on your browser settings

### Storage

- Recordings are stored on the server and associated with your notes
- Each recording is linked to the specific note where it was created
- Timestamps are stored for each bullet point created during recording

## Tips for Effective Use

1. **Test before important recordings**: Always do a quick test to ensure your audio source is working
2. **Use descriptive bullets**: Write clear, concise bullets that will help you navigate the recording later
3. **Create new bullets for key points**: Each new bullet creates a new timestamp marker
4. **Review recordings**: Use the bullet play buttons to quickly jump to relevant parts of longer recordings
5. **System audio limitations**: If system audio recording isn't working, consider using external software to record system audio separately

## Troubleshooting

- **No audio during recording**: Check that your microphone is properly connected and permissions are granted
- **Can't record system audio**: This feature depends on browser support; try using Chrome or Edge
- **Missing play buttons**: Ensure you're viewing the same note where the recording was created
- **Playback issues**: If audio doesn't play, try refreshing the page or checking your audio output settings

## Keyboard Shortcuts

- **Alt+R**: Start/stop recording (when implemented)
- **Alt+P**: Play/pause current recording (when implemented)
- **Esc**: Close audio player (when implemented)

Enjoy your enhanced note-taking experience with seamless audio recording and playback!
