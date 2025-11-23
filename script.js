const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score-display');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreEl = document.getElementById('final-score');


let isPlaying = false;
let score = 0;
let speed = 0; 
let tiles = [];
let laneCount = 4;
let tileHeight = 150; 
let laneWidth = 0;
let animationId;
let lastTime = 0;
let startTileClicked = false;


let audioCtx;
let noteIndex = 0;


const songs = {
    ode_to_joy: [
        329.63, 329.63, 349.23, 392.00, 392.00, 349.23, 329.63, 293.66, // E E F G G F E D
        261.63, 261.63, 293.66, 329.63, 329.63, 293.66, 293.66,         // C C D E E D D
        329.63, 329.63, 349.23, 392.00, 392.00, 349.23, 329.63, 293.66, // E E F G G F E D
        261.63, 261.63, 293.66, 329.63, 293.66, 261.63, 261.63          // C C D E D C C
    ],
    fur_elise: [
        659.25, 622.25, 659.25, 622.25, 659.25, 493.88, 587.33, 523.25, 440.00, // E D# E D# E B D C A
        261.63, 329.63, 440.00, 493.88,                                         // C E A B
        329.63, 415.30, 493.88, 523.25,                                         // E G# B C
        329.63, 659.25, 622.25, 659.25, 622.25, 659.25, 493.88, 587.33, 523.25, 440.00 // E D# E D# E B D C A
    ],
    canon_d: [
        587.33, 440.00, 493.88, 369.99, 392.00, 293.66, 392.00, 440.00, // D A B F# G D G A
        587.33, 440.00, 493.88, 369.99, 392.00, 293.66, 392.00, 440.00  // D A B F# G D G A
    ],
    twinkle: [
        261.63, 261.63, 392.00, 392.00, 440.00, 440.00, 392.00, // C C G G A A G
        349.23, 349.23, 329.63, 329.63, 293.66, 293.66, 261.63, // F F E E D D C
        392.00, 392.00, 349.23, 349.23, 329.63, 329.63, 293.66, // G G F F E E D
        392.00, 392.00, 349.23, 349.23, 329.63, 329.63, 293.66  // G G F F E E D
    ]
};

let currentMelody = songs.ode_to_joy;

function initAudio() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function playNote() {
    if (!audioCtx) initAudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    const freq = currentMelody[noteIndex % currentMelody.length];
    noteIndex++;

    osc.frequency.value = freq;
    osc.type = 'sine';

    gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
}

function playFailSound() {
    if (!audioCtx) initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 100;
    osc.type = 'sawtooth';
    gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
}

function resize() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    laneWidth = canvas.width / laneCount;
    tileHeight = canvas.height / 4; 
}
window.addEventListener('resize', resize);
resize();

function spawnTile(yPosition) {
    const lane = Math.floor(Math.random() * laneCount);
    tiles.push({
        lane: lane,
        y: yPosition,
        clicked: false,
        color: '#000',
        failed: false
    });
}

function initGame() {
    
    const songSelect = document.getElementById('song-select');
    const selectedSong = songSelect ? songSelect.value : 'ode_to_joy';
    currentMelody = songs[selectedSong];

    tiles = [];
    
    for (let i = 0; i < 6; i++) {
        spawnTile(canvas.height - (i * tileHeight) - tileHeight);
    }

    isPlaying = false;
    startTileClicked = false;
    score = 0;
    speed = 5; 
    noteIndex = 0;
    scoreEl.innerText = score;

    tiles[0].isStart = true;
}

function update() {
    if (!startTileClicked) return;

    
    const difficultyMultiplier = Math.floor(score / 10);
    speed = 5 + (difficultyMultiplier * 0.5);
    if (speed > 20) speed = 20; 

    
    tiles.forEach(tile => {
        tile.y += speed;
    });

    
    if (tiles.length > 0 && tiles[0].y > canvas.height) {
        if (tiles[0].clicked) {
            tiles.shift();
            
            const highestY = tiles[tiles.length - 1].y;
            spawnTile(highestY - tileHeight);
        } else {
            
            gameOver(tiles[0]);
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (let i = 1; i < laneCount; i++) {
        ctx.beginPath();
        ctx.moveTo(i * laneWidth, 0);
        ctx.lineTo(i * laneWidth, canvas.height);
        ctx.stroke();
    }

    
    tiles.forEach(tile => {
        const x = tile.lane * laneWidth;
        const y = tile.y;

        if (tile.clicked) {
            ctx.fillStyle = 'rgba(200, 200, 200, 0.5)'; 
        } else if (tile.failed) {
            ctx.fillStyle = '#ff0000'; 
        } else {
            ctx.fillStyle = tile.color;
        }

        ctx.fillRect(x, y, laneWidth, tileHeight);

        
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(x, y, laneWidth, tileHeight);

        if (tile.isStart && !startTileClicked) {
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 24px Roboto Mono';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText("START", x + laneWidth / 2, y + tileHeight / 2);
        }
    });

    if (isPlaying || !startTileClicked) {
        animationId = requestAnimationFrame(() => {
            if (startTileClicked) update();
            draw();
        });
    }
}

function handleTap(x, y) {
    if (!isPlaying && startTileClicked) return; 

    const lane = Math.floor(x / laneWidth);

    
    const targetTile = tiles[0];

    
    const hitTile = x >= targetTile.lane * laneWidth &&
        x < (targetTile.lane + 1) * laneWidth &&
        y >= targetTile.y &&
        y < targetTile.y + tileHeight;

    if (hitTile && !targetTile.clicked) {
        
        targetTile.clicked = true;
        playNote();
        score++;
        scoreEl.innerText = score;

        if (!startTileClicked) {
            startTileClicked = true;
            isPlaying = true;
        }
    } else {
        
        if (!startTileClicked) return;
        playFailSound();
        gameOver(null, lane, y);
    }
}

function gameOver(missedTile, tapLane, tapY) {
    isPlaying = false;
    cancelAnimationFrame(animationId);

    if (missedTile) {
        missedTile.failed = true;
    } else if (tapLane !== undefined) {
        
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(tapLane * laneWidth, tapY - tileHeight / 2, laneWidth, tileHeight); 
    }

    
    draw();

    setTimeout(() => {
        finalScoreEl.innerText = score;
        gameOverScreen.classList.add('active');
    }, 500);
}

function startGame() {
    startScreen.classList.remove('active');
    gameOverScreen.classList.remove('active');
    initGame();
    draw();
}


canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    for (let i = 0; i < e.touches.length; i++) {
        const x = e.touches[i].clientX - rect.left;
        const y = e.touches[i].clientY - rect.top;
        handleTap(x, y);
    }
}, { passive: false });

canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    handleTap(x, y);
});

document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('restart-btn').addEventListener('click', startGame);

