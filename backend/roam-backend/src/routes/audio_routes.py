from flask import Blueprint, request, jsonify, send_from_directory
from src.models.models import AudioRecording, AudioTimestamp, Block
from src.main import db
from werkzeug.utils import secure_filename
import os
import uuid
from datetime import datetime

audio_bp = Blueprint('audio_bp', __name__)

# Configure audio storage
AUDIO_UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../static/audio')
os.makedirs(AUDIO_UPLOAD_FOLDER, exist_ok=True)
ALLOWED_EXTENSIONS = {'mp3', 'wav', 'ogg', 'webm'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@audio_bp.route('/recordings', methods=['GET'])
def get_recordings():
    recordings = AudioRecording.query.order_by(AudioRecording.created_at.desc()).all()
    
    return jsonify([{
        'id': recording.id,
        'file_name': recording.file_name,
        'file_path': recording.file_path,
        'mime_type': recording.mime_type,
        'page_id': recording.page_id,
        'block_id_context_start': recording.block_id_context_start,
        'start_timestamp': recording.start_timestamp,
        'end_timestamp': recording.end_timestamp,
        'duration_ms': recording.duration_ms,
        'mic_device_name': recording.mic_device_name,
        'system_audio_device_name': recording.system_audio_device_name,
        'audio_quality': recording.audio_quality,
        'file_size_bytes': recording.file_size_bytes,
        'created_at': recording.created_at
    } for recording in recordings])

@audio_bp.route('/recordings/<int:recording_id>', methods=['GET'])
def get_recording(recording_id):
    recording = AudioRecording.query.get_or_404(recording_id)
    
    return jsonify({
        'id': recording.id,
        'file_name': recording.file_name,
        'file_path': recording.file_path,
        'mime_type': recording.mime_type,
        'page_id': recording.page_id,
        'block_id_context_start': recording.block_id_context_start,
        'start_timestamp': recording.start_timestamp,
        'end_timestamp': recording.end_timestamp,
        'duration_ms': recording.duration_ms,
        'mic_device_name': recording.mic_device_name,
        'system_audio_device_name': recording.system_audio_device_name,
        'audio_quality': recording.audio_quality,
        'file_size_bytes': recording.file_size_bytes,
        'created_at': recording.created_at
    })

@audio_bp.route('/recordings', methods=['POST'])
def create_recording():
    # Check if the post request has the file part
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file and allowed_file(file.filename):
        # Generate a unique filename
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4()}_{filename}"
        file_path = os.path.join(AUDIO_UPLOAD_FOLDER, unique_filename)
        
        # Save the file
        file.save(file_path)
        
        # Create recording entry in database
        new_recording = AudioRecording(
            file_name=unique_filename,
            file_path=file_path,
            mime_type=file.content_type,
            page_id=request.form.get('page_id', type=int),
            block_id_context_start=request.form.get('block_id_context_start'),
            mic_device_name=request.form.get('mic_device_name'),
            system_audio_device_name=request.form.get('system_audio_device_name'),
            audio_quality=request.form.get('audio_quality'),
            file_size_bytes=os.path.getsize(file_path)
        )
        
        db.session.add(new_recording)
        db.session.commit()
        
        return jsonify({
            'id': new_recording.id,
            'file_name': new_recording.file_name,
            'file_path': new_recording.file_path,
            'mime_type': new_recording.mime_type,
            'page_id': new_recording.page_id,
            'block_id_context_start': new_recording.block_id_context_start,
            'start_timestamp': new_recording.start_timestamp,
            'end_timestamp': new_recording.end_timestamp,
            'duration_ms': new_recording.duration_ms,
            'mic_device_name': new_recording.mic_device_name,
            'system_audio_device_name': new_recording.system_audio_device_name,
            'audio_quality': new_recording.audio_quality,
            'file_size_bytes': new_recording.file_size_bytes,
            'created_at': new_recording.created_at
        }), 201
    
    return jsonify({'error': 'File type not allowed'}), 400

@audio_bp.route('/recordings/<int:recording_id>', methods=['PUT'])
def update_recording(recording_id):
    recording = AudioRecording.query.get_or_404(recording_id)
    
    # Check if the request has a file part
    if 'file' in request.files:
        file = request.files['file']
        
        if file.filename != '' and allowed_file(file.filename):
            # Delete old file if it exists
            if os.path.exists(recording.file_path):
                os.remove(recording.file_path)
            
            # Generate a unique filename
            filename = secure_filename(file.filename)
            unique_filename = f"{uuid.uuid4()}_{filename}"
            file_path = os.path.join(AUDIO_UPLOAD_FOLDER, unique_filename)
            
            # Save the file
            file.save(file_path)
            
            recording.file_name = unique_filename
            recording.file_path = file_path
            recording.mime_type = file.content_type
            recording.file_size_bytes = os.path.getsize(file_path)
    
    # Update other fields from form data or JSON
    data = request.form.to_dict() if request.form else request.get_json() or {}
    
    if 'page_id' in data:
        recording.page_id = data['page_id']
    
    if 'block_id_context_start' in data:
        recording.block_id_context_start = data['block_id_context_start']
    
    if 'end_timestamp' in data:
        recording.end_timestamp = datetime.fromisoformat(data['end_timestamp'].replace('Z', '+00:00'))
    
    if 'duration_ms' in data:
        recording.duration_ms = data['duration_ms']
    
    if 'mic_device_name' in data:
        recording.mic_device_name = data['mic_device_name']
    
    if 'system_audio_device_name' in data:
        recording.system_audio_device_name = data['system_audio_device_name']
    
    if 'audio_quality' in data:
        recording.audio_quality = data['audio_quality']
    
    db.session.commit()
    
    return jsonify({
        'id': recording.id,
        'file_name': recording.file_name,
        'file_path': recording.file_path,
        'mime_type': recording.mime_type,
        'page_id': recording.page_id,
        'block_id_context_start': recording.block_id_context_start,
        'start_timestamp': recording.start_timestamp,
        'end_timestamp': recording.end_timestamp,
        'duration_ms': recording.duration_ms,
        'mic_device_name': recording.mic_device_name,
        'system_audio_device_name': recording.system_audio_device_name,
        'audio_quality': recording.audio_quality,
        'file_size_bytes': recording.file_size_bytes,
        'created_at': recording.created_at
    })

@audio_bp.route('/recordings/<int:recording_id>', methods=['DELETE'])
def delete_recording(recording_id):
    recording = AudioRecording.query.get_or_404(recording_id)
    
    # Delete file from filesystem
    if os.path.exists(recording.file_path):
        os.remove(recording.file_path)
    
    db.session.delete(recording)
    db.session.commit()
    
    return '', 204

@audio_bp.route('/files/<filename>', methods=['GET'])
def get_audio_file(filename):
    return send_from_directory(AUDIO_UPLOAD_FOLDER, filename)

@audio_bp.route('/timestamps', methods=['GET'])
def get_timestamps():
    timestamps = AudioTimestamp.query.all()
    
    return jsonify([{
        'id': timestamp.id,
        'recording_id': timestamp.recording_id,
        'block_uuid': timestamp.block_uuid,
        'timestamp_in_audio_ms': timestamp.timestamp_in_audio_ms,
        'block_created_at_realtime': timestamp.block_created_at_realtime
    } for timestamp in timestamps])

@audio_bp.route('/timestamps/<int:timestamp_id>', methods=['GET'])
def get_timestamp(timestamp_id):
    timestamp = AudioTimestamp.query.get_or_404(timestamp_id)
    
    return jsonify({
        'id': timestamp.id,
        'recording_id': timestamp.recording_id,
        'block_uuid': timestamp.block_uuid,
        'timestamp_in_audio_ms': timestamp.timestamp_in_audio_ms,
        'block_created_at_realtime': timestamp.block_created_at_realtime
    })

@audio_bp.route('/timestamps', methods=['POST'])
def create_timestamp():
    data = request.get_json()
    
    if not data or 'recording_id' not in data or 'block_uuid' not in data or 'timestamp_in_audio_ms' not in data:
        return jsonify({'error': 'Recording ID, block UUID, and timestamp are required'}), 400
    
    # Check if recording exists
    recording = AudioRecording.query.get(data['recording_id'])
    if not recording:
        return jsonify({'error': 'Recording not found'}), 404
    
    # Check if block exists
    block = Block.query.filter_by(block_uuid=data['block_uuid']).first()
    if not block:
        return jsonify({'error': 'Block not found'}), 404
    
    # Check if timestamp already exists for this recording and block
    existing_timestamp = AudioTimestamp.query.filter_by(
        recording_id=data['recording_id'],
        block_uuid=data['block_uuid']
    ).first()
    
    if existing_timestamp:
        return jsonify({'error': 'Timestamp already exists for this recording and block'}), 409
    
    new_timestamp = AudioTimestamp(
        recording_id=data['recording_id'],
        block_uuid=data['block_uuid'],
        timestamp_in_audio_ms=data['timestamp_in_audio_ms'],
        block_created_at_realtime=datetime.utcnow()
    )
    
    db.session.add(new_timestamp)
    db.session.commit()
    
    return jsonify({
        'id': new_timestamp.id,
        'recording_id': new_timestamp.recording_id,
        'block_uuid': new_timestamp.block_uuid,
        'timestamp_in_audio_ms': new_timestamp.timestamp_in_audio_ms,
        'block_created_at_realtime': new_timestamp.block_created_at_realtime
    }), 201

@audio_bp.route('/timestamps/<int:timestamp_id>', methods=['PUT'])
def update_timestamp(timestamp_id):
    timestamp = AudioTimestamp.query.get_or_404(timestamp_id)
    data = request.get_json()
    
    if 'timestamp_in_audio_ms' in data:
        timestamp.timestamp_in_audio_ms = data['timestamp_in_audio_ms']
    
    db.session.commit()
    
    return jsonify({
        'id': timestamp.id,
        'recording_id': timestamp.recording_id,
        'block_uuid': timestamp.block_uuid,
        'timestamp_in_audio_ms': timestamp.timestamp_in_audio_ms,
        'block_created_at_realtime': timestamp.block_created_at_realtime
    })

@audio_bp.route('/timestamps/<int:timestamp_id>', methods=['DELETE'])
def delete_timestamp(timestamp_id):
    timestamp = AudioTimestamp.query.get_or_404(timestamp_id)
    
    db.session.delete(timestamp)
    db.session.commit()
    
    return '', 204
