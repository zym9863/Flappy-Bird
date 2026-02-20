const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const title = document.getElementById('title');
const startBtn = document.getElementById('startBtn');
const scoreText = document.getElementById('scoreText');
const currentScoreElement = document.getElementById('currentScore');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreElement = document.getElementById('finalScore');
const restartBtn = document.getElementById('restartBtn');

// Game constants
const GRAVITY = 0.25;
const FLAP_SPEED = -5.5;
const PIPE_WIDTH = 52;
const PIPE_SPACING = 140; // Vertical space between top and bottom pipe
const PIPE_SPEED = 2.5;
const BIRD_RADIUS = 12;

// Game state variables
let bird;
let pipes = [];
let score = 0;
let frames = 0;
let gameState = 'START'; // START, PLAYING, GAMEOVER
let animationId;

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

        // Calculate rotation based on velocity
        this.rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (this.velocity * 0.1)));
        ctx.rotate(this.rotation);

        // Body
        ctx.fillStyle = '#f1c40f'; // Yellow bird
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
        // Flapping animation based on frames if playing, or fixed if start/gameover
        let wingY = (gameState === 'PLAYING' && frames % 10 < 5) ? 2 : 0;
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
        // Ensure pipe height is reasonable
        let minHeight = 50;
        let maxHeight = canvas.height - 20 - PIPE_SPACING - minHeight;
        this.topHeight = Math.random() * (maxHeight - minHeight) + minHeight;
        this.bottomY = this.topHeight + PIPE_SPACING;
        this.width = PIPE_WIDTH;
        this.passed = false;
    }

    draw() {
        ctx.fillStyle = '#2ecc71'; // Green pipes
        ctx.strokeStyle = '#27ae60';
        ctx.lineWidth = 2;

        // Top pipe
        ctx.fillRect(this.x, 0, this.width, this.topHeight);
        ctx.strokeRect(this.x, 0, this.width, this.topHeight);
        // Top pipe cap
        ctx.fillRect(this.x - 2, this.topHeight - 20, this.width + 4, 20);
        ctx.strokeRect(this.x - 2, this.topHeight - 20, this.width + 4, 20);

        // Bottom pipe
        let bottomHeight = canvas.height - 20 - this.bottomY;
        ctx.fillRect(this.x, this.bottomY, this.width, bottomHeight);
        ctx.strokeRect(this.x, this.bottomY, this.width, bottomHeight);
        // Bottom pipe cap
        ctx.fillRect(this.x - 2, this.bottomY, this.width + 4, 20);
        ctx.strokeRect(this.x - 2, this.bottomY, this.width + 4, 20);
    }

    update() {
        this.x -= PIPE_SPEED;
    }
}

function drawBackground() {
    // Sky gradient (could do this once, but simple enough to redraw)
    let grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
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

    // Ground outline
    ctx.fillStyle = '#ded895';
    ctx.fillRect(0, canvas.height - 20, canvas.width, 20);
    ctx.strokeStyle = '#c6bf75';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 20);
    ctx.lineTo(canvas.width, canvas.height - 20);
    ctx.stroke();

    // Ground stripes to show movement
    ctx.strokeStyle = '#b5ac6a';
    ctx.lineWidth = 3;
    let offset = (frames * PIPE_SPEED) % 20;
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
    currentScoreElement.innerText = score;
    drawBackground();
    bird.draw();
}

function startGame() {
    gameState = 'PLAYING';
    title.classList.add('hidden');
    startBtn.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    scoreText.style.display = 'block';

    init();
    bird.flap();

    if (animationId) cancelAnimationFrame(animationId);
    gameLoop();
}

function gameOver() {
    gameState = 'GAMEOVER';
    finalScoreElement.innerText = score;
    scoreText.style.display = 'none';
    gameOverScreen.classList.remove('hidden');
}

function checkCollision(pipe) {
    // Check horizontal overlap
    if (bird.x + bird.radius - 2 > pipe.x && bird.x - bird.radius + 2 < pipe.x + pipe.width) {
        // Check vertical overlap (top pipe or bottom pipe)
        if (bird.y - bird.radius + 2 < pipe.topHeight || bird.y + bird.radius - 2 > pipe.bottomY) {
            return true;
        }
    }
    return false;
}

function updateGame() {
    // We redraw everything in drawBackground
    drawBackground();

    // Add new pipes
    if (frames % 90 === 0) {
        pipes.push(new Pipe());
    }

    // Update and draw pipes
    for (let i = 0; i < pipes.length; i++) {
        let p = pipes[i];
        p.update();
        p.draw();

        // Check collision
        if (checkCollision(p)) {
            gameOver();
            // Optional: draw hit effect
            ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Score update
        if (p.x + p.width < bird.x - bird.radius && !p.passed) {
            score++;
            currentScoreElement.innerText = score;
            p.passed = true;
        }

        // Remove off-screen pipes
        if (p.x + p.width < 0) {
            pipes.splice(i, 1);
            i--;
        }
    }

    // Draw and update bird last so it appears in front of pipes
    bird.update();
    bird.draw();

    frames++;
}

function gameLoop() {
    if (gameState === 'PLAYING') {
        updateGame();
        animationId = requestAnimationFrame(gameLoop);
    }
}

// Input handling
function handleInput(e) {
    if (gameState === 'START' || gameState === 'GAMEOVER') {
        // DO NOT start the game directly here to avoid conflict with button clicks
    } else if (gameState === 'PLAYING') {
        bird.flap();
    }
}

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        // Prevent page scrolling on space bar
        if (e.code === 'Space') e.preventDefault();

        if (gameState === 'PLAYING') {
            bird.flap();
        } else if (gameState === 'START' || gameState === 'GAMEOVER') {
            // Can start game with spacebar
            startGame();
        }
    }
});

canvas.addEventListener('mousedown', (e) => {
    if (gameState === 'PLAYING') {
        bird.flap();
    }
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameState === 'PLAYING') {
        bird.flap();
    }
});

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// Initial setup
// Ensure font is loaded before first draw
document.fonts.ready.then(() => {
    init();
});
