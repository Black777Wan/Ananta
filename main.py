from flask import Flask, jsonify, request, render_template, redirect, url_for
import os
import sys
from datetime import datetime, date

# Add the project root to the Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# Create Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.urandom(24)

# Configure database
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///note_taking_app.db"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize database
from src.models import db
db.init_app(app)

# Import routes
from src.routes.notes import notes_bp
from src.routes.daily import daily_bp
from src.routes.search import search_bp
from src.routes.recordings import recordings_bp
from src.routes.timestamps import timestamps_bp

# Register blueprints
app.register_blueprint(notes_bp)
app.register_blueprint(daily_bp)
app.register_blueprint(search_bp)
app.register_blueprint(recordings_bp)
app.register_blueprint(timestamps_bp)

# Home route
@app.route('/')
def index():
    return render_template('index.html')

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def server_error(error):
    return jsonify({'error': 'Server error'}), 500

# Create database tables
with app.app_context():
    db.create_all()
    
    # Create today's daily note if it doesn't exist
    from src.models.note import Note
    today = date.today()
    date_str = today.strftime("%Y-%m-%d")
    note_id = f"daily/{date_str}"
    
    existing_note = Note.query.get(note_id)
    if not existing_note:
        # Format date in Roam style: "May 18th, 2025"
        month = today.strftime("%B")
        day = today.day
        year = today.year
        
        # Add ordinal suffix
        if 4 <= day <= 20 or 24 <= day <= 30:
            suffix = "th"
        else:
            suffix = ["st", "nd", "rd"][day % 10 - 1] if day % 10 <= 3 else "th"
            
        title = f"{month} {day}{suffix}, {year}"
        
        # Create the note
        note = Note(id=note_id, title=title, is_daily=True)
        db.session.add(note)
        db.session.commit()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
