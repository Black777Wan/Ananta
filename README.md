# OBS-like Audio Recorder Web Application

This is a React-based web application that replicates the audio recording functionality of OBS Studio. It allows users to record audio from both microphone and desktop/system sources, with seamless device switching capabilities.

## Features

- Audio input device selection
- Desktop/system audio capture
- Seamless device switching during recording
- Real-time audio visualization
- Recording timer with pause/resume functionality
- Audio playback directly in browser
- One-click download of recordings
- Responsive design for desktop and mobile
- Cross-browser compatibility (Chrome, Firefox, Edge)

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v16 or higher)
- [npm](https://www.npmjs.com/), [yarn](https://yarnpkg.com/), or [pnpm](https://pnpm.io/) (pnpm recommended)

## Installation and Setup

Follow these steps to set up the project on your local machine:

1. **Create a new directory for your project**
   ```bash
   mkdir audio-recorder-app
   cd audio-recorder-app
   ```

2. **Copy all the files from this package into your project directory**

3. **Install dependencies**
   ```bash
   # Using npm
   npm install
   
   # Using yarn
   yarn install
   
   # Using pnpm (recommended)
   pnpm install
   ```

4. **Start the development server**
   ```bash
   # Using npm
   npm run dev
   
   # Using yarn
   yarn dev
   
   # Using pnpm (recommended)
   pnpm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173` (or the URL shown in your terminal)

## Building for Production

To create a production build:

```bash
# Using npm
npm run build

# Using yarn
yarn build

# Using pnpm (recommended)
pnpm run build
```

This will generate a `dist` directory with the production-ready files.

## Deployment

You can deploy the contents of the `dist` directory to any static hosting service like:
- GitHub Pages
- Netlify
- Vercel
- Firebase Hosting
- Amazon S3

## Browser Compatibility

- **Chrome/Edge**: Full support for all features including desktop audio capture
- **Firefox**: Supports microphone recording but has limited support for desktop audio
- **Safari**: Basic recording functionality, but may not support all features

## Usage Instructions

### Recording Audio

1. Grant microphone permissions when prompted
2. Select your preferred audio input device from the dropdown
3. Click the red microphone button to start recording
4. Use pause/resume as needed during recording
5. Click the stop button when finished
6. Play back your recording and download if desired

### Desktop Audio Capture

1. Click the "Desktop Audio Off" button to enable desktop audio recording
2. When prompted by your browser, select the screen/window/tab you want to capture audio from
3. Both your microphone and the selected desktop audio will be recorded simultaneously
4. If you stop sharing your screen, the app will automatically continue recording from just your microphone

### Device Switching

1. Start recording with any audio device
2. If you need to switch devices during recording, simply select a different device from the dropdown
3. The recording will continue seamlessly with the new device

## Project Structure

```
audio-recorder-app/
├── public/                 # Static assets
├── src/
│   ├── assets/             # Images and other assets
│   ├── components/
│   │   ├── AudioDeviceSelector.tsx  # Device selection component
│   │   ├── AudioPlayer.tsx          # Playback component
│   │   ├── AudioRecorder.tsx        # Main recorder component
│   │   ├── AudioVisualizer.tsx      # Visualization component
│   │   ├── RecordingTimer.tsx       # Timer component
│   │   └── ui/                      # UI components
│   ├── hooks/
│   │   └── useAudioRecorder.ts      # Core recording functionality
│   ├── lib/                # Utility functions
│   ├── App.css             # App-specific styles
│   ├── App.tsx             # Main App component
│   ├── index.css           # Global styles
│   └── main.tsx            # Entry point
├── index.html              # HTML entry point
├── package.json            # Project dependencies
├── tailwind.config.js      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite bundler configuration
```

## Troubleshooting

### Microphone Access Issues
- Ensure your browser has permission to access your microphone
- Check browser settings if you accidentally denied permission
- Try using a different browser if issues persist

### Desktop Audio Capture Issues
- Desktop audio capture requires Chrome or Edge browsers
- Make sure to select "Share audio" when prompted during screen selection
- Some systems may require additional audio routing software for certain applications

### Device Switching Issues
- If device switching causes issues, try stopping and restarting the recording
- Ensure the new device is properly connected and recognized by your system

## License

This project is open source and available under the MIT License.
