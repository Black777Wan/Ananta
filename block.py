from datetime import datetime
from src.models import db
from sqlalchemy.orm import relationship

class Block(db.Model):
    """
    Block model representing individual content blocks within notes
    """
    __tablename__ = 'blocks'
    
    id = db.Column(db.String(255), primary_key=True)  # UUID-based ID
    note_id = db.Column(db.String(255), db.ForeignKey('notes.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    order = db.Column(db.Integer, nullable=False)
    parent_id = db.Column(db.String(255), db.ForeignKey('blocks.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    note = relationship("Note", back_populates="blocks")
    children = relationship("Block", 
                           backref=db.backref('parent', remote_side=[id]),
                           cascade="all, delete-orphan")
    outgoing_links = relationship("Link", 
                                 foreign_keys="Link.source_block_id",
                                 back_populates="source_block",
                                 cascade="all, delete-orphan")
    
    def __init__(self, id, note_id, content, order, parent_id=None):
        self.id = id
        self.note_id = note_id
        self.content = content
        self.order = order
        self.parent_id = parent_id
    
    def to_dict(self):
        """Convert block to dictionary for JSON serialization"""
        return {
            'id': self.id,
            'note_id': self.note_id,
            'content': self.content,
            'order': self.order,
            'parent_id': self.parent_id,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'children': [child.to_dict() for child in self.children]
        }
    
    @classmethod
    def create_for_note(cls, note_id, content, order, parent_id=None):
        """Create a new block for a note"""
        import uuid
        block_id = f"block-{uuid.uuid4()}"
        block = cls(id=block_id, note_id=note_id, content=content, order=order, parent_id=parent_id)
        db.session.add(block)
        db.session.commit()
        return block
