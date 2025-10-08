import pytest
import json
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from pattern_quest.app import app, db
from pattern_quest.models import Leaderboard


@pytest.fixture
def client():
    """Create a test client for the app"""
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
        yield client
        with app.app_context():
            db.drop_all()


def test_home_page(client):
    """Test that home page loads successfully"""
    response = client.get('/')
    assert response.status_code == 200
    assert b'Pattern Quest' in response.data


def test_get_empty_leaderboard(client):
    """Test getting leaderboard when empty"""
    response = client.get('/api/leaderboard?difficulty=medium')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data == []


def test_add_score(client):
    """Test adding a new score"""
    score_data = {
        'name': 'TestPlayer',
        'score': 20,
        'difficulty': 'medium',
        'time_taken': 120
    }
    
    response = client.post('/api/leaderboard',
                          data=json.dumps(score_data),
                          content_type='application/json')
    
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['message'] == 'Score added'
    assert data['player']['name'] == 'TestPlayer'
    assert data['player']['score'] == 20


def test_update_higher_score(client):
    """Test updating with a higher score"""
    # Add initial score
    score_data = {
        'name': 'TestPlayer',
        'score': 15,
        'difficulty': 'medium'
    }
    client.post('/api/leaderboard',
               data=json.dumps(score_data),
               content_type='application/json')
    
    # Update with higher score
    score_data['score'] = 20
    response = client.post('/api/leaderboard',
                          data=json.dumps(score_data),
                          content_type='application/json')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['message'] == 'Score updated'
    assert data['player']['score'] == 20


def test_keep_existing_higher_score(client):
    """Test that existing higher score is kept"""
    # Add initial high score
    score_data = {
        'name': 'TestPlayer',
        'score': 20,
        'difficulty': 'medium'
    }
    client.post('/api/leaderboard',
               data=json.dumps(score_data),
               content_type='application/json')
    
    # Try to update with lower score
    score_data['score'] = 15
    response = client.post('/api/leaderboard',
                          data=json.dumps(score_data),
                          content_type='application/json')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['message'] == 'Existing score is higher'
    assert data['player']['score'] == 20


def test_get_leaderboard_with_scores(client):
    """Test getting leaderboard with multiple scores"""
    # Add multiple scores
    players = [
        {'name': 'Player1', 'score': 20, 'difficulty': 'medium'},
        {'name': 'Player2', 'score': 18, 'difficulty': 'medium'},
        {'name': 'Player3', 'score': 22, 'difficulty': 'medium'},
    ]
    
    for player in players:
        client.post('/api/leaderboard',
                   data=json.dumps(player),
                   content_type='application/json')
    
    # Get leaderboard
    response = client.get('/api/leaderboard?difficulty=medium')
    assert response.status_code == 200
    data = json.loads(response.data)
    
    # Should be sorted by score descending
    assert len(data) == 3
    assert data[0]['score'] == 22
    assert data[1]['score'] == 20
    assert data[2]['score'] == 18


def test_leaderboard_limit_to_top_3(client):
    """Test that leaderboard only returns top 3"""
    # Add 5 scores
    for i in range(5):
        score_data = {
            'name': f'Player{i}',
            'score': i * 5,
            'difficulty': 'medium'
        }
        client.post('/api/leaderboard',
                   data=json.dumps(score_data),
                   content_type='application/json')
    
    # Get leaderboard
    response = client.get('/api/leaderboard?difficulty=medium')
    data = json.loads(response.data)
    
    # Should only return top 3
    assert len(data) == 3


def test_different_difficulties(client):
    """Test that different difficulties have separate leaderboards"""
    # Add scores for different difficulties
    easy_score = {'name': 'EasyPlayer', 'score': 20, 'difficulty': 'easy'}
    medium_score = {'name': 'MediumPlayer', 'score': 18, 'difficulty': 'medium'}
    hard_score = {'name': 'HardPlayer', 'score': 15, 'difficulty': 'hard'}
    
    client.post('/api/leaderboard', data=json.dumps(easy_score), content_type='application/json')
    client.post('/api/leaderboard', data=json.dumps(medium_score), content_type='application/json')
    client.post('/api/leaderboard', data=json.dumps(hard_score), content_type='application/json')
    
    # Check each difficulty
    easy_response = client.get('/api/leaderboard?difficulty=easy')
    easy_data = json.loads(easy_response.data)
    assert len(easy_data) == 1
    assert easy_data[0]['name'] == 'EasyPlayer'
    
    medium_response = client.get('/api/leaderboard?difficulty=medium')
    medium_data = json.loads(medium_response.data)
    assert len(medium_data) == 1
    assert medium_data[0]['name'] == 'MediumPlayer'


def test_missing_required_fields(client):
    """Test error handling for missing fields"""
    # Missing score
    response = client.post('/api/leaderboard',
                          data=json.dumps({'name': 'TestPlayer'}),
                          content_type='application/json')
    assert response.status_code == 400
    
    # Missing name
    response = client.post('/api/leaderboard',
                          data=json.dumps({'score': 20}),
                          content_type='application/json')
    assert response.status_code == 400


def test_404_error_handler(client):
    """Test 404 error handler"""
    response = client.get('/nonexistent-route')
    assert response.status_code == 404
