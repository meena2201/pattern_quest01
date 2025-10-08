import os
from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
from models import db, Leaderboard

# Create the Flask app
app = Flask(__name__)
CORS(app)

# Configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['DEBUG'] = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'

# Database configuration - Use PostgreSQL in production, SQLite in development
database_url = os.environ.get('DATABASE_URL')
if database_url:
    # Fix for Heroku/Render PostgreSQL URL format
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
else:
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///pattern_quest.db'

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize database
db.init_app(app)

# Create tables
with app.app_context():
    db.create_all()

# Define the route for the home page
@app.route('/')
def home():
    return render_template('index.html')

# Admin Dashboard Route
@app.route('/admin')
def admin_dashboard():
    return render_template('admin.html')

# API Route for Admin Statistics
@app.route('/api/admin/stats', methods=['GET'])
def get_admin_stats():
    """Get statistics for admin dashboard"""
    try:
        # Total players
        total_players = db.session.query(Leaderboard.player_name).distinct().count()
        
        # Total games played
        total_games = Leaderboard.query.count()
        
        # Average score
        avg_score = db.session.query(db.func.avg(Leaderboard.score)).scalar() or 0
        
        # Highest score
        highest_score = db.session.query(db.func.max(Leaderboard.score)).scalar() or 0
        
        # Average time taken
        avg_time = db.session.query(db.func.avg(Leaderboard.time_taken)).scalar() or 0
        
        # Scores by difficulty
        easy_avg = db.session.query(db.func.avg(Leaderboard.score)).filter_by(difficulty='easy').scalar() or 0
        medium_avg = db.session.query(db.func.avg(Leaderboard.score)).filter_by(difficulty='medium').scalar() or 0
        hard_avg = db.session.query(db.func.avg(Leaderboard.score)).filter_by(difficulty='hard').scalar() or 0
        
        # Recent players
        recent_players = Leaderboard.query.order_by(Leaderboard.created_at.desc()).limit(10).all()
        
        return jsonify({
            'total_players': total_players,
            'total_games': total_games,
            'average_score': round(avg_score, 2),
            'highest_score': highest_score,
            'average_time': round(avg_time, 2),
            'difficulty_stats': {
                'easy': round(easy_avg, 2),
                'medium': round(medium_avg, 2),
                'hard': round(hard_avg, 2)
            },
            'recent_players': [player.to_dict() for player in recent_players]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# API Routes for Leaderboard
@app.route('/api/leaderboard', methods=['GET'])
def get_leaderboard():
    """Get top 8 players by difficulty"""
    difficulty = request.args.get('difficulty', 'medium')
    
    top_players = Leaderboard.query.filter_by(difficulty=difficulty)\
        .order_by(Leaderboard.score.desc())\
        .limit(8)\
        .all()
    
    return jsonify([player.to_dict() for player in top_players])

@app.route('/api/leaderboard', methods=['POST'])
def add_score():
    """Add or update player score"""
    data = request.get_json()
    
    if not data or 'name' not in data or 'score' not in data:
        return jsonify({'error': 'Missing required fields'}), 400
    
    player_name = data['name']
    score = data['score']
    difficulty = data.get('difficulty', 'medium')
    time_taken = data.get('time_taken')
    
    # Check if player exists for this difficulty
    existing = Leaderboard.query.filter_by(
        player_name=player_name, 
        difficulty=difficulty
    ).first()
    
    if existing:
        # Update if new score is higher
        if score > existing.score:
            existing.score = score
            existing.time_taken = time_taken
            db.session.commit()
            return jsonify({'message': 'Score updated', 'player': existing.to_dict()})
        return jsonify({'message': 'Existing score is higher', 'player': existing.to_dict()})
    else:
        # Create new entry
        new_entry = Leaderboard(
            player_name=player_name,
            score=score,
            difficulty=difficulty,
            time_taken=time_taken
        )
        db.session.add(new_entry)
        db.session.commit()
        return jsonify({'message': 'Score added', 'player': new_entry.to_dict()}), 201

# Error handlers
@app.errorhandler(404)
def not_found_error(error):
    return render_template('index.html'), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

# Run the app
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    app.run(host='0.0.0.0', port=port, debug=debug)
