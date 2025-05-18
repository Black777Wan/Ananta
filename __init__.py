from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

from src.models.note import Note
from src.models.block import Block
from src.models.link import Link
