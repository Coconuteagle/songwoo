import json
import os
import sqlite3
from flask import Flask, send_from_directory, request, jsonify, g

# Use __name__ to ensure Flask finds templates/static files correctly relative to app.py
# Set static_folder='.' to serve files from the root directory where app.py is located.
app = Flask(__name__, static_folder='.')

DATABASE = 'events.db' # Database file will be in the same directory as app.py

# Database connection helper
def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db_path = os.path.join(app.root_path, DATABASE) # Ensure DB path is correct
        db = g._database = sqlite3.connect(db_path)
        db.row_factory = sqlite3.Row # Access columns by name
    return db

# Close DB connection at the end of the request
@app.teardown_appcontext
def close_db(error):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

# Initialize DB schema if it doesn't exist
def init_db():
    with app.app_context():
        db = get_db()
        schema_path = os.path.join(app.root_path, 'schema.sql') # Ensure schema path is correct
        if os.path.exists(schema_path):
            with app.open_resource('schema.sql', mode='r') as f:
                db.cursor().executescript(f.read())
            db.commit()
            print("Database initialized.")
        else:
            print("Error: schema.sql not found. Database not initialized.")

# Check and initialize DB before the first request
# Use before_request only once with a flag or check existence directly
_db_initialized = False
@app.before_request
def before_first_request():
    global _db_initialized
    if not _db_initialized:
        db_path = os.path.join(app.root_path, DATABASE)
        if not os.path.exists(db_path):
            init_db()
        _db_initialized = True # Ensure init_db runs only once


# --- Routes ---

# Serve index.html from the root
@app.route('/')
def index():
    # send_from_directory needs the directory *name*, not the path join
    # Since static_folder='.', the directory is the app's root path.
    return send_from_directory(app.static_folder, 'index.html')

# Serve other static files (CSS, JS) from the root
@app.route('/<path:filename>')
def serve_static(filename):
    # Ensure filename is safe (though send_from_directory does some checks)
    if filename == 'app.py' or filename == 'requirements.txt' or filename == 'Procfile' or filename == 'schema.sql' or filename == DATABASE:
         return "Not Found", 404 # Prevent serving sensitive files

    # Check if the requested file is likely static content
    if filename.endswith(('.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.json', '.txt')):
        return send_from_directory(app.static_folder, filename)
    else:
        # If it's not recognized static content, maybe it's meant for the index (for SPA routing)
        # Or just return 404 if you don't have client-side routing
        return send_from_directory(app.static_folder, 'index.html') # Or return "Not Found", 404

# Health check endpoint
@app.route('/healthz', methods=['GET'])
def healthz():
    try:
        # Optional: Check DB connection
        db = get_db()
        db.execute('SELECT 1')
        return jsonify({"status": "ok"}), 200
    except Exception as e:
        return jsonify({"status": "error", "reason": str(e)}), 500

# API: Get all events (formatted for the frontend)
@app.route('/api/events', methods=['GET'])
def get_events():
    # Future Optimization: Add query parameters for year/month filtering
    # year = request.args.get('year')
    # month = request.args.get('month')
    db = get_db()
    cursor = db.execute('SELECT id, date, author, content FROM events ORDER BY date')
    events_list = cursor.fetchall()

    events_data = {}
    for event in events_list:
        date = event['date']
        if date not in events_data:
            events_data[date] = []
        events_data[date].append({
            "id": event['id'],
            "author": event['author'],
            "content": event['content']
        })

    return jsonify(events_data)

# API: Save a new event
@app.route('/api/events', methods=['POST'])
def save_event():
    if not request.is_json:
        return jsonify({"message": "Request must be JSON"}), 400

    data = request.json
    date = data.get('date')
    event_data = data.get('event') # Renamed to avoid conflict with event keyword

    # Validate input data
    if not date or not event_data or not isinstance(event_data, dict):
         return jsonify({"message": "Missing 'date' or 'event' field in JSON body"}), 400

    author = event_data.get('author')
    content = event_data.get('content')

    if not author or not content:
        return jsonify({"message": "Missing 'author' or 'content' within 'event' object"}), 400

    try:
        db = get_db()
        cursor = db.execute('INSERT INTO events (date, author, content) VALUES (?, ?, ?)',
                            (date, author, content))
        db.commit()
        new_event_id = cursor.lastrowid # Get the ID of the newly inserted row

        # Return the saved event including its new ID
        saved_event = {"id": new_event_id, "author": author, "content": content}
        return jsonify({"message": "Event saved successfully", "event": saved_event}), 201
    except sqlite3.Error as e:
        db.rollback() # Rollback transaction on error
        print(f"Database error on save: {e}")
        return jsonify({"message": f"Database error: {e}"}), 500
    except Exception as e:
        db.rollback()
        print(f"Error saving event: {e}")
        return jsonify({"message": "An internal server error occurred"}), 500


# API: Delete an event by ID
@app.route('/api/events/<int:event_id>', methods=['DELETE'])
def delete_event_api(event_id): # Renamed function to avoid conflict
    try:
        db = get_db()
        cursor = db.execute('DELETE FROM events WHERE id = ?', (event_id,))
        db.commit()

        if cursor.rowcount == 0:
            return jsonify({"message": "Event not found"}), 404
        else:
            return jsonify({"message": "Event deleted successfully"}), 200 # Use 200 OK or 204 No Content
    except sqlite3.Error as e:
        db.rollback()
        print(f"Database error on delete: {e}")
        return jsonify({"message": f"Database error: {e}"}), 500
    except Exception as e:
        db.rollback()
        print(f"Error deleting event: {e}")
        return jsonify({"message": "An internal server error occurred"}), 500


# Remove the app.run() block when using Gunicorn
# if __name__ == '__main__':
#    # This part is NOT needed when deploying with Gunicorn/Cloudtype
#    # Gunicorn will handle binding to host/port based on Cloudtype settings
#    # Ensure debug is False for production
#    pass
