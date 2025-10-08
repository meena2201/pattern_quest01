from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Leaderboard(db.Model):
    """Model for storing player scores"""
    id = db.Column(db.Integer, primary_key=True)
    player_name = db.Column(db.String(100), nullable=False)
    score = db.Column(db.Integer, nullable=False)
    difficulty = db.Column(db.String(20), default='medium')
    time_taken = db.Column(db.Integer, nullable=True)  # in seconds
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        """Convert model to dictionary"""
        return {
            'id': self.id,
            'name': self.player_name,
            'score': self.score,
            'difficulty': self.difficulty,
            'time_taken': self.time_taken,
            'created_at': self.created_at.isoformat()
        }
    
    def __repr__(self):
        return f'<Leaderboard {self.player_name}: {self.score}>'
