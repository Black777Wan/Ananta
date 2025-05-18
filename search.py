from flask import Blueprint, jsonify, request
from src.models import db, Note
import re

search_bp = Blueprint('search', __name__, url_prefix='/api/search')

@search_bp.route('/', methods=['GET'])
def search_notes():
    """Search for notes by query"""
    query = request.args.get('q', '')
    if not query or len(query) < 2:
        return jsonify([])
    
    # Search in note titles and block content
    notes = Note.query.filter(Note.title.ilike(f'%{query}%')).all()
    
    # Get notes with blocks containing the query
    block_notes_query = """
    SELECT DISTINCT n.* FROM notes n
    JOIN blocks b ON n.id = b.note_id
    WHERE b.content ILIKE :query
    """
    block_notes = db.session.execute(block_notes_query, {'query': f'%{query}%'}).fetchall()
    
    # Combine results
    result_ids = set(note.id for note in notes)
    for row in block_notes:
        note = Note(id=row[0], title=row[1], is_daily=row[2])
        if note.id not in result_ids:
            notes.append(note)
            result_ids.add(note.id)
    
    return jsonify([{
        'id': note.id,
        'title': note.title,
        'is_daily': note.is_daily
    } for note in notes])

@search_bp.route('/recent', methods=['GET'])
def get_recent_notes():
    """Get recently updated notes"""
    limit = request.args.get('limit', 10, type=int)
    
    notes = Note.query.order_by(Note.updated_at.desc()).limit(limit).all()
    
    return jsonify([{
        'id': note.id,
        'title': note.title,
        'is_daily': note.is_daily,
        'updated_at': note.updated_at.isoformat()
    } for note in notes])
