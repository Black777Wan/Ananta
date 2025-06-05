from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from src.extensions import db

class Page(db.Model):
    __tablename__ = 'pages'
    
    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False, unique=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    blocks = relationship("Block", back_populates="page", cascade="all, delete-orphan")
    source_links = relationship("Link", foreign_keys="Link.source_page_id", back_populates="source_page", cascade="all, delete-orphan")
    target_links = relationship("Link", foreign_keys="Link.target_page_id", back_populates="target_page", cascade="all, delete-orphan")
    audio_recordings = relationship("AudioRecording", back_populates="page", cascade="all, delete-orphan")
    
    # Indexes
    __table_args__ = (
        Index('idx_page_title', 'title'),
    )

class Block(db.Model):
    __tablename__ = 'blocks'
    
    id = Column(Integer, primary_key=True)
    block_uuid = Column(String, nullable=False, unique=True)
    content = Column(String, nullable=False)
    page_id = Column(Integer, ForeignKey('pages.id', ondelete='CASCADE'), nullable=False)
    parent_block_uuid = Column(String, ForeignKey('blocks.block_uuid', ondelete='CASCADE'), nullable=True)
    order = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    page = relationship("Page", back_populates="blocks")
    children = relationship("Block", foreign_keys=[parent_block_uuid], backref=db.backref('parent', remote_side=[block_uuid]))
    source_references = relationship("BlockReference", foreign_keys="BlockReference.source_block_uuid", back_populates="source_block", cascade="all, delete-orphan")
    target_references = relationship("BlockReference", foreign_keys="BlockReference.target_block_uuid", back_populates="target_block", cascade="all, delete-orphan")
    audio_timestamps = relationship("AudioTimestamp", back_populates="block", cascade="all, delete-orphan")
    
    # Indexes
    __table_args__ = (
        Index('idx_block_page_id', 'page_id'),
        Index('idx_block_parent_block_uuid', 'parent_block_uuid'),
        Index('idx_block_hierarchy', 'page_id', 'parent_block_uuid', 'order'),
    )

class Link(db.Model):
    __tablename__ = 'links'
    
    id = Column(Integer, primary_key=True)
    source_page_id = Column(Integer, ForeignKey('pages.id', ondelete='CASCADE'), nullable=False)
    target_page_id = Column(Integer, ForeignKey('pages.id', ondelete='CASCADE'), nullable=False)
    link_type = Column(String, default='explicit')
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    source_page = relationship("Page", foreign_keys=[source_page_id], back_populates="source_links")
    target_page = relationship("Page", foreign_keys=[target_page_id], back_populates="target_links")
    
    # Constraints and Indexes
    __table_args__ = (
        UniqueConstraint('source_page_id', 'target_page_id', name='uq_link_source_target'),
        Index('idx_link_source_page_id', 'source_page_id'),
        Index('idx_link_target_page_id', 'target_page_id'),
    )

class BlockReference(db.Model):
    __tablename__ = 'block_references'
    
    id = Column(Integer, primary_key=True)
    source_block_uuid = Column(String, ForeignKey('blocks.block_uuid', ondelete='CASCADE'), nullable=False)
    target_block_uuid = Column(String, ForeignKey('blocks.block_uuid', ondelete='CASCADE'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    source_block = relationship("Block", foreign_keys=[source_block_uuid], back_populates="source_references")
    target_block = relationship("Block", foreign_keys=[target_block_uuid], back_populates="target_references")
    
    # Constraints and Indexes
    __table_args__ = (
        UniqueConstraint('source_block_uuid', 'target_block_uuid', name='uq_block_ref_source_target'),
        Index('idx_block_ref_source_block_uuid', 'source_block_uuid'),
        Index('idx_block_ref_target_block_uuid', 'target_block_uuid'),
    )

class AudioRecording(db.Model):
    __tablename__ = 'audio_recordings'
    
    id = Column(Integer, primary_key=True)
    file_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    mime_type = Column(String)
    page_id = Column(Integer, ForeignKey('pages.id', ondelete='SET NULL'), nullable=True)
    block_id_context_start = Column(String, ForeignKey('blocks.block_uuid', ondelete='SET NULL'), nullable=True)
    start_timestamp = Column(DateTime, default=datetime.utcnow)
    end_timestamp = Column(DateTime, nullable=True)
    duration_ms = Column(Integer, nullable=True)
    mic_device_name = Column(String, nullable=True)
    system_audio_device_name = Column(String, nullable=True)
    audio_quality = Column(String, nullable=True)
    file_size_bytes = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    page = relationship("Page", back_populates="audio_recordings")
    block_context = relationship("Block", foreign_keys=[block_id_context_start])
    audio_timestamps = relationship("AudioTimestamp", back_populates="recording", cascade="all, delete-orphan")
    
    # Indexes
    __table_args__ = (
        Index('idx_audio_recording_page_id', 'page_id'),
        Index('idx_audio_recording_block_id_context', 'block_id_context_start'),
        Index('idx_audio_recording_start_timestamp', 'start_timestamp'),
    )

class AudioTimestamp(db.Model):
    __tablename__ = 'audio_timestamps'
    
    id = Column(Integer, primary_key=True)
    recording_id = Column(Integer, ForeignKey('audio_recordings.id', ondelete='CASCADE'), nullable=False)
    block_uuid = Column(String, ForeignKey('blocks.block_uuid', ondelete='CASCADE'), nullable=False)
    timestamp_in_audio_ms = Column(Integer, nullable=False)
    block_created_at_realtime = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationships
    recording = relationship("AudioRecording", back_populates="audio_timestamps")
    block = relationship("Block", back_populates="audio_timestamps")
    
    # Constraints and Indexes
    __table_args__ = (
        UniqueConstraint('recording_id', 'block_uuid', name='uq_audio_timestamp_recording_block'),
        Index('idx_audio_timestamp_recording_id', 'recording_id'),
        Index('idx_audio_timestamp_block_uuid', 'block_uuid'),
        Index('idx_audio_timestamp_timestamp_in_audio', 'timestamp_in_audio_ms'),
    )
