from datetime import datetime
from src.models import db

class Recording(db.Model):
    """Model for audio recordings"""
    __tablename__ = 'recordings'
    
    id = db.Column(db.String(36), primary_key=True)
    note_id = db.Column(db.String(36), nullable=False)
    start_time = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    end_time = db.Column(db.DateTime, nullable=True)
    duration = db.Column(db.Integer, nullable=True)  # Duration in milliseconds
    file_path = db.Column(db.String(255), nullable=False)
    file_format = db.Column(db.String(10), nullable=False)
    file_size = db.Column(db.Integer, nullable=True)
    source_type = db.Column(db.String(20), nullable=False, default='microphone')
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationships
    timestamps = db.relationship('BlockTimestamp', backref='recording', lazy=True, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Recording {self.id}>'
