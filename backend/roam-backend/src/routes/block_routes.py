from flask import Blueprint, request, jsonify
from src.models.models import Block, Page
from src.main import db
import uuid
from src.routes.page_routes import extract_page_links

block_bp = Blueprint('block_bp', __name__)

@block_bp.route('/', methods=['GET'])
def get_blocks():
    blocks = Block.query.order_by(Block.created_at.desc()).all()
    
    return jsonify([{
        'id': block.id,
        'block_uuid': block.block_uuid,
        'content': block.content,
        'page_id': block.page_id,
        'parent_block_uuid': block.parent_block_uuid,
        'order': block.order,
        'created_at': block.created_at,
        'updated_at': block.updated_at
    } for block in blocks])

@block_bp.route('/<string:block_uuid>', methods=['GET'])
def get_block(block_uuid):
    block = Block.query.filter_by(block_uuid=block_uuid).first_or_404()
    
    return jsonify({
        'id': block.id,
        'block_uuid': block.block_uuid,
        'content': block.content,
        'page_id': block.page_id,
        'parent_block_uuid': block.parent_block_uuid,
        'order': block.order,
        'created_at': block.created_at,
        'updated_at': block.updated_at
    })

@block_bp.route('/', methods=['POST'])
def create_block():
    data = request.get_json()
    
    if not data or 'page_id' not in data:
        return jsonify({'error': 'Page ID is required'}), 400
    
    # Check if page exists
    page = Page.query.get(data['page_id'])
    if not page:
        return jsonify({'error': 'Page not found'}), 404
    
    # Generate UUID for the block
    block_uuid = str(uuid.uuid4())
    
    new_block = Block(
        block_uuid=block_uuid,
        content=data.get('content', ''),
        page_id=data['page_id'],
        parent_block_uuid=data.get('parent_block_uuid'),
        order=data.get('order', 0)
    )
    
    db.session.add(new_block)
    
    # Extract and create page links
    if data.get('content'):
        links = extract_page_links(data['content'], data['page_id'])
        for link in links:
            db.session.add(link)
    
    db.session.commit()
    
    return jsonify({
        'id': new_block.id,
        'block_uuid': new_block.block_uuid,
        'content': new_block.content,
        'page_id': new_block.page_id,
        'parent_block_uuid': new_block.parent_block_uuid,
        'order': new_block.order,
        'created_at': new_block.created_at,
        'updated_at': new_block.updated_at
    }), 201

@block_bp.route('/<string:block_uuid>', methods=['PUT'])
def update_block(block_uuid):
    block = Block.query.filter_by(block_uuid=block_uuid).first_or_404()
    data = request.get_json()
    
    if 'content' in data:
        block.content = data['content']
        
        # Extract and create page links
        links = extract_page_links(data['content'], block.page_id)
        for link in links:
            db.session.add(link)
    
    if 'parent_block_uuid' in data:
        block.parent_block_uuid = data['parent_block_uuid']
    
    if 'order' in data:
        block.order = data['order']
    
    db.session.commit()
    
    return jsonify({
        'id': block.id,
        'block_uuid': block.block_uuid,
        'content': block.content,
        'page_id': block.page_id,
        'parent_block_uuid': block.parent_block_uuid,
        'order': block.order,
        'created_at': block.created_at,
        'updated_at': block.updated_at
    })

@block_bp.route('/<string:block_uuid>', methods=['DELETE'])
def delete_block(block_uuid):
    block = Block.query.filter_by(block_uuid=block_uuid).first_or_404()
    
    db.session.delete(block)
    db.session.commit()
    
    return '', 204

@block_bp.route('/<string:block_uuid>/indent', methods=['PUT'])
def indent_block(block_uuid):
    block = Block.query.filter_by(block_uuid=block_uuid).first_or_404()
    
    # Get all blocks at the same level
    sibling_blocks = Block.query.filter_by(
        page_id=block.page_id,
        parent_block_uuid=block.parent_block_uuid
    ).order_by(Block.order).all()
    
    # Find the current block's position among siblings
    current_index = next((i for i, b in enumerate(sibling_blocks) if b.block_uuid == block_uuid), -1)
    
    if current_index <= 0:
        return jsonify({'error': 'Cannot indent the first block or block not found among siblings'}), 400
    
    # Get the previous sibling to become the parent
    new_parent = sibling_blocks[current_index - 1]
    
    # Update the block's parent and reset order
    block.parent_block_uuid = new_parent.block_uuid
    block.order = 0  # First child of the new parent
    
    db.session.commit()
    
    return jsonify({
        'id': block.id,
        'block_uuid': block.block_uuid,
        'content': block.content,
        'page_id': block.page_id,
        'parent_block_uuid': block.parent_block_uuid,
        'order': block.order,
        'created_at': block.created_at,
        'updated_at': block.updated_at
    })

@block_bp.route('/<string:block_uuid>/outdent', methods=['PUT'])
def outdent_block(block_uuid):
    block = Block.query.filter_by(block_uuid=block_uuid).first_or_404()
    
    if not block.parent_block_uuid:
        return jsonify({'error': 'Block is already at the root level'}), 400
    
    # Get the parent block
    parent_block = Block.query.filter_by(block_uuid=block.parent_block_uuid).first()
    
    if not parent_block:
        return jsonify({'error': 'Parent block not found'}), 404
    
    # Update the block's parent to be the parent's parent
    block.parent_block_uuid = parent_block.parent_block_uuid
    
    # Set order to be after the parent
    block.order = parent_block.order + 0.1
    
    db.session.commit()
    
    return jsonify({
        'id': block.id,
        'block_uuid': block.block_uuid,
        'content': block.content,
        'page_id': block.page_id,
        'parent_block_uuid': block.parent_block_uuid,
        'order': block.order,
        'created_at': block.created_at,
        'updated_at': block.updated_at
    })

@block_bp.route('/<string:block_uuid>/audio_timestamps', methods=['GET'])
def get_block_audio_timestamps(block_uuid):
    from src.models.models import AudioTimestamp
    
    block = Block.query.filter_by(block_uuid=block_uuid).first_or_404()
    
    timestamps = AudioTimestamp.query.filter_by(block_uuid=block_uuid).all()
    
    result = []
    for timestamp in timestamps:
        result.append({
            'id': timestamp.id,
            'recording_id': timestamp.recording_id,
            'block_uuid': timestamp.block_uuid,
            'timestamp_in_audio_ms': timestamp.timestamp_in_audio_ms,
            'block_created_at_realtime': timestamp.block_created_at_realtime,
            'recording': {
                'id': timestamp.recording.id,
                'file_name': timestamp.recording.file_name,
                'file_path': timestamp.recording.file_path,
                'mime_type': timestamp.recording.mime_type
            }
        })
    
    return jsonify(result)
