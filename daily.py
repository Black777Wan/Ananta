from flask import Blueprint, jsonify, request, render_template
from datetime import datetime, date
from src.models import db, Note, Block

daily_bp = Blueprint('daily', __name__, url_prefix='/api/daily')

@daily_bp.route('/today', methods=['GET'])
def get_today():
    """Get or create today's daily note"""
    today = date.today()
    date_str = today.strftime("%Y-%m-%d")
    note_id = f"daily/{date_str}"
    
    note = Note.query.get(note_id)
    if note is None:
        note = Note.create_daily_note(today)
        # Create an initial welcome block
        Block.create_for_note(
            note_id=note.id,
            content="Welcome to today's note!",
            order=0
        )
    
    return jsonify(note.to_dict())

@daily_bp.route('/<int:year>/<int:month>/<int:day>', methods=['GET'])
def get_daily_note(year, month, day):
    """Get or create a specific daily note"""
    try:
        specific_date = date(year, month, day)
        date_str = specific_date.strftime("%Y-%m-%d")
        note_id = f"daily/{date_str}"
        
        note = Note.query.get(note_id)
        if note is None:
            note = Note.create_daily_note(specific_date)
            # Create an initial welcome block
            Block.create_for_note(
                note_id=note.id,
                content=f"Note for {specific_date.strftime('%B %d, %Y')}",
                order=0
            )
        
        return jsonify(note.to_dict())
    except ValueError:
        return jsonify({"error": "Invalid date"}), 400

@daily_bp.route('/calendar/<int:year>/<int:month>', methods=['GET'])
def get_calendar(year, month):
    """Get calendar data for a specific month"""
    try:
        # Find all daily notes for the specified month
        start_date = f"daily/{year}-{month:02d}-01"
        end_date = f"daily/{year}-{month:02d}-31" if month != 12 else f"daily/{year+1}-01-01"
        
        notes = Note.query.filter(
            Note.id >= start_date,
            Note.id < end_date,
            Note.is_daily == True
        ).all()
        
        # Create a calendar with dates that have notes
        calendar_data = {
            "year": year,
            "month": month,
            "days_with_notes": [int(note.id.split('/')[-1].split('-')[-1]) for note in notes]
        }
        
        return jsonify(calendar_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 400
