from datetime import datetime
from src.models import db

class BlockTimestamp(db.Model):
    """Model for block timestamp associations with recordings"""
    __tablename__ = 'block_timestamps'
    
    id = db.Column(db.String(36), primary_key=True)
    recording_id = db.Column(db.String(36), db.ForeignKey('recordings.id'), nullable=False)
    block_id = db.Column(db.String(36), nullable=False)
    timestamp = db.Column(db.Integer, nullable=False)  # Milliseconds from recording start
    content = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<BlockTimestamp {self.id}>'
