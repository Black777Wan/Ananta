from datetime import datetime
from src.models import db
from sqlalchemy.orm import relationship

class Note(db.Model):
    """
    Note model representing both regular pages and daily notes
    """
    __tablename__ = 'notes'
    
    id = db.Column(db.String(255), primary_key=True)  # Slug-based ID
    title = db.Column(db.String(255), nullable=False)
    is_daily = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    blocks = relationship("Block", back_populates="note", cascade="all, delete-orphan", order_by="Block.order")
    
    def __init__(self, id, title, is_daily=False):
        self.id = id
        self.title = title
        self.is_daily = is_daily
    
    def to_dict(self):
        """Convert note to dictionary for JSON serialization"""
        return {
            'id': self.id,
            'title': self.title,
            'is_daily': self.is_daily,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'blocks': [block.to_dict() for block in self.blocks]
        }
    
    @classmethod
    def create_daily_note(cls, date):
        """Create a daily note for the specified date"""
        date_str = date.strftime("%Y-%m-%d")
        title = date.strftime("%B %d, %Y")
        note = cls(id=f"daily/{date_str}", title=title, is_daily=True)
        db.session.add(note)
        db.session.commit()
        return note
    
    @classmethod
    def get_or_create(cls, id, title=None):
        """Get an existing note or create a new one"""
        note = cls.query.get(id)
        if note is None and title:
            note = cls(id=id, title=title)
            db.session.add(note)
            db.session.commit()
        return note
