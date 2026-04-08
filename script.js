/* ============================================
   NEON SNAKE GAME - GAME ENGINE
   Vanilla JavaScript with Canvas API
   Features: smooth movement, sound FX, levels,
   localStorage high score, touch & keyboard
   ============================================ */

// ─── Audio Manager ──────────────────────────
const AudioManager = {
  ctx: null,

  /** Lazily initialise AudioContext (requires user gesture) */
  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  },

  /**
   * Play a short synthesised beep / sound effect.
   * @param {'eat'|'die'|'level'} type - which sound to play
   */
  play(type) {
    this.init();
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    switch (type) {
      case 'eat':
        // Bright chirp
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
        break;

      case 'die':
        // Low rumble / buzz
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.5);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
        break;

      case 'level':
        // Quick ascending arpeggio
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.setValueAtTime(600, now + 0.08);
        osc.frequency.setValueAtTime(800, now + 0.16);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
    }
  }
};

// ─── Particle System (food eat effect) ──────
class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.size = Math.random() * 4 + 2;
    this.speedX = (Math.random() - 0.5) * 6;
    this.speedY = (Math.random() - 0.5) * 6;
    this.life = 1; // 1 → 0
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.life -= 0.04;
    this.size *= 0.96;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.life;
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// ─── Snake Game Class ───────────────────────
class SnakeGame {
  constructor() {
    // Canvas setup
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    // Grid configuration
    this.gridSize = 20;    // number of cells
    this.cellSize = 0;     // computed on resize

    // Game state
    this.snake = [];
    this.food = null;
    this.direction = 'right';
    this.nextDirection = 'right';
    this.score = 0;
    this.level = 1;
    this.highScore = parseInt(localStorage.getItem('snakeHighScore')) || 0;
    this.isRunning = false;
    this.isPaused = false;
    this.gameLoopId = null;
    this.lastTime = 0;
    this.accumulator = 0;

    // Particles
    this.particles = [];

    // Food animation
    this.foodPulse = 0;

    // DOM refs
    this.scoreEl = document.getElementById('score');
    this.highScoreEl = document.getElementById('highScore');
    this.levelEl = document.getElementById('level');
    this.startOverlay = document.getElementById('startOverlay');
    this.gameOverOverlay = document.getElementById('gameOverOverlay');
    this.pauseOverlay = document.getElementById('pauseOverlay');
    this.finalScoreEl = document.getElementById('finalScore');
    this.finalHighEl = document.getElementById('finalHigh');
    this.pauseBtn = document.getElementById('pauseBtn');
    this.restartBtn = document.getElementById('restartBtn');

    // Show stored high score
    this.highScoreEl.textContent = this.highScore;

    // Bind events
    this._bindKeyboard();
    this._bindTouch();
    this._handleResize();
    window.addEventListener('resize', () => this._handleResize());
  }

  /* ---------- Initialization ---------- */

  /** Resize canvas to match its CSS size (retina-aware) */
  _handleResize() {
    const wrapper = this.canvas.parentElement;
    const size = Math.min(wrapper.clientWidth, wrapper.clientHeight);
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = size * dpr;
    this.canvas.height = size * dpr;
    this.canvas.style.width = size + 'px';
    this.canvas.style.height = size + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.cellSize = size / this.gridSize;
  }

  /** Reset all game state for a new round */
  _resetState() {
    const mid = Math.floor(this.gridSize / 2);
    this.snake = [
      { x: mid, y: mid },
      { x: mid - 1, y: mid },
      { x: mid - 2, y: mid }
    ];
    this.direction = 'right';
    this.nextDirection = 'right';
    this.score = 0;
    this.level = 1;
    this.particles = [];
    this.accumulator = 0;
    this._updateUI();
    this._spawnFood();
  }

  /** Place food on a random empty cell */
  _spawnFood() {
    const occupied = new Set(this.snake.map(s => `${s.x},${s.y}`));
    let pos;
    do {
      pos = {
        x: Math.floor(Math.random() * this.gridSize),
        y: Math.floor(Math.random() * this.gridSize)
      };
    } while (occupied.has(`${pos.x},${pos.y}`));
    this.food = pos;
  }

  /* ---------- Controls ---------- */

  _bindKeyboard() {
    document.addEventListener('keydown', (e) => {
      const map = {
        ArrowUp: 'up', ArrowDown: 'down',
        ArrowLeft: 'left', ArrowRight: 'right',
        w: 'up', s: 'down', a: 'left', d: 'right'
      };
      if (map[e.key]) {
        e.preventDefault();
        this.setDirection(map[e.key]);
      }
      if (e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        if (this.isRunning) this.togglePause();
      }
    });
  }

  _bindTouch() {
    let startX, startY;
    const canvas = this.canvas;

    canvas.addEventListener('touchstart', (e) => {
      const t = e.touches[0];
      startX = t.clientX;
      startY = t.clientY;
    }, { passive: true });

    canvas.addEventListener('touchend', (e) => {
      if (!startX || !startY) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      const minSwipe = 30;

      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > minSwipe) {
        this.setDirection(dx > 0 ? 'right' : 'left');
      } else if (Math.abs(dy) > minSwipe) {
        this.setDirection(dy > 0 ? 'down' : 'up');
      }
      startX = startY = null;
    }, { passive: true });
  }

  /** Set next direction (prevent 180° reversal) */
  setDirection(dir) {
    const opposites = { up: 'down', down: 'up', left: 'right', right: 'left' };
    if (dir !== opposites[this.direction]) {
      this.nextDirection = dir;
    }
  }

  /* ---------- Game Flow ---------- */

  start() {
    AudioManager.init();
    this._resetState();
    this.isRunning = true;
    this.isPaused = false;
    this.startOverlay.classList.add('hidden');
    this.gameOverOverlay.classList.add('hidden');
    this.pauseOverlay.classList.add('hidden');
    this.pauseBtn.disabled = false;
    this.restartBtn.disabled = false;
    this.lastTime = performance.now();
    this._loop(this.lastTime);
  }

  restart() {
    cancelAnimationFrame(this.gameLoopId);
    this.start();
  }

  togglePause() {
    if (!this.isRunning) return;
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.pauseOverlay.classList.remove('hidden');
      this.pauseBtn.textContent = '▶ RESUME';
    } else {
      this.resume();
    }
  }

  resume() {
    this.isPaused = false;
    this.pauseOverlay.classList.add('hidden');
    this.pauseBtn.textContent = '⏸ PAUSE';
    this.lastTime = performance.now();
    this._loop(this.lastTime);
  }

  _gameOver() {
    this.isRunning = false;
    cancelAnimationFrame(this.gameLoopId);
    AudioManager.play('die');

    // Shake effect
    const wrapper = this.canvas.parentElement;
    wrapper.classList.add('shake');
    setTimeout(() => wrapper.classList.remove('shake'), 400);

    // Update high score
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('snakeHighScore', this.highScore);
      this.highScoreEl.textContent = this.highScore;
    }

    // Show game over overlay
    this.finalScoreEl.textContent = this.score;
    this.finalHighEl.textContent = this.highScore;
    setTimeout(() => {
      this.gameOverOverlay.classList.remove('hidden');
    }, 500);
  }

  /* ---------- Game Loop ---------- */

  /** Get step interval in ms based on current level */
  get stepInterval() {
    // Start at 140ms, decrease by 10ms per level, minimum 50ms
    return Math.max(50, 140 - (this.level - 1) * 10);
  }

  _loop(timestamp) {
    if (!this.isRunning || this.isPaused) return;

    this.gameLoopId = requestAnimationFrame((t) => this._loop(t));

    const delta = timestamp - this.lastTime;
    this.lastTime = timestamp;
    this.accumulator += delta;

    // Update food pulse animation
    this.foodPulse += delta * 0.004;

    // Fixed timestep logic updates
    while (this.accumulator >= this.stepInterval) {
      this.accumulator -= this.stepInterval;
      this._update();
      if (!this.isRunning) return;
    }

    // Update particles
    this.particles.forEach(p => p.update());
    this.particles = this.particles.filter(p => p.life > 0);

    // Render
    this._draw();
  }

  /* ---------- Update ---------- */

  _update() {
    this.direction = this.nextDirection;

    // Compute new head position
    const head = { ...this.snake[0] };
    switch (this.direction) {
      case 'up':    head.y--; break;
      case 'down':  head.y++; break;
      case 'left':  head.x--; break;
      case 'right': head.x++; break;
    }

    // Wall collision
    if (head.x < 0 || head.x >= this.gridSize ||
        head.y < 0 || head.y >= this.gridSize) {
      this._gameOver();
      return;
    }

    // Self collision
    if (this.snake.some(s => s.x === head.x && s.y === head.y)) {
      this._gameOver();
      return;
    }

    // Add new head
    this.snake.unshift(head);

    // Check food
    if (head.x === this.food.x && head.y === this.food.y) {
      this.score++;
      AudioManager.play('eat');

      // Emit particles at food position
      const px = (this.food.x + 0.5) * this.cellSize;
      const py = (this.food.y + 0.5) * this.cellSize;
      for (let i = 0; i < 12; i++) {
        this.particles.push(new Particle(px, py, '#ff2d75'));
      }

      // Level up every 5 points
      const newLevel = Math.floor(this.score / 5) + 1;
      if (newLevel > this.level) {
        this.level = newLevel;
        AudioManager.play('level');
      }

      this._updateUI();
      this._spawnFood();
    } else {
      // Remove tail (no growth)
      this.snake.pop();
    }
  }

  _updateUI() {
    this.scoreEl.textContent = this.score;
    this.highScoreEl.textContent = this.highScore;
    this.levelEl.textContent = this.level;
  }

  /* ---------- Rendering ---------- */

  _draw() {
    const ctx = this.ctx;
    const cs = this.cellSize;
    const size = this.gridSize * cs;

    // Clear
    ctx.fillStyle = '#0d0d14';
    ctx.fillRect(0, 0, size, size);

    // Draw subtle grid
    ctx.strokeStyle = 'rgba(255,255,255,0.02)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= this.gridSize; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cs, 0);
      ctx.lineTo(i * cs, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cs);
      ctx.lineTo(size, i * cs);
      ctx.stroke();
    }

    // Draw food
    this._drawFood(ctx, cs);

    // Draw snake
    this._drawSnake(ctx, cs);

    // Draw particles
    this.particles.forEach(p => p.draw(ctx));
  }

  _drawFood(ctx, cs) {
    const fx = (this.food.x + 0.5) * cs;
    const fy = (this.food.y + 0.5) * cs;
    const pulse = 0.3 + Math.sin(this.foodPulse) * 0.15;
    const baseR = cs * 0.35;

    // Outer glow
    ctx.save();
    ctx.shadowColor = '#ff2d75';
    ctx.shadowBlur = 18 + Math.sin(this.foodPulse) * 6;
    ctx.globalAlpha = 0.6;

    const grad = ctx.createRadialGradient(fx, fy, 0, fx, fy, baseR * 2);
    grad.addColorStop(0, '#ff2d75');
    grad.addColorStop(0.5, 'rgba(255,45,117,0.3)');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(fx, fy, baseR * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Core orb
    ctx.save();
    ctx.shadowColor = '#ff2d75';
    ctx.shadowBlur = 12;
    const coreGrad = ctx.createRadialGradient(fx - 2, fy - 2, 0, fx, fy, baseR);
    coreGrad.addColorStop(0, '#ffffff');
    coreGrad.addColorStop(0.3, '#ff6b9d');
    coreGrad.addColorStop(1, '#ff2d75');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(fx, fy, baseR * (1 + pulse * 0.15), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawSnake(ctx, cs) {
    const len = this.snake.length;

    this.snake.forEach((seg, i) => {
      const x = seg.x * cs;
      const y = seg.y * cs;
      const isHead = i === 0;

      // Color gradient from head to tail
      const ratio = i / Math.max(len - 1, 1);
      const r = Math.round(0 + ratio * 0);
      const g = Math.round(255 - ratio * 100);
      const b = Math.round(136 - ratio * 80);
      const color = `rgb(${r},${g},${b})`;

      const pad = 1; // gap between segments

      ctx.save();

      if (isHead) {
        // Head glow
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 16;
      } else {
        ctx.shadowColor = color;
        ctx.shadowBlur = 6;
      }

      // Rounded rect segment
      const segSize = cs - pad * 2;
      const radius = isHead ? segSize * 0.4 : segSize * 0.3;
      ctx.fillStyle = color;
      this._roundRect(ctx, x + pad, y + pad, segSize, segSize, radius);
      ctx.fill();

      // Inner highlight on head
      if (isHead) {
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#88ffbb';
        this._roundRect(ctx, x + pad + 3, y + pad + 3, segSize - 6, segSize - 6, radius - 2);
        ctx.fill();

        // Eyes
        ctx.globalAlpha = 1;
        const eyeSize = cs * 0.12;
        let ex1, ey1, ex2, ey2;
        const cx = x + cs / 2;
        const cy = y + cs / 2;

        switch (this.direction) {
          case 'right':
            ex1 = cx + cs * 0.15; ey1 = cy - cs * 0.15;
            ex2 = cx + cs * 0.15; ey2 = cy + cs * 0.15;
            break;
          case 'left':
            ex1 = cx - cs * 0.15; ey1 = cy - cs * 0.15;
            ex2 = cx - cs * 0.15; ey2 = cy + cs * 0.15;
            break;
          case 'up':
            ex1 = cx - cs * 0.15; ey1 = cy - cs * 0.15;
            ex2 = cx + cs * 0.15; ey2 = cy - cs * 0.15;
            break;
          case 'down':
            ex1 = cx - cs * 0.15; ey1 = cy + cs * 0.15;
            ex2 = cx + cs * 0.15; ey2 = cy + cs * 0.15;
            break;
        }

        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(ex1, ey1, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(ex2, ey2, eyeSize, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  }

  /** Utility: draw a rounded rectangle path */
  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}

// ─── Initialize ─────────────────────────────
const game = new SnakeGame();
