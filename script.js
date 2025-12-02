/**
 * Neon Void - Game Logic
 */

// --- Configuration ---
const CONFIG = {
    playerSpeed: 7,
    baseObstacleSpeed: 3,
    obstacleSpawnRate: 60, // Frames between spawns
    speedIncreaseRate: 0.1, // Speed increase per obstacle cleared
    colors: ['#00f3ff', '#ff00ff', '#00ff66', '#ffcc00']
};

// --- DOM Elements ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const currentScoreEl = document.getElementById('currentScore');
const finalScoreEl = document.getElementById('finalScoreDisplay');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const highScoreScreen = document.getElementById('highScoreScreen');
const highScoreList = document.getElementById('highScoreList');
const newHighScoreSection = document.getElementById('newHighScoreSection');
const regularGameOverActions = document.getElementById('regularGameOverActions');
const playerNameInput = document.getElementById('playerNameInput');

// --- Game State ---
let state = {
    isPlaying: false,
    score: 0,
    frames: 0,
    gameSpeed: CONFIG.baseObstacleSpeed,
    obstacles: [],
    player: {
        x: 0,
        y: 0,
        width: 30,
        height: 30,
        color: '#fff',
        dx: 0
    },
    keys: {
        left: false,
        right: false
    }
};

// --- Initialization ---
function init() {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Input Listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Touch Controls
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);

    // Button Listeners
    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('restartBtn').addEventListener('click', startGame);
    document.getElementById('menuBtn').addEventListener('click', showMainMenu);
    document.getElementById('showScoresBtn').addEventListener('click', showHighScores);
    document.getElementById('closeScoresBtn').addEventListener('click', showMainMenu);
    document.getElementById('saveScoreBtn').addEventListener('click', submitHighScore);

    // Initial Render
    drawBackground();
}

function resizeCanvas() {
    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;

    // Reset player position on resize
    state.player.y = canvas.height - 100;
    state.player.x = canvas.width / 2 - state.player.width / 2;
}

// --- Game Loop ---
function startGame() {
    state.isPlaying = true;
    state.score = 0;
    state.frames = 0;
    state.gameSpeed = CONFIG.baseObstacleSpeed;
    state.obstacles = [];
    state.player.x = canvas.width / 2 - state.player.width / 2;
    state.player.dx = 0;

    // Hide overlays
    startScreen.classList.remove('active');
    gameOverScreen.classList.remove('active');
    highScoreScreen.classList.remove('active');

    currentScoreEl.innerText = '0';

    requestAnimationFrame(gameLoop);
}

function gameLoop() {
    if (!state.isPlaying) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    update();
    draw();

    state.frames++;
    requestAnimationFrame(gameLoop);
}

function update() {
    // 1. Update Player
    if (state.keys.left && state.player.x > 0) {
        state.player.x -= CONFIG.playerSpeed;
    }
    if (state.keys.right && state.player.x < canvas.width - state.player.width) {
        state.player.x += CONFIG.playerSpeed;
    }

    // 2. Spawn Obstacles
    if (state.frames % Math.max(20, CONFIG.obstacleSpawnRate - Math.floor(state.score / 100)) === 0) {
        spawnObstacle();
    }

    // 3. Update Obstacles
    for (let i = 0; i < state.obstacles.length; i++) {
        let obs = state.obstacles[i];
        obs.y += state.gameSpeed;

        // Collision Detection
        if (
            state.player.x < obs.x + obs.width &&
            state.player.x + state.player.width > obs.x &&
            state.player.y < obs.y + obs.height &&
            state.player.y + state.player.height > obs.y
        ) {
            gameOver();
        }

        // Remove off-screen obstacles & Score
        if (obs.y > canvas.height) {
            state.obstacles.splice(i, 1);
            i--;
            state.score += 10;
            currentScoreEl.innerText = state.score;

            // Increase difficulty
            state.gameSpeed += CONFIG.speedIncreaseRate;
        }
    }
}

function draw() {
    // Draw Player (Glowing Orb/Ship)
    ctx.shadowBlur = 20;
    ctx.shadowColor = CONFIG.colors[0];
    ctx.fillStyle = '#fff';

    // Simple Triangle Ship
    ctx.beginPath();
    ctx.moveTo(state.player.x + state.player.width / 2, state.player.y);
    ctx.lineTo(state.player.x + state.player.width, state.player.y + state.player.height);
    ctx.lineTo(state.player.x, state.player.y + state.player.height);
    ctx.closePath();
    ctx.fill();

    // Draw Obstacles
    for (let obs of state.obstacles) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = obs.color;
        ctx.fillStyle = obs.color;
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
    }

    // Reset shadow for performance
    ctx.shadowBlur = 0;
}

function spawnObstacle() {
    const width = Math.random() * 40 + 20;
    const x = Math.random() * (canvas.width - width);
    const color = CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)];

    state.obstacles.push({
        x: x,
        y: -50,
        width: width,
        height: 20,
        color: color
    });
}

function drawBackground() {
    // Simple static background render for menu
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// --- Game Over & High Scores ---
function gameOver() {
    state.isPlaying = false;
    finalScoreEl.innerText = state.score;

    const isHigh = isHighScore(state.score);

    if (isHigh) {
        newHighScoreSection.classList.remove('hidden');
        regularGameOverActions.classList.add('hidden');
        playerNameInput.value = '';
        playerNameInput.focus();
    } else {
        newHighScoreSection.classList.add('hidden');
        regularGameOverActions.classList.remove('hidden');
    }

    gameOverScreen.classList.add('active');
}

function getHighScores() {
    const scores = localStorage.getItem('neonVoidScores');
    return scores ? JSON.parse(scores) : [];
}

function isHighScore(score) {
    const scores = getHighScores();
    if (scores.length < 10) return true;
    return score > scores[scores.length - 1].score;
}

function submitHighScore() {
    const name = playerNameInput.value.trim() || 'Anonymous';
    const newScore = { name: name, score: state.score };

    let scores = getHighScores();
    scores.push(newScore);
    scores.sort((a, b) => b.score - a.score);
    scores = scores.slice(0, 10);

    localStorage.setItem('neonVoidScores', JSON.stringify(scores));

    // Transition to regular game over view
    newHighScoreSection.classList.add('hidden');
    regularGameOverActions.classList.remove('hidden');

    // Show high scores immediately
    showHighScores();
}

function showHighScores() {
    startScreen.classList.remove('active');
    gameOverScreen.classList.remove('active');
    highScoreScreen.classList.add('active');

    const scores = getHighScores();
    highScoreList.innerHTML = scores.map((s, i) => `
        <li>
            <span>${i + 1}. ${s.name}</span>
            <span>${s.score}</span>
        </li>
    `).join('');

    if (scores.length === 0) {
        highScoreList.innerHTML = '<li style="text-align:center; display:block; color:#666;">No scores yet. Be the first!</li>';
    }
}

function showMainMenu() {
    highScoreScreen.classList.remove('active');
    gameOverScreen.classList.remove('active');
    startScreen.classList.add('active');
    drawBackground();
}

// --- Input Handling ---
function handleKeyDown(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a') state.keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd') state.keys.right = true;
}

function handleKeyUp(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a') state.keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd') state.keys.right = false;
}

// Touch handling (simple tap left/right side of screen)
function handleTouchStart(e) {
    e.preventDefault();
    const touchX = e.touches[0].clientX;
    const centerX = window.innerWidth / 2;

    if (touchX < centerX) {
        state.keys.left = true;
        state.keys.right = false;
    } else {
        state.keys.right = true;
        state.keys.left = false;
    }
}

function handleTouchMove(e) {
    e.preventDefault();
    const touchX = e.touches[0].clientX;
    const centerX = window.innerWidth / 2;

    if (touchX < centerX) {
        state.keys.left = true;
        state.keys.right = false;
    } else {
        state.keys.right = true;
        state.keys.left = false;
    }
}

function handleTouchEnd(e) {
    state.keys.left = false;
    state.keys.right = false;
}

// Start
init();
