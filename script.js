// Game State
const gameState = {
    cards: [],
    flipped: [],
    matched: [],
    moves: 0,
    matches: 0,
    gameActive: true,
    gamePaused: false,
    startTime: null,
    pausedTime: 0,
    difficulty: 'easy',
    leaderboard: JSON.parse(localStorage.getItem('memoryLeaderboard')) || []
};

// Emoji sets for different levels
const EMOJI_SETS = {
    easy: ['🚀', '🎮', '🎨', '🎭'],
    medium: ['🚀', '🎮', '🎨', '🎭', '🎪', '🎯', '🎲', '🎳', '🌟', '🍕', '🍔', '🍰', '🎂', '🎉', '🎊', '🎈'],
    hard: ['🚀', '🎮', '🎨', '🎭', '🎪', '🎯', '🎲', '🎳', '🌟', '🍕', '🍔', '🍰', '🎂', '🎉', '🎊', '🎈', '🏆', '🌈', '⭐', '🔥', '💎', '🌺', '🦋', '🐢', '🐘', '🦁', '🐯', '🦅', '🐉', '🦄', '🌸', '🌻', '🌷', '🌹', '🥀', '🎀']
};

// Cache DOM Elements
const DOM = {
    gameBoard: document.getElementById('gameBoard'),
    moveCount: document.getElementById('moveCount'),
    matchCount: document.getElementById('matchCount'),
    timerDisplay: document.getElementById('timer'),
    difficultyDisplay: document.getElementById('difficulty'),
    gameOverModal: document.getElementById('gameOverModal'),
    pauseModal: document.getElementById('pauseModal'),
    leaderboard: document.getElementById('leaderboard'),
    finalStats: document.getElementById('finalStats'),
    pauseBtn: document.getElementById('pauseBtn')
};

let timerInterval = null;

function setDifficulty(difficulty) {
    gameState.difficulty = difficulty;
    DOM.difficultyDisplay.textContent = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
    
    document.querySelectorAll('.difficulty-btn').forEach(btn => 
        btn.classList.toggle('active', btn === event.target.closest('.difficulty-btn'))
    );
    
    resetGame();
}

function initializeGame() {
    const emojis = EMOJI_SETS[gameState.difficulty];
    Object.assign(gameState, {
        cards: shuffle([...emojis, ...emojis]),
        flipped: [],
        matched: [],
        moves: 0,
        matches: 0,
        gameActive: true,
        gamePaused: false,
        pausedTime: 0,
        startTime: Date.now()
    });

    updateStats();
    renderBoard();
    startTimer();
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function renderBoard() {
    DOM.gameBoard.className = `game-board ${gameState.difficulty}`;
    
    const fragment = document.createDocumentFragment();
    gameState.cards.forEach((emoji, index) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.index = index;
        card.innerHTML = `
            <div class="card-inner">
                <div class="card-front"><i class="fas fa-star-of-life"></i></div>
                <div class="card-back">${emoji}</div>
            </div>
        `;
        card.addEventListener('click', () => flipCard(index, card));
        fragment.appendChild(card);
    });
    
    DOM.gameBoard.innerHTML = '';
    DOM.gameBoard.appendChild(fragment);
}

function flipCard(index, cardElement) {
    const { gameActive, gamePaused, flipped, matched } = gameState;
    
    if (!gameActive || gamePaused || flipped.includes(index) || 
        matched.includes(index) || flipped.length >= 2) return;

    flipped.push(index);
    cardElement.classList.add('flipped');

    if (flipped.length === 2) {
        gameState.moves++;
        updateStats();
        checkForMatch();
    }
}

function checkForMatch() {
    const [firstIndex, secondIndex] = gameState.flipped;
    const isMatch = gameState.cards[firstIndex] === gameState.cards[secondIndex];

    if (isMatch) {
        gameState.matched.push(firstIndex, secondIndex);
        gameState.matches++;
        updateStats();
        createParticles(firstIndex, secondIndex);
        
        const cards = [firstIndex, secondIndex].map(i => 
            document.querySelector(`[data-index="${i}"]`)
        );
        cards.forEach(card => card.classList.add('matched'));
        
        gameState.flipped = [];

        if (gameState.matched.length === gameState.cards.length) {
            endGame();
        }
    } else {
        setTimeout(() => {
            [firstIndex, secondIndex].forEach(i => {
                document.querySelector(`[data-index="${i}"]`).classList.remove('flipped');
            });
            gameState.flipped = [];
        }, 1000);
    }
}

function createParticles(firstIndex, secondIndex) {
    [firstIndex, secondIndex].forEach(index => {
        const card = document.querySelector(`[data-index="${index}"]`);
        const rect = card.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        for (let i = 0; i < 6; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.textContent = '✨';
            Object.assign(particle.style, {
                left: centerX + 'px',
                top: centerY + 'px',
                color: '#' + Math.floor(Math.random() * 16777215).toString(16),
                '--tx': (Math.random() - 0.5) * 200 + 'px',
                '--ty': (Math.random() - 0.5) * 200 + 'px'
            });

            document.body.appendChild(particle);
            setTimeout(() => particle.remove(), 2000);
        }
    });
}

function updateStats() {
    DOM.moveCount.textContent = gameState.moves;
    DOM.matchCount.textContent = gameState.matches;
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getElapsedTime() {
    return Math.floor((Date.now() - gameState.startTime + gameState.pausedTime) / 1000);
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
        if (!gameState.gamePaused) {
            DOM.timerDisplay.textContent = formatTime(getElapsedTime());
        }
    }, 100);
}

function stopTimer() {
    if (timerInterval) clearInterval(timerInterval);
}

function pauseGame() {
    gameState.gamePaused = true;
    gameState.pausedTime = Date.now() - gameState.startTime + gameState.pausedTime;
    stopTimer();
    DOM.pauseModal.showModal();
}

function resumeGame() {
    gameState.gamePaused = false;
    gameState.startTime = Date.now();
    DOM.pauseModal.close();
    startTimer();
}

function endGame() {
    gameState.gameActive = false;
    stopTimer();

    const elapsed = getElapsedTime();
    const timeString = formatTime(elapsed);

    const record = {
        difficulty: gameState.difficulty,
        time: elapsed,
        moves: gameState.moves,
        timeString,
        date: new Date().toLocaleDateString()
    };

    gameState.leaderboard = [...gameState.leaderboard, record]
        .sort((a, b) => a.time - b.time)
        .slice(0, 5);
    
    localStorage.setItem('memoryLeaderboard', JSON.stringify(gameState.leaderboard));
    updateLeaderboard();

    DOM.finalStats.innerHTML = `
        Time: <span class="font-bold text-yellow-400">${timeString}</span><br>
        Moves: <span class="font-bold text-yellow-400">${gameState.moves}</span><br>
        Level: <span class="font-bold text-yellow-400">${gameState.difficulty.toUpperCase()}</span>
    `;
    DOM.gameOverModal.showModal();
}

function updateLeaderboard() {
    if (gameState.leaderboard.length === 0) {
        DOM.leaderboard.innerHTML = '<div class="opacity-60">No records yet. Play to set your best time!</div>';
        return;
    }

    const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
    DOM.leaderboard.innerHTML = gameState.leaderboard.map((record, index) => `
        <div class="flex justify-between items-center p-2 bg-white bg-opacity-5 rounded-lg">
            <span>${medals[index]} ${record.difficulty.toUpperCase()}</span>
            <span class="font-bold">${record.timeString}</span>
            <span class="text-xs opacity-70">${record.moves} moves</span>
        </div>
    `).join('');
}

function resetGame() {
    stopTimer();
    initializeGame();
    DOM.pauseBtn.innerHTML = '<i class="fas fa-pause mr-2"></i>Pause';
}

// Initialize
updateLeaderboard();
initializeGame();
