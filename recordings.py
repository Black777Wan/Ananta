from flask import Blueprint, jsonify, request, send_file
from datetime import datetime
import os
import uuid
from src.models import db
from src.models.recording import Recording
from src.models.timestamp import BlockTimestamp

recordings_bp = Blueprint('recordings', __name__, url_prefix='/api/recordings')

@recordings_bp.route('', methods=['POST'])
def create_recording():
    """Save a new audio recording"""
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400
    
    audio_file = request.files['audio']
    recording_id = request.form.get('recordingId', str(uuid.uuid4()))
    note_id = request.form.get('noteId')
    start_time = request.form.get('startTime')
    end_time = request.form.get('endTime')
    source_type = request.form.get('source', 'microphone')
    
    # Create directory if it doesn't exist
    recordings_dir = os.path.join(os.getcwd(), 'src', 'static', 'recordings')
    os.makedirs(recordings_dir, exist_ok=True)
    
    # Save file
    filename = f"{recording_id}.webm"
    file_path = os.path.join(recordings_dir, filename)
    audio_file.save(file_path)
    
    # Calculate duration
    try:
        start = int(start_time) if start_time else None
        end = int(end_time) if end_time else None
        duration = (end - start) if (start and end) else None
    except (ValueError, TypeError):
        duration = None
    
    # Create recording record
    recording = Recording(
        id=recording_id,
        note_id=note_id,
        start_time=datetime.fromtimestamp(int(start_time)/1000) if start_time else datetime.now(),
        end_time=datetime.fromtimestamp(int(end_time)/1000) if end_time else None,
        duration=duration,
        file_path=f"/static/recordings/{filename}",
        file_format="webm",
        source_type=source_type
    )
    
    db.session.add(recording)
    db.session.commit()
    
    return jsonify({
        'id': recording.id,
        'url': recording.file_path,
        'duration': recording.duration
    }), 201

@recordings_bp.route('/<recording_id>', methods=['GET'])
def get_recording(recording_id):
    """Get recording details"""
    recording = Recording.query.get_or_404(recording_id)
    
    return jsonify({
        'id': recording.id,
        'url': recording.file_path,
        'duration': recording.duration,
        'start_time': recording.start_time.isoformat() if recording.start_time else None,
        'end_time': recording.end_time.isoformat() if recording.end_time else None,
        'note_id': recording.note_id,
        'source_type': recording.source_type
    })

@recordings_bp.route('/<recording_id>/blocks', methods=['GET'])
def get_recording_blocks(recording_id):
    """Get blocks associated with a recording"""
    timestamps = BlockTimestamp.query.filter_by(recording_id=recording_id).all()
    
    blocks = [{
        'blockId': timestamp.block_id,
        'timestamp': timestamp.timestamp,
        'content': timestamp.content,
        'created_at': timestamp.created_at.isoformat()
    } for timestamp in timestamps]
    
    return jsonify(blocks)

@recordings_bp.route('/note/<note_id>', methods=['GET'])
def get_note_recordings(note_id):
    """Get all recordings for a note"""
    recordings = Recording.query.filter_by(note_id=note_id).all()
    
    result = [{
        'id': recording.id,
        'url': recording.file_path,
        'duration': recording.duration,
        'start_time': recording.start_time.isoformat() if recording.start_time else None,
        'source_type': recording.source_type
    } for recording in recordings]
    
    return jsonify(result)
