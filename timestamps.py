from flask import Blueprint, jsonify, request
from datetime import datetime
import uuid
from src.models import db
from src.models.timestamp import BlockTimestamp

timestamps_bp = Blueprint('timestamps', __name__, url_prefix='/api/timestamps')

@timestamps_bp.route('', methods=['POST'])
def create_timestamp():
    """Create a new block timestamp association"""
    data = request.json
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    recording_id = data.get('recordingId')
    block_id = data.get('blockId')
    timestamp = data.get('timestamp')
    content = data.get('content')
    
    if not all([recording_id, block_id, timestamp is not None]):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Check if timestamp already exists for this block and recording
    existing = BlockTimestamp.query.filter_by(
        recording_id=recording_id,
        block_id=block_id
    ).first()
    
    if existing:
        # Update existing timestamp
        existing.timestamp = timestamp
        existing.content = content
        db.session.commit()
        
        return jsonify({
            'id': existing.id,
            'recording_id': existing.recording_id,
            'block_id': existing.block_id,
            'timestamp': existing.timestamp,
            'content': existing.content,
            'created_at': existing.created_at.isoformat()
        })
    
    # Create new timestamp
    timestamp_record = BlockTimestamp(
        id=str(uuid.uuid4()),
        recording_id=recording_id,
        block_id=block_id,
        timestamp=timestamp,
        content=content,
        created_at=datetime.now()
    )
    
    db.session.add(timestamp_record)
    db.session.commit()
    
    return jsonify({
        'id': timestamp_record.id,
        'recording_id': timestamp_record.recording_id,
        'block_id': timestamp_record.block_id,
        'timestamp': timestamp_record.timestamp,
        'content': timestamp_record.content,
        'created_at': timestamp_record.created_at.isoformat()
    }), 201

@timestamps_bp.route('/block/<block_id>', methods=['GET'])
def get_block_timestamps(block_id):
    """Get all timestamps for a block"""
    timestamps = BlockTimestamp.query.filter_by(block_id=block_id).all()
    
    result = [{
        'id': timestamp.id,
        'recording_id': timestamp.recording_id,
        'timestamp': timestamp.timestamp,
        'content': timestamp.content,
        'created_at': timestamp.created_at.isoformat()
    } for timestamp in timestamps]
    
    return jsonify(result)

@timestamps_bp.route('/recording/<recording_id>', methods=['GET'])
def get_recording_timestamps(recording_id):
    """Get all timestamps for a recording"""
    timestamps = BlockTimestamp.query.filter_by(recording_id=recording_id).all()
    
    result = [{
        'id': timestamp.id,
        'block_id': timestamp.block_id,
        'timestamp': timestamp.timestamp,
        'content': timestamp.content,
        'created_at': timestamp.created_at.isoformat()
    } for timestamp in timestamps]
    
    return jsonify(result)
