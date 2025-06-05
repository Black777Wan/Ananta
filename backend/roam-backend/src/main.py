from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from src.extensions import db
import os
import sys
from dotenv import load_dotenv

# Insert the src directory into the Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# Load environment variables from .env file
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configure database
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

# Import models
from src.models.models import Page, Block, Link, BlockReference, AudioRecording, AudioTimestamp

# Import routes
from src.routes.page_routes import page_bp
from src.routes.block_routes import block_bp
from src.routes.link_routes import link_bp
from src.routes.block_reference_routes import block_reference_bp
from src.routes.audio_routes import audio_bp

# Register blueprints
app.register_blueprint(page_bp, url_prefix='/api/pages')
app.register_blueprint(block_bp, url_prefix='/api/blocks')
app.register_blueprint(link_bp, url_prefix='/api/links')
app.register_blueprint(block_reference_bp, url_prefix='/api/block_references')
app.register_blueprint(audio_bp, url_prefix='/api/audio')

# Initialize database tables
with app.app_context():
    db.create_all()

# Routes
@app.route('/')
def index():
    return {'message': 'Welcome to Roam Research Clone API'}

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
