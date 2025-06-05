# Roam Research Clone with Audio Recording - README

## Overview

This is a full-stack application that replicates the core functionality of Roam Research with added audio recording capabilities. The application features a block-based note-taking system with bidirectional linking, along with integrated audio recording that can capture both microphone and system audio.

## Features

- **Knowledge Graph & Note-Taking System**
  - Bidirectional linking between pages using `[[Page Name]]` syntax
  - Block references using `((block-id))` syntax
  - Hierarchical bullet structure with indentation/outdentation
  - Daily notes functionality

- **Markdown Editor**
  - Real-time markdown rendering
  - Block-level editing
  - Keyboard shortcuts for navigation and formatting

- **Audio Recording System**
  - Dual-source audio capture (microphone + system audio)
  - Audio-block integration with timestamps
  - Waveform visualization for playback

## Tech Stack

- **Frontend**: React with TypeScript
- **Backend**: Flask with RESTful API
- **Database**: PostgreSQL with SQLAlchemy ORM

## Directory Structure

```
roam-clone/
├── frontend/
│   └── roam-frontend/
│       ├── public/
│       │   ├── index.html
│       │   └── manifest.json
│       └── src/
│           ├── components/
│           │   ├── audio/
│           │   │   ├── AudioPlayer.tsx
│           │   │   └── AudioRecorder.tsx
│           │   └── layout/
│           │       ├── MainEditor.tsx
│           │       ├── RightPanel.tsx
│           │       └── Sidebar.tsx
│           ├── App.css
│           ├── App.tsx
│           ├── index.css
│           └── index.tsx
└── backend/
    └── roam-backend/
        ├── src/
        │   ├── models/
        │   │   └── models.py
        │   ├── routes/
        │   │   ├── audio_routes.py
        │   │   ├── block_reference_routes.py
        │   │   ├── block_routes.py
        │   │   ├── link_routes.py
        │   │   └── page_routes.py
        │   ├── static/
        │   │   └── audio/
        │   └── main.py
        ├── .env
        └── requirements.txt
```

## Setup Instructions

### Prerequisites
1. Python 3.8+ and pip
2. Node.js 14+ and npm
3. PostgreSQL 12+

### Backend Setup

1. **Install PostgreSQL**:
   ```bash
   # For Ubuntu/Debian
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   
   # For macOS with Homebrew
   brew install postgresql
   brew services start postgresql
   
   # For Windows
   # Download and install from https://www.postgresql.org/download/windows/
   ```

2. **Create PostgreSQL Database**:
   ```bash
   sudo -u postgres psql
   CREATE DATABASE roamclone;
   ALTER USER postgres WITH PASSWORD 'postgres';
   \q
   ```

3. **Set Up Backend Environment**:
   ```bash
   cd roam-clone/backend/roam-backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

4. **Run Backend Server**:
   ```bash
   python -m flask --app src/main.py run --host=0.0.0.0 --port=5000
   ```

### Frontend Setup

1. **Install Dependencies**:
   ```bash
   cd roam-clone/frontend/roam-frontend
   npm install
   ```

2. **Run Frontend Development Server**:
   ```bash
   npm start
   ```

3. **Access the Application**:
   Open your browser and navigate to `http://localhost:3000`

## Usage Guide

### Creating and Editing Pages
- Use the sidebar to create new pages or navigate to existing ones
- Click on "Daily Notes" to create a page for today
- Type in the main editor to add content

### Block Operations
- Press Enter to create a new block
- Press Tab to indent a block (make it a child of the previous block)
- Press Shift+Tab to outdent a block
- Use `[[Page Name]]` syntax to create links to other pages
- Use `((block-id))` syntax to reference other blocks

### Audio Recording
- Use the recording controls in the sidebar
- Select your microphone and quality settings
- Start/stop/pause recording as needed
- Timestamps are automatically created when adding blocks during recording

### Audio Playback
- Use the player at the bottom of the screen
- Click on timestamps in blocks to jump to specific points in recordings

## API Endpoints

### Pages
- `GET /api/pages` - Get all pages
- `GET /api/pages/<id>` - Get a specific page
- `POST /api/pages` - Create a new page
- `PUT /api/pages/<id>` - Update a page
- `DELETE /api/pages/<id>` - Delete a page
- `GET /api/pages/<id>/blocks` - Get all blocks for a page
- `GET /api/pages/<id>/linked_references` - Get all linked references to a page
- `GET /api/pages/<id>/graph` - Get graph data for a page

### Blocks
- `GET /api/blocks` - Get all blocks
- `GET /api/blocks/<uuid>` - Get a specific block
- `POST /api/blocks` - Create a new block
- `PUT /api/blocks/<uuid>` - Update a block
- `DELETE /api/blocks/<uuid>` - Delete a block
- `PUT /api/blocks/<uuid>/indent` - Indent a block
- `PUT /api/blocks/<uuid>/outdent` - Outdent a block
- `GET /api/blocks/<uuid>/audio_timestamps` - Get audio timestamps for a block

### Audio
- `GET /api/audio/recordings` - Get all recordings
- `GET /api/audio/recordings/<id>` - Get a specific recording
- `POST /api/audio/recordings` - Create a new recording
- `PUT /api/audio/recordings/<id>` - Update a recording
- `DELETE /api/audio/recordings/<id>` - Delete a recording
- `GET /api/audio/files/<filename>` - Get an audio file
- `GET /api/audio/timestamps` - Get all timestamps
- `POST /api/audio/timestamps` - Create a new timestamp

## Troubleshooting

1. **Database Connection Issues**:
   - Verify PostgreSQL is running: `sudo service postgresql status`
   - Check database credentials in `.env` file
   - Ensure the database exists: `sudo -u postgres psql -l`

2. **Backend Server Issues**:
   - Check for port conflicts: `lsof -i :5000`
   - Verify all dependencies are installed
   - Check logs for specific errors

3. **Frontend Issues**:
   - Clear browser cache
   - Check browser console for errors
   - Verify API endpoint URLs match backend server

## License

This project is licensed under the MIT License.
