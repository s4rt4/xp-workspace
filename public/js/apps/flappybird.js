/**
 * Flappy Bird — Classic flappy bird game
 */
Apps.FlappyBird = {
    _canvas: null, _ctx: null, _running: false, _raf: null,
    _bird: null, _pipes: [], _score: 0, _best: 0, _gravity: 0.4, _jump: -6.5, _gap: 130, _pipeW: 45, _speed: 2.5,

    open() {
        if (XP.windows['flappybird']) { XP.focusWindow('flappybird'); return; }
        try { this._best = parseInt(localStorage.getItem('xp_flappy_best')) || 0; } catch {}

        XP.createWindow('flappybird', {
            title: 'Flappy Bird', icon: 'tetris.png', width: 320, height: 520, resizable: false,
            content: `
                <style>.fb-wrap{display:flex;align-items:center;justify-content:center;height:100%;background:#4EC0CA;cursor:pointer} .fb-wrap canvas{display:block}</style>
                <div class="fb-wrap" id="fb-wrap" onclick="Apps.FlappyBird._click()" onkeydown="Apps.FlappyBird._click()"><canvas id="fb-canvas" width="288" height="440"></canvas></div>
            `,
            onReady: () => { this._canvas = document.getElementById('fb-canvas'); this._ctx = this._canvas.getContext('2d'); this._reset(); this._drawStart(); document.getElementById('fb-wrap').focus(); },
            onClose: () => { cancelAnimationFrame(this._raf); this._running = false; },
        });
    },

    _reset() {
        this._bird = { x: 60, y: 200, vy: 0, w: 28, h: 20 };
        this._pipes = []; this._score = 0; this._running = false;
        this._frameCount = 0;
    },

    _click() {
        if (!this._running) { this._running = true; this._gameLoop(); }
        this._bird.vy = this._jump;
    },

    _gameLoop() {
        if (!this._running) return;
        this._update();
        this._draw();
        this._raf = requestAnimationFrame(() => this._gameLoop());
    },

    _update() {
        const b = this._bird;
        b.vy += this._gravity;
        b.y += b.vy;
        this._frameCount++;

        // Spawn pipes
        if (this._frameCount % 90 === 0) {
            const topH = 60 + Math.random() * (this._canvas.height - this._gap - 120);
            this._pipes.push({ x: this._canvas.width, topH, scored: false });
        }

        // Move pipes
        this._pipes.forEach(p => { p.x -= this._speed; });
        this._pipes = this._pipes.filter(p => p.x + this._pipeW > -10);

        // Score
        this._pipes.forEach(p => {
            if (!p.scored && p.x + this._pipeW < b.x) { p.scored = true; this._score++; }
        });

        // Collision
        if (b.y + b.h > this._canvas.height - 40 || b.y < 0) { this._gameOver(); return; }
        for (const p of this._pipes) {
            if (b.x + b.w > p.x && b.x < p.x + this._pipeW) {
                if (b.y < p.topH || b.y + b.h > p.topH + this._gap) { this._gameOver(); return; }
            }
        }
    },

    _draw() {
        const ctx = this._ctx, W = this._canvas.width, H = this._canvas.height;
        // Sky
        ctx.fillStyle = '#4EC0CA'; ctx.fillRect(0, 0, W, H);
        // Ground
        ctx.fillStyle = '#DED895'; ctx.fillRect(0, H - 40, W, 40);
        ctx.fillStyle = '#36B336'; ctx.fillRect(0, H - 42, W, 4);

        // Pipes
        this._pipes.forEach(p => {
            ctx.fillStyle = '#73BF2E'; ctx.strokeStyle = '#548A1E'; ctx.lineWidth = 2;
            // Top pipe
            ctx.fillRect(p.x, 0, this._pipeW, p.topH);
            ctx.strokeRect(p.x, 0, this._pipeW, p.topH);
            ctx.fillRect(p.x - 3, p.topH - 20, this._pipeW + 6, 20);
            ctx.strokeRect(p.x - 3, p.topH - 20, this._pipeW + 6, 20);
            // Bottom pipe
            const botY = p.topH + this._gap;
            ctx.fillRect(p.x, botY, this._pipeW, H - botY - 40);
            ctx.strokeRect(p.x, botY, this._pipeW, H - botY - 40);
            ctx.fillRect(p.x - 3, botY, this._pipeW + 6, 20);
            ctx.strokeRect(p.x - 3, botY, this._pipeW + 6, 20);
        });

        // Bird
        const b = this._bird;
        ctx.fillStyle = '#F7DC6F'; ctx.beginPath();
        ctx.ellipse(b.x + b.w/2, b.y + b.h/2, b.w/2, b.h/2, Math.min(0.3, b.vy * 0.05), 0, Math.PI * 2);
        ctx.fill(); ctx.strokeStyle = '#D4AC0D'; ctx.lineWidth = 1.5; ctx.stroke();
        // Eye
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(b.x + b.w - 6, b.y + 6, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(b.x + b.w - 4, b.y + 6, 2.5, 0, Math.PI * 2); ctx.fill();
        // Beak
        ctx.fillStyle = '#E74C3C'; ctx.beginPath(); ctx.moveTo(b.x + b.w, b.y + 10); ctx.lineTo(b.x + b.w + 8, b.y + 13); ctx.lineTo(b.x + b.w, b.y + 16); ctx.fill();

        // Score
        ctx.fillStyle = '#fff'; ctx.font = 'bold 28px Tahoma'; ctx.textAlign = 'center';
        ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.strokeText(this._score, W/2, 50); ctx.fillText(this._score, W/2, 50);
    },

    _drawStart() {
        this._draw();
        const ctx = this._ctx, W = this._canvas.width, H = this._canvas.height;
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 22px Tahoma'; ctx.textAlign = 'center';
        ctx.fillText('Flappy Bird', W/2, H/2 - 30);
        ctx.font = '13px Tahoma'; ctx.fillText('Click or press Space to play', W/2, H/2 + 5);
        ctx.fillText('Best: ' + this._best, W/2, H/2 + 30);
    },

    _gameOver() {
        this._running = false; cancelAnimationFrame(this._raf);
        if (this._score > this._best) { this._best = this._score; localStorage.setItem('xp_flappy_best', this._best); }
        const ctx = this._ctx, W = this._canvas.width, H = this._canvas.height;
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 22px Tahoma'; ctx.textAlign = 'center';
        ctx.fillText('Game Over', W/2, H/2 - 20);
        ctx.font = '14px Tahoma';
        ctx.fillText(`Score: ${this._score}  Best: ${this._best}`, W/2, H/2 + 10);
        ctx.font = '12px Tahoma'; ctx.fillText('Click to restart', W/2, H/2 + 35);
        setTimeout(() => this._reset(), 300);
    },
};
document.addEventListener('keydown', e => { if (e.code === 'Space' && XP.activeWindowId === 'flappybird') { e.preventDefault(); Apps.FlappyBird._click(); } });
