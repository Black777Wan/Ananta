from flask import Blueprint, jsonify, request
from src.models import db, Note, Block, Link
import re
import uuid

notes_bp = Blueprint('notes', __name__, url_prefix='/api/notes')

@notes_bp.route('/', methods=['GET'])
def get_all_notes():
    """Get all non-daily notes"""
    notes = Note.query.filter_by(is_daily=False).all()
    return jsonify([note.to_dict() for note in notes])

@notes_bp.route('/<note_id>', methods=['GET'])
def get_note(note_id):
    """Get a specific note by ID"""
    note = Note.query.get(note_id)
    if note is None:
        return jsonify({"error": "Note not found"}), 404
    
    # Get backlinks
    backlinks = []
    links = Link.get_backlinks(note_id)
    for link in links:
        source_block = Block.query.get(link.source_block_id)
        source_note = Note.query.get(source_block.note_id)
        backlinks.append({
            "note_id": source_note.id,
            "note_title": source_note.title,
            "block_id": source_block.id,
            "block_content": source_block.content
        })
    
    result = note.to_dict()
    result["backlinks"] = backlinks
    
    return jsonify(result)

@notes_bp.route('/', methods=['POST'])
def create_note():
    """Create a new note"""
    data = request.json
    
    if not data or 'title' not in data:
        return jsonify({"error": "Title is required"}), 400
    
    # Create a slug from the title
    slug = data['title'].lower().replace(' ', '-')
    # Add a unique identifier to ensure uniqueness
    note_id = f"{slug}-{uuid.uuid4().hex[:8]}"
    
    # Check if note already exists
    existing = Note.query.filter_by(id=note_id).first()
    if existing:
        return jsonify({"error": "Note already exists"}), 409
    
    # Create the note
    note = Note(id=note_id, title=data['title'])
    db.session.add(note)
    
    # Add initial content if provided
    if 'content' in data and data['content']:
        Block.create_for_note(
            note_id=note_id,
            content=data['content'],
            order=0
        )
    
    db.session.commit()
    return jsonify(note.to_dict()), 201

@notes_bp.route('/<note_id>', methods=['PUT'])
def update_note(note_id):
    """Update a note's title"""
    note = Note.query.get(note_id)
    if note is None:
        return jsonify({"error": "Note not found"}), 404
    
    data = request.json
    if 'title' in data:
        note.title = data['title']
        db.session.commit()
    
    return jsonify(note.to_dict())

@notes_bp.route('/<note_id>/blocks', methods=['POST'])
def add_block(note_id):
    """Add a new block to a note"""
    note = Note.query.get(note_id)
    if note is None:
        return jsonify({"error": "Note not found"}), 404
    
    data = request.json
    if not data or 'content' not in data:
        return jsonify({"error": "Content is required"}), 400
    
    # Get the highest order value
    highest_order = db.session.query(db.func.max(Block.order)).filter_by(note_id=note_id).scalar() or -1
    new_order = highest_order + 1
    
    # Create the block
    block = Block.create_for_note(
        note_id=note_id,
        content=data['content'],
        order=new_order,
        parent_id=data.get('parent_id')
    )
    
    # Process links in the content
    process_links(block)
    
    return jsonify(block.to_dict()), 201

@notes_bp.route('/blocks/<block_id>', methods=['PUT'])
def update_block(block_id):
    """Update a block's content"""
    block = Block.query.get(block_id)
    if block is None:
        return jsonify({"error": "Block not found"}), 404
    
    data = request.json
    if 'content' in data:
        block.content = data['content']
        
        # Delete existing links for this block
        Link.query.filter_by(source_block_id=block_id).delete()
        
        # Process new links
        process_links(block)
        
        db.session.commit()
    
    return jsonify(block.to_dict())

@notes_bp.route('/blocks/<block_id>', methods=['DELETE'])
def delete_block(block_id):
    """Delete a block"""
    block = Block.query.get(block_id)
    if block is None:
        return jsonify({"error": "Block not found"}), 404
    
    # Delete the block (cascade will handle links)
    db.session.delete(block)
    db.session.commit()
    
    return jsonify({"success": True})

def process_links(block):
    """Process links in block content and create Link objects"""
    # Find all [[Page Name]] references
    link_pattern = r'\[\[(.*?)\]\]'
    matches = re.findall(link_pattern, block.content)
    
    for match in matches:
        # Create or get the target note
        target_note = Note.get_or_create(
            id=match.lower().replace(' ', '-'),
            title=match
        )
        
        # Create the link
        Link.create_link(block.id, target_note.id)
