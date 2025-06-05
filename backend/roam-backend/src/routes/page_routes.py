from flask import Blueprint, request, jsonify
from src.models.models import Page, Block, Link
from src.extensions import db
import uuid
import re

page_bp = Blueprint('page_bp', __name__)

@page_bp.route('/', methods=['GET'])
def get_pages():
    search_query = request.args.get('search', '')
    
    if search_query:
        pages = Page.query.filter(Page.title.ilike(f'%{search_query}%')).order_by(Page.updated_at.desc()).all()
    else:
        pages = Page.query.order_by(Page.updated_at.desc()).all()
    
    return jsonify([{
        'id': page.id,
        'title': page.title,
        'created_at': page.created_at,
        'updated_at': page.updated_at
    } for page in pages])

@page_bp.route('/<int:page_id>', methods=['GET'])
def get_page(page_id):
    page = Page.query.get_or_404(page_id)
    
    return jsonify({
        'id': page.id,
        'title': page.title,
        'created_at': page.created_at,
        'updated_at': page.updated_at
    })

@page_bp.route('/', methods=['POST'])
def create_page():
    data = request.get_json()
    
    if not data or 'title' not in data:
        return jsonify({'error': 'Title is required'}), 400
    
    # Check if page with this title already exists
    existing_page = Page.query.filter_by(title=data['title']).first()
    if existing_page:
        return jsonify({'error': 'Page with this title already exists'}), 409
    
    new_page = Page(title=data['title'])
    db.session.add(new_page)
    db.session.commit()
    
    return jsonify({
        'id': new_page.id,
        'title': new_page.title,
        'created_at': new_page.created_at,
        'updated_at': new_page.updated_at
    }), 201

@page_bp.route('/<int:page_id>', methods=['PUT'])
def update_page(page_id):
    page = Page.query.get_or_404(page_id)
    data = request.get_json()
    
    if not data or 'title' not in data:
        return jsonify({'error': 'Title is required'}), 400
    
    # Check if another page with this title already exists
    existing_page = Page.query.filter_by(title=data['title']).first()
    if existing_page and existing_page.id != page_id:
        return jsonify({'error': 'Another page with this title already exists'}), 409
    
    page.title = data['title']
    db.session.commit()
    
    return jsonify({
        'id': page.id,
        'title': page.title,
        'created_at': page.created_at,
        'updated_at': page.updated_at
    })

@page_bp.route('/<int:page_id>', methods=['DELETE'])
def delete_page(page_id):
    page = Page.query.get_or_404(page_id)
    
    db.session.delete(page)
    db.session.commit()
    
    return '', 204

@page_bp.route('/<int:page_id>/blocks', methods=['GET'])
def get_page_blocks(page_id):
    Page.query.get_or_404(page_id)  # Ensure page exists
    
    blocks = Block.query.filter_by(page_id=page_id).order_by(Block.order).all()
    
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

@page_bp.route('/<int:page_id>/linked_references', methods=['GET'])
def get_linked_references(page_id):
    page = Page.query.get_or_404(page_id)
    
    # Get all links where this page is the target
    links = Link.query.filter_by(target_page_id=page_id).all()
    
    result = []
    for link in links:
        source_page = link.source_page
        
        # Find blocks in the source page that contain references to this page
        blocks_with_references = Block.query.filter_by(page_id=source_page.id).filter(
            Block.content.like(f'%[[{page.title}]]%')
        ).all()
        
        if blocks_with_references:
            result.append({
                'id': link.id,
                'source_page_id': source_page.id,
                'target_page_id': page_id,
                'source_page': {
                    'id': source_page.id,
                    'title': source_page.title
                },
                'blocks': [{
                    'id': block.id,
                    'block_uuid': block.block_uuid,
                    'content': block.content
                } for block in blocks_with_references]
            })
    
    return jsonify(result)

@page_bp.route('/<int:page_id>/graph', methods=['GET'])
def get_page_graph(page_id):
    page = Page.query.get_or_404(page_id)
    
    # Get all links where this page is either source or target
    outgoing_links = Link.query.filter_by(source_page_id=page_id).all()
    incoming_links = Link.query.filter_by(target_page_id=page_id).all()
    
    nodes = []
    links = []
    
    # Add current page as central node
    nodes.append({
        'id': page.id,
        'title': page.title,
        'type': 'current'
    })
    
    # Add nodes and links for outgoing connections
    for link in outgoing_links:
        target_page = link.target_page
        nodes.append({
            'id': target_page.id,
            'title': target_page.title,
            'type': 'outgoing'
        })
        links.append({
            'source': page.id,
            'target': target_page.id,
            'type': 'outgoing'
        })
    
    # Add nodes and links for incoming connections
    for link in incoming_links:
        source_page = link.source_page
        # Skip if already added as an outgoing connection
        if source_page.id != page.id and not any(node['id'] == source_page.id for node in nodes):
            nodes.append({
                'id': source_page.id,
                'title': source_page.title,
                'type': 'incoming'
            })
        links.append({
            'source': source_page.id,
            'target': page.id,
            'type': 'incoming'
        })
    
    return jsonify({
        'nodes': nodes,
        'links': links
    })

# Helper function to extract page links from content
def extract_page_links(content, page_id):
    # Find all [[Page Name]] patterns
    link_pattern = r'\[\[(.*?)\]\]'
    matches = re.findall(link_pattern, content)
    
    links = []
    for match in matches:
        # Find or create the target page
        target_page = Page.query.filter_by(title=match).first()
        if not target_page:
            target_page = Page(title=match)
            db.session.add(target_page)
            db.session.flush()  # Get ID without committing
        
        # Create link if it doesn't exist
        existing_link = Link.query.filter_by(
            source_page_id=page_id,
            target_page_id=target_page.id
        ).first()
        
        if not existing_link and target_page.id != page_id:  # Avoid self-links
            new_link = Link(
                source_page_id=page_id,
                target_page_id=target_page.id,
                link_type='explicit'
            )
            links.append(new_link)
    
    return links
