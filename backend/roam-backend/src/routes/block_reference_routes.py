from flask import Blueprint, request, jsonify
from src.models.models import BlockReference, Block
from src.extensions import db

block_reference_bp = Blueprint('block_reference_bp', __name__)

@block_reference_bp.route('/', methods=['GET'])
def get_block_references():
    block_references = BlockReference.query.all()
    
    return jsonify([{
        'id': ref.id,
        'source_block_uuid': ref.source_block_uuid,
        'target_block_uuid': ref.target_block_uuid,
        'created_at': ref.created_at
    } for ref in block_references])

@block_reference_bp.route('/<int:reference_id>', methods=['GET'])
def get_block_reference(reference_id):
    reference = BlockReference.query.get_or_404(reference_id)
    
    return jsonify({
        'id': reference.id,
        'source_block_uuid': reference.source_block_uuid,
        'target_block_uuid': reference.target_block_uuid,
        'created_at': reference.created_at
    })

@block_reference_bp.route('/', methods=['POST'])
def create_block_reference():
    data = request.get_json()
    
    if not data or 'source_block_uuid' not in data or 'target_block_uuid' not in data:
        return jsonify({'error': 'Source and target block UUIDs are required'}), 400
    
    # Check if blocks exist
    source_block = Block.query.filter_by(block_uuid=data['source_block_uuid']).first()
    target_block = Block.query.filter_by(block_uuid=data['target_block_uuid']).first()
    
    if not source_block or not target_block:
        return jsonify({'error': 'Source or target block not found'}), 404
    
    # Check if reference already exists
    existing_reference = BlockReference.query.filter_by(
        source_block_uuid=data['source_block_uuid'],
        target_block_uuid=data['target_block_uuid']
    ).first()
    
    if existing_reference:
        return jsonify({'error': 'Block reference already exists'}), 409
    
    new_reference = BlockReference(
        source_block_uuid=data['source_block_uuid'],
        target_block_uuid=data['target_block_uuid']
    )
    
    db.session.add(new_reference)
    db.session.commit()
    
    return jsonify({
        'id': new_reference.id,
        'source_block_uuid': new_reference.source_block_uuid,
        'target_block_uuid': new_reference.target_block_uuid,
        'created_at': new_reference.created_at
    }), 201

@block_reference_bp.route('/<int:reference_id>', methods=['DELETE'])
def delete_block_reference(reference_id):
    reference = BlockReference.query.get_or_404(reference_id)
    
    db.session.delete(reference)
    db.session.commit()
    
    return '', 204
