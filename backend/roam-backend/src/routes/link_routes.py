from flask import Blueprint, request, jsonify
from src.models.models import Link, Page
from src.extensions import db

link_bp = Blueprint('link_bp', __name__)

@link_bp.route('/', methods=['GET'])
def get_links():
    links = Link.query.all()
    
    return jsonify([{
        'id': link.id,
        'source_page_id': link.source_page_id,
        'target_page_id': link.target_page_id,
        'link_type': link.link_type,
        'created_at': link.created_at
    } for link in links])

@link_bp.route('/<int:link_id>', methods=['GET'])
def get_link(link_id):
    link = Link.query.get_or_404(link_id)
    
    return jsonify({
        'id': link.id,
        'source_page_id': link.source_page_id,
        'target_page_id': link.target_page_id,
        'link_type': link.link_type,
        'created_at': link.created_at
    })

@link_bp.route('/', methods=['POST'])
def create_link():
    data = request.get_json()
    
    if not data or 'source_page_id' not in data or 'target_page_id' not in data:
        return jsonify({'error': 'Source and target page IDs are required'}), 400
    
    # Check if pages exist
    source_page = Page.query.get(data['source_page_id'])
    target_page = Page.query.get(data['target_page_id'])
    
    if not source_page or not target_page:
        return jsonify({'error': 'Source or target page not found'}), 404
    
    # Check if link already exists
    existing_link = Link.query.filter_by(
        source_page_id=data['source_page_id'],
        target_page_id=data['target_page_id']
    ).first()
    
    if existing_link:
        return jsonify({'error': 'Link already exists'}), 409
    
    new_link = Link(
        source_page_id=data['source_page_id'],
        target_page_id=data['target_page_id'],
        link_type=data.get('link_type', 'explicit')
    )
    
    db.session.add(new_link)
    db.session.commit()
    
    return jsonify({
        'id': new_link.id,
        'source_page_id': new_link.source_page_id,
        'target_page_id': new_link.target_page_id,
        'link_type': new_link.link_type,
        'created_at': new_link.created_at
    }), 201

@link_bp.route('/<int:link_id>', methods=['DELETE'])
def delete_link(link_id):
    link = Link.query.get_or_404(link_id)
    
    db.session.delete(link)
    db.session.commit()
    
    return '', 204
