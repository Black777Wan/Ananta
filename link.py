from datetime import datetime
from src.models import db
from sqlalchemy.orm import relationship

class Link(db.Model):
    """
    Link model representing bidirectional links between blocks and notes
    """
    __tablename__ = 'links'
    
    id = db.Column(db.String(255), primary_key=True)  # UUID-based ID
    source_block_id = db.Column(db.String(255), db.ForeignKey('blocks.id'), nullable=False)
    target_note_id = db.Column(db.String(255), db.ForeignKey('notes.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    source_block = relationship("Block", foreign_keys=[source_block_id], back_populates="outgoing_links")
    target_note = relationship("Note")
    
    def __init__(self, id, source_block_id, target_note_id):
        self.id = id
        self.source_block_id = source_block_id
        self.target_note_id = target_note_id
    
    def to_dict(self):
        """Convert link to dictionary for JSON serialization"""
        return {
            'id': self.id,
            'source_block_id': self.source_block_id,
            'target_note_id': self.target_note_id,
            'created_at': self.created_at.isoformat()
        }
    
    @classmethod
    def create_link(cls, source_block_id, target_note_id):
        """Create a new link between a block and a note"""
        import uuid
        link_id = f"link-{uuid.uuid4()}"
        link = cls(id=link_id, source_block_id=source_block_id, target_note_id=target_note_id)
        db.session.add(link)
        db.session.commit()
        return link
        
    @classmethod
    def get_backlinks(cls, note_id):
        """Get all blocks that link to a specific note"""
        return cls.query.filter_by(target_note_id=note_id).all()
