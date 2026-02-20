const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const startPanel = document.getElementById('startPanel');
const title = document.getElementById('title');
const startBtn = document.getElementById('startBtn');
const scoreText = document.getElementById('scoreText');
const currentScoreElement = document.getElementById('currentScore');
const bestScoreElement = document.getElementById('bestScore');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreElement = document.getElementById('finalScore');
const finalBestScoreElement = document.getElementById('finalBestScore');
const restartBtn = document.getElementById('restartBtn');
const statusLine = document.getElementById('statusLine');

// Game constants
const GRAVITY = 0.25;
const FLAP_SPEED = -5.5;
const PIPE_WIDTH = 52;
const PIPE_SPACING = 140;
const PIPE_SPEED = 2.5;
const BIRD_RADIUS = 12;

// Game state variables
let bird;
let pipes = [];
let score = 0;
let frames = 0;
let gameState = 'START'; // START, PLAYING, GAMEOVER
let animationId;
let bestScore = loadBestScore();

function loadBestScore() {
    try {
        const value = Number(localStorage.getItem('flappy_best_score') || 0);
        return Number.isFinite(value) ? value : 0;
    } catch (error) {
        return 0;
    }
}

function saveBestScore() {
    try {
        localStorage.setItem('flappy_best_score', String(bestScore));
    } catch (error) {
        // Ignore when storage is unavailable.
    }
}

function syncScoreUI() {
    currentScoreElement.innerText = score;
    bestScoreElement.innerText = bestScore;
    finalBestScoreElement.innerText = bestScore;
}

function setUIState(state) {
    gameState = state;

    if (state === 'START') {
        startPanel.classList.remove('hidden');
        gameOverScreen.classList.add('hidden');
        title.classList.remove('hidden');
        scoreText.classList.remove('active');
        statusLine.innerText = '准备起飞';
        return;
    }

    if (state === 'PLAYING') {
        startPanel.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
        scoreText.classList.add('active');
        statusLine.innerText = '飞行中 · 空格 / ↑ / 点击振翅';
        return;
    }

    startPanel.classList.add('hidden');
    gameOverScreen.classList.remove('hidden');
    scoreText.classList.add('active');
    statusLine.innerText = '撞上障碍了，准备再战';
}

// Bird object
class Bird {
    constructor() {
        this.x = 60;
        this.y = canvas.height / 2;
        this.velocity = 0;
        this.radius = BIRD_RADIUS;
        this.rotation = 0;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Rotate with velocity for a smoother flight posture.
        this.rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, this.velocity * 0.1));
        ctx.rotate(this.rotation);

        // Body
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Eye
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(4, -4, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(5, -4, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Wing
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        const wingY = gameState === 'PLAYING' && frames % 10 < 5 ? 2 : 0;
        ctx.ellipse(-4, wingY, 6, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Beak
        ctx.fillStyle = '#e67e22';
        ctx.beginPath();
        ctx.moveTo(this.radius - 2, 0);
        ctx.lineTo(this.radius + 6, 3);
        ctx.lineTo(this.radius - 2, 6);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }

    update() {
        this.velocity += GRAVITY;
        this.y += this.velocity;

        // Floor collision
        if (this.y + this.radius >= canvas.height - 20) {
            this.y = canvas.height - 20 - this.radius;
            gameOver();
        }

        // Ceiling collision
        if (this.y - this.radius <= 0) {
            this.y = this.radius;
            this.velocity = 0;
        }
    }

    flap() {
        this.velocity = FLAP_SPEED;
    }
}

// Pipe object
class Pipe {
    constructor() {
        this.x = canvas.width;
        const minHeight = 50;
        const maxHeight = canvas.height - 20 - PIPE_SPACING - minHeight;
        this.topHeight = Math.random() * (maxHeight - minHeight) + minHeight;
        this.bottomY = this.topHeight + PIPE_SPACING;
        this.width = PIPE_WIDTH;
        this.passed = false;
    }

    draw() {
        ctx.fillStyle = '#2ecc71';
        ctx.strokeStyle = '#27ae60';
        ctx.lineWidth = 2;

        // Top pipe
        ctx.fillRect(this.x, 0, this.width, this.topHeight);
        ctx.strokeRect(this.x, 0, this.width, this.topHeight);
        ctx.fillRect(this.x - 2, this.topHeight - 20, this.width + 4, 20);
        ctx.strokeRect(this.x - 2, this.topHeight - 20, this.width + 4, 20);

        // Bottom pipe
        const bottomHeight = canvas.height - 20 - this.bottomY;
        ctx.fillRect(this.x, this.bottomY, this.width, bottomHeight);
        ctx.strokeRect(this.x, this.bottomY, this.width, bottomHeight);
        ctx.fillRect(this.x - 2, this.bottomY, this.width + 4, 20);
        ctx.strokeRect(this.x - 2, this.bottomY, this.width + 4, 20);
    }

    update() {
        this.x -= PIPE_SPEED;
    }
}

function drawBackground() {
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#70c5ce');
    grad.addColorStop(1, '#a1d8df');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.arc(100, 100, 20, 0, Math.PI * 2);
    ctx.arc(120, 100, 25, 0, Math.PI * 2);
    ctx.arc(140, 100, 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(250, 150, 15, 0, Math.PI * 2);
    ctx.arc(270, 150, 20, 0, Math.PI * 2);
    ctx.arc(290, 150, 15, 0, Math.PI * 2);
    ctx.fill();

    // Buildings silhouette
    ctx.fillStyle = '#a6dfb5';
    ctx.fillRect(50, canvas.height - 20 - 40, 30, 40);
    ctx.fillRect(90, canvas.height - 20 - 60, 40, 60);
    ctx.fillRect(150, canvas.height - 20 - 30, 25, 30);
    ctx.fillRect(200, canvas.height - 20 - 70, 45, 70);
    ctx.fillRect(270, canvas.height - 20 - 50, 35, 50);

    // Ground
    ctx.fillStyle = '#ded895';
    ctx.fillRect(0, canvas.height - 20, canvas.width, 20);
    ctx.strokeStyle = '#c6bf75';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 20);
    ctx.lineTo(canvas.width, canvas.height - 20);
    ctx.stroke();

    // Ground movement stripes
    ctx.strokeStyle = '#b5ac6a';
    ctx.lineWidth = 3;
    const offset = (frames * PIPE_SPEED) % 20;
    for (let i = -20; i < canvas.width; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i - offset, canvas.height - 20);
        ctx.lineTo(i - offset - 10, canvas.height);
        ctx.stroke();
    }
}

function init() {
    bird = new Bird();
    pipes = [];
    score = 0;
    frames = 0;
    syncScoreUI();
    drawBackground();
    bird.draw();
}

function startGame() {
    init();
    setUIState('PLAYING');
    bird.flap();

    if (animationId) {
        cancelAnimationFrame(animationId);
    }

    gameLoop();
}

function gameOver() {
    if (gameState !== 'PLAYING') {
        return;
    }

    if (score > bestScore) {
        bestScore = score;
        saveBestScore();
    }

    finalScoreElement.innerText = score;
    syncScoreUI();
    setUIState('GAMEOVER');
}

function checkCollision(pipe) {
    if (bird.x + bird.radius - 2 > pipe.x && bird.x - bird.radius + 2 < pipe.x + pipe.width) {
        if (bird.y - bird.radius + 2 < pipe.topHeight || bird.y + bird.radius - 2 > pipe.bottomY) {
            return true;
        }
    }
    return false;
}

function updateGame() {
    drawBackground();

    if (frames % 90 === 0) {
        pipes.push(new Pipe());
    }

    for (let i = 0; i < pipes.length; i++) {
        const p = pipes[i];
        p.update();
        p.draw();

        if (checkCollision(p)) {
            gameOver();
            ctx.fillStyle = 'rgba(255, 0, 0, 0.45)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            return;
        }

        if (p.x + p.width < bird.x - bird.radius && !p.passed) {
            score++;
            p.passed = true;

            if (score > bestScore) {
                bestScore = score;
                saveBestScore();
            }
            syncScoreUI();
        }

        if (p.x + p.width < 0) {
            pipes.splice(i, 1);
            i--;
        }
    }

    bird.update();
    bird.draw();

    frames++;
}

function gameLoop() {
    if (gameState !== 'PLAYING') {
        return;
    }

    updateGame();
    animationId = requestAnimationFrame(gameLoop);
}

function onActionInput() {
    if (gameState === 'PLAYING') {
        bird.flap();
    } else {
        startGame();
    }
}

window.addEventListener('keydown', (event) => {
    if (event.code !== 'Space' && event.code !== 'ArrowUp') {
        return;
    }

    if (event.code === 'Space') {
        event.preventDefault();
    }

    onActionInput();
});

canvas.addEventListener('mousedown', onActionInput);
canvas.addEventListener('touchstart', (event) => {
    event.preventDefault();
    onActionInput();
}, { passive: false });

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

function initialRender() {
    syncScoreUI();
    setUIState('START');
    init();
}

if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(initialRender).catch(initialRender);
} else {
    initialRender();
}
