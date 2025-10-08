# 🧩 Pattern Quest

A fun and interactive pattern recognition game built with Flask and vanilla JavaScript.

## Features

- **8 Games with 3 Levels Each** (24 total levels)
- **3 Difficulty Levels**: Easy (30s), Medium (20s), Hard (10s)
- **Countdown Timer** for each question with color-coded warnings
- **SQLite Database Backend** for persistent leaderboard storage
- **RESTful API** for leaderboard management
- Game progress display showing current game and level
- Pattern types: colors, shapes, numbers, logic puzzles, emojis, symbols
- **Top 8 Leaderboard** per difficulty - Always visible on the left side
- Player names automatically capitalized
- **Exit Button** - Save progress and let another student play
- **Randomized Answer Options** - Prevents memorization
- Sound effects for correct/wrong/game completion
- **TailwindCSS** for modern, responsive UI
- Comprehensive unit tests with pytest
- Time tracking for each game session

## Prerequisites

- Python 3.7 or higher
- pip (Python package installer)

## Installation

1. Clone or download this repository

2. Navigate to the project directory:
```bash
cd sdml24_pattern_quest
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the Application

### Development Mode

```bash
cd pattern_quest
python app.py
```

The app will run on `http://localhost:5000`

### Production Mode

Set environment variables before running:

**Windows (PowerShell):**
```powershell
$env:FLASK_DEBUG="false"
$env:SECRET_KEY="your-secret-key-here"
python app.py
```

**Linux/Mac:**
```bash
export FLASK_DEBUG=false
export SECRET_KEY=your-secret-key-here
python app.py
```

## Environment Variables

- `FLASK_DEBUG`: Set to `true` for development, `false` for production (default: `false`)
- `SECRET_KEY`: Secret key for Flask sessions (default: dev key - change in production!)
- `PORT`: Port to run the application (default: `5000`)

## Project Structure

```
sdml24_pattern_quest/
├── pattern_quest/
│   ├── app.py              # Flask application
│   ├── static/
│   │   ├── assets/         # Audio files
│   │   ├── script.js       # Game logic
│   │   └── style.css       # Styling
│   └── templates/
│       └── index.html      # Main page
├── requirements.txt        # Python dependencies
└── README.md              # This file
```

## How to Play

1. Enter your name (first letter will be automatically capitalized)
2. **Select difficulty level**: Easy, Medium, or Hard
3. Click "Start Game"
4. Look at the pattern sequence
5. **Answer before time runs out!** (Timer changes color as time decreases)
6. Choose the correct answer from the randomized options
7. Progress through 8 games, each with 3 levels
8. Check the leaderboard on the left to see the top 3 players for your difficulty
9. Click "Exit" button if you want to let another student play
10. Try to beat the high score and get on the leaderboard!

## Scoring System

- Start with **0 points**
- **+1** for each correct answer
- **-1** for each wrong answer or timeout
- Maximum possible score: **24 points** (all correct)

## Game Structure

The game has **8 different games**, each with **3 levels**:

1. **Color Patterns** - Repeating color sequences
2. **Shape Rotation** - Geometric rotation patterns
3. **Counting Patterns** - Number and counting sequences
4. **Grid Puzzles** - Missing tile logic puzzles
5. **Emoji Patterns** - Alternating emoji sequences
6. **Symbol Patterns** - Math symbol patterns
7. **Shape Mix** - Mixed shape logic
8. **Advanced Patterns** - Complex color and grid logic

## Security Features

- Input sanitization to prevent XSS attacks
- Environment-based configuration
- Error handling for all critical operations
- Secure secret key management

## Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari
- Any modern browser with localStorage support

## Troubleshooting

**Sound effects not playing:**
- Check browser permissions for audio
- Ensure audio files exist in `static/assets/`

**Leaderboard not saving:**
- Check browser localStorage is enabled
- Clear browser cache and try again

**Port already in use:**
- Change the PORT environment variable to use a different port

## API Endpoints

### GET `/api/leaderboard`
Get top 3 players for a specific difficulty
- Query params: `difficulty` (easy/medium/hard)
- Returns: Array of player objects

### POST `/api/leaderboard`
Add or update a player's score
- Body: `{ "name": "PlayerName", "score": 20, "difficulty": "medium", "time_taken": 120 }`
- Returns: Success message and player data

## Running Tests

Run the unit tests with pytest:

```bash
# Install test dependencies
pip install -r requirements.txt

# Run all tests
pytest

# Run with verbose output
pytest -v

# Run specific test file
pytest tests/test_app.py
```

## Database

The application uses SQLite for data persistence. The database file `pattern_quest.db` will be created automatically in the `pattern_quest` directory on first run.

### Database Schema

**Leaderboard Table:**
- `id`: Primary key
- `player_name`: Player's name (string)
- `score`: Player's score (integer)
- `difficulty`: Game difficulty (easy/medium/hard)
- `time_taken`: Time taken in seconds (integer)
- `created_at`: Timestamp

## License

This project is for educational purposes.
