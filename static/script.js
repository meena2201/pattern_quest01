// === Pattern Quest: Script.js ===
// Game state variables
let currentLevel = 0;
let currentGame = 1;
let score = 0; // Start with 0
let playerName = "";
let difficulty = "medium"; // Default difficulty
let startTime = null; // Track game start time
let timerInterval = null; // Timer interval
let timeLeft = 20; // Time left for current question
let isMuted = false; // Sound toggle state

// Timer durations based on difficulty
const TIMER_DURATIONS = {
  easy: 30,
  medium: 20,
  hard: 10
};

// DOM Elements
const startScreen = document.getElementById("start-screen");
const gameScreen = document.getElementById("game-screen");
const endScreen = document.getElementById("end-screen");

const playerNameInput = document.getElementById("player-name-input");
const startButton = document.getElementById("start-button");
const restartButton = document.getElementById("restart-button");
const frontPageButton = document.getElementById("front-page-button");
const exitButton = document.getElementById("exit-button");
const soundToggle = document.getElementById("sound-toggle");

const playerNameDisplay = document.getElementById("player-name-display");
const scoreDisplay = document.getElementById("score-display");
const gameDisplay = document.getElementById("game-display");
const levelDisplay = document.getElementById("level-display");
const timerDisplay = document.getElementById("timer-display");
const starsDisplay = document.getElementById("stars-display");
const encouragementMsg = document.getElementById("encouragement");
const patternDiv = document.getElementById("pattern-sequence");
const optionsDiv = document.getElementById("options");
const feedback = document.getElementById("feedback");
const nextButton = document.getElementById("next-button");
const finalMessage = document.getElementById("final-message");
const leaderboardList = document.getElementById("leaderboard-list");
const progressFill = document.getElementById("progress-fill");
const progressPercent = document.getElementById("progress-percent");

// Encouraging messages
const encouragingMessages = [
  "You're doing amazing! 🌟",
  "Keep it up! 💪",
  "You're a star! ⭐",
  "Fantastic work! 🎉",
  "You're on fire! 🔥",
  "Brilliant! 🎨",
  "Super smart! 🧠",
  "You rock! 🎸",
  "Awesome job! 🚀",
  "You're unstoppable! 💫"
];

// Difficulty buttons
const difficultyButtons = document.querySelectorAll(".difficulty-btn");

// Sound effects with error handling
const correctSound = new Audio("/static/assets/correct.mp3.wav");
const wrongSound = new Audio("/static/assets/wrong.mp3.wav");
const gameCompleteSound = new Audio("/static/assets/score_increasing.wav");

// Handle audio loading errors gracefully
correctSound.addEventListener('error', () => {
  console.warn('Could not load correct sound effect');
});
wrongSound.addEventListener('error', () => {
  console.warn('Could not load wrong sound effect');
});
gameCompleteSound.addEventListener('error', () => {
  console.warn('Could not load game complete sound effect');
});

// Load leaderboard from backend API
async function loadLeaderboard() {
  try {
    const response = await fetch(`/api/leaderboard?difficulty=${difficulty}`);
    if (!response.ok) throw new Error('Failed to load leaderboard');
    return await response.json();
  } catch (error) {
    console.error('Error loading leaderboard:', error);
    return [];
  }
}

// Save score to backend API
async function saveLeaderboard(playerData) {
  try {
    const response = await fetch('/api/leaderboard', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(playerData)
    });
    
    if (!response.ok) throw new Error('Failed to save score');
    return await response.json();
  } catch (error) {
    console.error('Error saving leaderboard:', error);
    alert('Could not save your score. Please try again.');
  }
}

// Update leaderboard with current player
async function updateLeaderboard() {
  const timeTaken = startTime ? Math.floor((Date.now() - startTime) / 1000) : null;
  
  const playerData = {
    name: playerName,
    score: score,
    difficulty: difficulty,
    time_taken: timeTaken
  };
  
  await saveLeaderboard(playerData);
  await showLeaderboard();
}

// Display leaderboard
async function showLeaderboard() {
  const lb = await loadLeaderboard();
  leaderboardList.innerHTML = "";
  if (lb.length === 0) {
    leaderboardList.innerHTML = "<li>No scores yet!</li>";
  } else {
    lb.forEach((entry, index) => {
      const li = document.createElement("li");
      let medal = "";
      if (index === 0) medal = "🥇";
      else if (index === 1) medal = "🥈";
      else if (index === 2) medal = "🥉";
      else medal = "🏅";
      li.textContent = `${medal} ${entry.name}: ${entry.score}`;
      leaderboardList.appendChild(li);
    });
  }
}

// Shuffle array function (Fisher-Yates algorithm)
function shuffleArray(array) {
  const shuffled = [...array]; // Create a copy
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Timer functions
function startTimer() {
  stopTimer(); // Clear any existing timer
  timeLeft = TIMER_DURATIONS[difficulty];
  updateTimerDisplay();
  
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    
    if (timeLeft <= 0) {
      stopTimer();
      handleTimeOut();
    }
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function updateTimerDisplay() {
  timerDisplay.textContent = `⏱️ Time: ${timeLeft}s`;
  
  // Change color based on time left
  if (timeLeft <= 5) {
    timerDisplay.style.color = "#f44336"; // Red
  } else if (timeLeft <= 10) {
    timerDisplay.style.color = "#ff9800"; // Orange
  } else {
    timerDisplay.style.color = "#4CAF50"; // Green
  }
}

function handleTimeOut() {
  feedback.textContent = "⏰ Time's up! -1";
  feedback.style.color = "#f44336";
  score = Math.max(0, score - 1);
  scoreDisplay.textContent = `Score: ${score}`;
  
  // Disable all option buttons
  const buttons = optionsDiv.querySelectorAll("button");
  buttons.forEach(btn => btn.disabled = true);
  
  nextButton.style.display = "inline-block";
}

// Difficulty selection
difficultyButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    // Remove active class from all buttons
    difficultyButtons.forEach(b => b.classList.remove("active"));
    // Add active class to clicked button
    btn.classList.add("active");
    // Update difficulty
    difficulty = btn.dataset.difficulty;
  });
});

// Confetti celebration
function celebrateWithConfetti() {
  const duration = 3 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

  function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  const interval = setInterval(function() {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);

    confetti(Object.assign({}, defaults, {
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
    }));
    confetti(Object.assign({}, defaults, {
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
    }));
  }, 250);
}

// Show random encouraging message
function showEncouragingMessage() {
  if (!encouragementMsg) return; // Safety check
  const randomMsg = encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)];
  encouragementMsg.textContent = randomMsg;
  encouragementMsg.style.animation = 'none';
  setTimeout(() => {
    encouragementMsg.style.animation = 'fadeInOut 2s ease-in-out infinite';
  }, 10);
}

// Update star display based on performance
function updateStars(correct) {
  if (!starsDisplay) return; // Safety check
  const stars = starsDisplay.querySelectorAll('.star');
  if (correct) {
    // Add earned class to a random star
    const unearnedStars = Array.from(stars).filter(s => !s.classList.contains('earned'));
    if (unearnedStars.length > 0) {
      const randomStar = unearnedStars[Math.floor(Math.random() * unearnedStars.length)];
      randomStar.classList.add('earned');
    }
  }
}

// Reset stars
function resetStars() {
  if (!starsDisplay) return; // Safety check
  const stars = starsDisplay.querySelectorAll('.star');
  stars.forEach(star => star.classList.remove('earned'));
}

// Update progress bar
function updateProgressBar() {
  if (!progressFill || !progressPercent) return; // Safety check
  
  const totalLevels = 24; // 8 games * 3 levels
  const completedLevels = (currentGame - 1) * 3 + currentLevel;
  const percentage = (completedLevels / totalLevels) * 100;
  
  progressFill.style.width = `${percentage}%`;
  progressPercent.textContent = `${Math.round(percentage)}%`;
}

// Sound toggle functionality
if (soundToggle) {
  soundToggle.addEventListener('click', () => {
    isMuted = !isMuted;
    soundToggle.textContent = isMuted ? '🔇' : '🔊';
    soundToggle.classList.toggle('muted');
    
    // Mute/unmute all sounds
    correctSound.muted = isMuted;
    wrongSound.muted = isMuted;
    gameCompleteSound.muted = isMuted;
  });
}

// === Games Data - 8 Games with 3 Levels Each ===

const games = [
  // Game 1: Shape Patterns (Color Repeating)
  {
    name: "Color Patterns",
    levels: [
      {
        question: "🟥🟩🟦🟥🟩❓",
        options: ["🟨", "🟦", "🟫"],
        answer: "🟦"
      },
      {
        question: "🔴🟡🔵🔴🟡🔵🔴❓",
        options: ["🔴", "🟡", "🟢"],
        answer: "🟡"
      },
      {
        question: "🟥🟧🟨🟩🟦🟪🟥❓",
        options: ["🟧", "🟫", "⬛"],
        answer: "🟧"
      }
    ]
  },

  // Game 2: Geometric Rotation
  {
    name: "Shape Rotation",
    levels: [
      {
        question: "◻️ ➡️ ◱ ➡️ ◨ ➡️ ❓",
        options: ["◧", "◧", "◩"],
        answer: "◧"
      },
      {
        question: "🔺➡️🔻➡️🔺➡️❓",
        options: ["🔺", "🔻", "◀️"],
        answer: "🔻"
      },
      {
        question: "◼️➡️◴➡️◶➡️❓",
        options: ["◷", "◵", "◼️"],
        answer: "◷"
      }
    ]
  },

  // Game 3: Number Patterns (Counting Shapes)
  {
    name: "Counting Patterns",
    levels: [
      {
        question: "1🔺 → 2🔺🔺 → 3🔺🔺🔺 → ❓",
        options: ["4🔺🔺🔺🔺", "3🔺🔺🔺", "5🔺🔺🔺🔺🔺"],
        answer: "4🔺🔺🔺🔺"
      },
      {
        question: "1🟦 → 3🟦🟦🟦 → 5🟦🟦🟦🟦🟦 → ❓",
        options: ["7🟦🟦🟦🟦🟦🟦🟦", "6🟦🟦🟦🟦🟦🟦", "8🟦🟦🟦🟦🟦🟦🟦🟦"],
        answer: "7🟦🟦🟦🟦🟦🟦🟦"
      },
      {
        question: "🔴 → 🔴🔵 → 🔴🔵🔴 → ❓",
        options: ["🔴🔵🔴🔵", "🔴🔵🔴🔵🔴", "🔵🔴🔵🔴"],
        answer: "🔴🔵🔴🔵"
      }
    ]
  },

  // Game 4: Missing Tile (Simple Logic)
  {
    name: "Grid Puzzles",
    levels: [
      {
        question: "🟥 🟩 🟦\n🟦 🟥 🟩\n🟩 ❓ 🟥",
        options: ["🟥", "🟩", "🟦"],
        answer: "🟦"
      },
      {
        question: "🔴🔵🔴\n🔵🔴🔵\n🔴❓🔴",
        options: ["🔵", "🔴", "🟢"],
        answer: "🔵"
      },
      {
        question: "◼️◻️◼️\n◻️◼️◻️\n◼️❓◼️",
        options: ["◻️", "◼️", "⬛"],
        answer: "◻️"
      }
    ]
  },

  // Game 5: Emoji Alternating Logic
  {
    name: "Emoji Patterns",
    levels: [
      {
        question: "😀😁😀😁❓",
        options: ["😀", "😁", "😅"],
        answer: "😀"
      },
      {
        question: "🐶🐱🐶🐱🐶❓",
        options: ["🐱", "🐭", "🐶"],
        answer: "🐱"
      },
      {
        question: "🍎🍌🍎🍇🍎❓",
        options: ["🍇", "🍌", "🍎"],
        answer: "🍌"
      }
    ]
  },

  // Game 6: Math Symbol Patterns
  {
    name: "Symbol Patterns",
    levels: [
      {
        question: "+ − + − ❓",
        options: ["+", "−", "="],
        answer: "+"
      },
      {
        question: "= ≠ = ≠ ❓",
        options: ["=", "≠", "<"],
        answer: "="
      },
      {
        question: "< > < > ❓",
        options: [">", "<", "="],
        answer: "<"
      }
    ]
  },

  // Game 7: Mixed Shapes Logic
  {
    name: "Shape Mix",
    levels: [
      {
        question: "🔺🟦🔺🟦❓",
        options: ["🔺", "🟦", "🟥"],
        answer: "🔺"
      },
      {
        question: "🔴🟢🔴🟢🔴❓",
        options: ["🟢", "🔴", "🔵"],
        answer: "🟢"
      },
      {
        question: "🟨🟥🟨🟥🟨❓",
        options: ["🟥", "🟨", "🟩"],
        answer: "🟥"
      }
    ]
  },

  // Game 8: Advanced Color/Grid Logic
  {
    name: "Advanced Patterns",
    levels: [
      {
        question: "⬜⬛⬜⬛❓",
        options: ["⬜", "⬛", "⬤"],
        answer: "⬜"
      },
      {
        question: "🟥🟨🟥🟨🟥❓",
        options: ["🟨", "🟥", "🟩"],
        answer: "🟨"
      },
      {
        question: "🟪⬛🟪⬛🟪❓",
        options: ["⬛", "🟪", "⬜"],
        answer: "⬛"
      }
    ]
  }
];

// === Game Logic ===

startButton.addEventListener("click", () => {
  const name = playerNameInput.value.trim();
  if (!name) {
    alert("Please enter your name!");
    return;
  }
  // Sanitize player name (remove HTML tags) and capitalize first letter
  let sanitized = name.replace(/[<>"'&]/g, '');
  if (!sanitized) {
    alert("Please enter a valid name!");
    return;
  }
  // Capitalize first letter
  playerName = sanitized.charAt(0).toUpperCase() + sanitized.slice(1);
  
  // Reset game state
  currentGame = 1;
  currentLevel = 0;
  score = 0; // Start with 0
  startTime = Date.now(); // Track start time
  
  startScreen.style.display = "none";
  gameScreen.style.display = "block";
  playerNameDisplay.textContent = `Hi ${playerName}! 👋`;
  scoreDisplay.textContent = `Score: ${score}`;
  loadLevel();
  showLeaderboard();
});

restartButton.addEventListener("click", () => {
  currentGame = 1;
  currentLevel = 0;
  score = 0;
  startTime = Date.now(); // Reset start time
  scoreDisplay.textContent = `Score: ${score}`;
  finalMessage.textContent = "";
  endScreen.style.display = "none";
  gameScreen.style.display = "block";
  loadLevel();
  showLeaderboard();
});

// Front page button - return to start screen
frontPageButton.addEventListener("click", () => {
  endScreen.style.display = "none";
  startScreen.style.display = "block";
  playerNameInput.value = "";
  showLeaderboard();
});

// Exit button - return to start screen
exitButton.addEventListener("click", () => {
  if (confirm("Are you sure you want to exit? Your progress will be saved.")) {
    stopTimer(); // Stop the timer
    updateLeaderboard();
    gameScreen.style.display = "none";
    startScreen.style.display = "block";
    playerNameInput.value = "";
    showLeaderboard();
  }
});

nextButton.addEventListener("click", () => {
  currentLevel++;
  feedback.textContent = "";
  nextButton.style.display = "none";
  
  // Check if we finished all levels in current game
  if (currentLevel >= games[currentGame - 1].levels.length) {
    const completedGame = currentGame;
    currentGame++;
    currentLevel = 0;
    
    // Check if we finished all games
    if (currentGame > games.length) {
      endGame();
      return;
    }
    
    // Show congratulations message for completing a game
    showGameCompletionMessage(completedGame);
    return;
  }
  
  loadLevel();
});

function loadLevel() {
  const game = games[currentGame - 1];
  const level = game.levels[currentLevel];
  
  // Update game and level display
  gameDisplay.textContent = `Game ${currentGame}`;
  levelDisplay.textContent = `Level ${currentLevel + 1}`;
  
  // Update progress bar
  updateProgressBar();
  
  // Reset stars for new level
  if (currentLevel === 0) {
    resetStars();
  }
  
  // Show encouraging message
  showEncouragingMessage();
  
  // Start timer for this level
  startTimer();
  
  patternDiv.innerText = level.question;
  patternDiv.classList.add("animate");
  setTimeout(() => patternDiv.classList.remove("animate"), 500);

  // Shuffle the options randomly
  const shuffledOptions = shuffleArray(level.options);
  
  optionsDiv.innerHTML = "";
  shuffledOptions.forEach(option => {
    const btn = document.createElement("button");
    btn.textContent = option;
    btn.addEventListener("click", () => checkAnswer(option, btn));
    optionsDiv.appendChild(btn);
  });
}

function checkAnswer(selected, button) {
  // Stop the timer
  stopTimer();
  
  const game = games[currentGame - 1];
  const level = game.levels[currentLevel];
  const correct = level.answer;

  const buttons = optionsDiv.querySelectorAll("button");
  buttons.forEach(btn => btn.disabled = true);

  if (selected === correct) {
    button.classList.add("clicked-correct");
    feedback.textContent = "✅ Correct! +1";
    feedback.style.color = "#4CAF50";
    // Play sound with error handling
    correctSound.play().catch(err => console.warn('Could not play correct sound:', err));
    score++; // Add 1 for correct answer
    
    // Celebrate with stars and encouraging message
    updateStars(true);
    showEncouragingMessage();
    
    // Mini confetti for correct answer
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  } else {
    button.classList.add("clicked-wrong");
    feedback.textContent = "❌ Wrong! -1";
    feedback.style.color = "#f44336";
    // Play sound with error handling
    wrongSound.play().catch(err => console.warn('Could not play wrong sound:', err));
    score = Math.max(0, score - 1); // Subtract 1 for wrong answer, don't go below 0
  }

  scoreDisplay.textContent = `Score: ${score}`;
  nextButton.style.display = "inline-block";
}

// Show game completion message
function showGameCompletionMessage(completedGameNum) {
  const nextGameNum = completedGameNum + 1;
  const nextGameName = games[completedGameNum].name;
  
  // Play game completion sound
  gameCompleteSound.play().catch(err => console.warn('Could not play game complete sound:', err));
  
  // BIG CONFETTI CELEBRATION!
  celebrateWithConfetti();
  
  feedback.textContent = `🎉 Congratulations! You finished Game ${completedGameNum}!`;
  feedback.style.color = "#4CAF50";
  feedback.style.fontSize = "24px";
  feedback.style.fontWeight = "bold";
  
  // Show continue button
  const continueBtn = document.createElement("button");
  continueBtn.textContent = `Continue to Game ${nextGameNum}: ${nextGameName} ➡️`;
  continueBtn.className = "continue-game-btn";
  continueBtn.style.marginTop = "20px";
  continueBtn.style.padding = "15px 30px";
  continueBtn.style.fontSize = "18px";
  continueBtn.style.cursor = "pointer";
  continueBtn.style.border = "none";
  continueBtn.style.borderRadius = "8px";
  continueBtn.style.background = "#ff6b35";
  continueBtn.style.color = "white";
  continueBtn.style.fontWeight = "bold";
  
  continueBtn.addEventListener("click", () => {
    feedback.textContent = "";
    feedback.style.color = "";
    feedback.style.fontSize = "";
    continueBtn.remove();
    loadLevel();
  });
  
  // Clear pattern and options
  patternDiv.textContent = "";
  optionsDiv.innerHTML = "";
  optionsDiv.appendChild(continueBtn);
}

function endGame() {
  gameScreen.style.display = "none";
  endScreen.style.display = "block";
  finalMessage.textContent = `Well done, ${playerName}! Your final score is ${score}.`;

  updateLeaderboard();
  showLeaderboard();
}

// Initialize leaderboard on page load
showLeaderboard();
