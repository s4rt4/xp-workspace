/**
 * Snake — Classic Snake Game
 */
Apps.Snake = {
    canvas: null, ctx: null, size: 20, w: 20, h: 15,
    snake: [], dir: {x:1,y:0}, food: null,
    score: 0, speed: 180, running: false, interval: null,

    open() {
        XP.createWindow('snake', {
            title: 'Snake',
            icon: 'game-controller.png',
            width: 440, height: 400, resizable: false,
            content: `
                <style>
                    .snake-wrap { display:flex; flex-direction:column; align-items:center; background:#222; padding:10px; margin:-8px; height:calc(100% + 16px); }
                    .snake-header { display:flex; justify-content:space-between; width:100%; max-width:400px; margin-bottom:8px; color:#fff; font-size:12px; }
                    .snake-score { color:#4caf50; font-weight:bold; font-size:16px; }
                    #snake-canvas { border:2px solid #4caf50; background:#1a1a1a; }
                    .snake-start { margin-top:8px; background:#4caf50; color:#fff; border:none; padding:8px 24px; cursor:pointer; font-size:12px; font-weight:bold; border-radius:3px; min-width:0; min-height:0; box-shadow:none; }
                    .snake-start:hover { background:#66bb6a; }
                    .snake-hint { color:#555; font-size:10px; margin-top:6px; }
                </style>
                <div class="snake-wrap">
                    <div class="snake-header">
                        <span>Score: <span class="snake-score" id="snake-score">0</span></span>
                        <span id="snake-status" style="color:#888">Press Start</span>
                    </div>
                    <canvas id="snake-canvas" width="400" height="300"></canvas>
                    <button class="snake-start" id="snake-start" onclick="Apps.Snake.start()">Start Game</button>
                    <div class="snake-hint">Arrow keys or WASD to move</div>
                </div>
            `,
            onReady: () => this._init(),
            onClose: () => { if (this.interval) clearInterval(this.interval); },
        });
    },

    _init() {
        this.canvas = document.getElementById('snake-canvas');
        this.ctx = this.canvas.getContext('2d');
        this._draw();
        this._keyHandler = (e) => {
            if (!document.getElementById('window-snake')) { document.removeEventListener('keydown', this._keyHandler); return; }
            const map = { ArrowUp:{x:0,y:-1}, ArrowDown:{x:0,y:1}, ArrowLeft:{x:-1,y:0}, ArrowRight:{x:1,y:0}, w:{x:0,y:-1}, s:{x:0,y:1}, a:{x:-1,y:0}, d:{x:1,y:0} };
            const d = map[e.key]; if (!d || !this.running) return;
            if (d.x !== -this.dir.x || d.y !== -this.dir.y) { this.dir = d; e.preventDefault(); }
        };
        document.addEventListener('keydown', this._keyHandler);
    },

    start() {
        if (this.interval) clearInterval(this.interval);
        this.snake = [{x:10,y:7},{x:9,y:7},{x:8,y:7}];
        this.dir = {x:1,y:0}; this.score = 0; this.speed = 180; this.running = true;
        this._placeFood();
        document.getElementById('snake-score').textContent = '0';
        document.getElementById('snake-status').textContent = 'Playing';
        document.getElementById('snake-status').style.color = '#4caf50';
        document.getElementById('snake-start').textContent = 'Restart';
        this.interval = setInterval(() => this._update(), this.speed);
    },

    _placeFood() {
        do { this.food = { x: Math.floor(Math.random()*this.w), y: Math.floor(Math.random()*this.h) }; }
        while (this.snake.some(s => s.x===this.food.x && s.y===this.food.y));
    },

    _update() {
        const head = { x: this.snake[0].x + this.dir.x, y: this.snake[0].y + this.dir.y };
        if (head.x<0||head.x>=this.w||head.y<0||head.y>=this.h || this.snake.some(s=>s.x===head.x&&s.y===head.y)) {
            this.running = false; clearInterval(this.interval);
            document.getElementById('snake-status').textContent = `Game Over! Score: ${this.score}`;
            document.getElementById('snake-status').style.color = '#f44336';
            return;
        }
        this.snake.unshift(head);
        if (head.x===this.food.x && head.y===this.food.y) {
            this.score += 10;
            document.getElementById('snake-score').textContent = this.score;
            this._placeFood();
            if (this.score % 50 === 0 && this.speed > 80) { this.speed -= 5; clearInterval(this.interval); this.interval = setInterval(()=>this._update(), this.speed); }
        } else { this.snake.pop(); }
        this._draw();
    },

    _draw() {
        const c = this.ctx, s = this.size;
        c.fillStyle = '#1a1a1a'; c.fillRect(0,0,this.canvas.width,this.canvas.height);
        // Grid
        c.strokeStyle = '#222'; c.lineWidth = 0.5;
        for (let x=0;x<this.w;x++) { c.beginPath(); c.moveTo(x*s,0); c.lineTo(x*s,this.canvas.height); c.stroke(); }
        for (let y=0;y<this.h;y++) { c.beginPath(); c.moveTo(0,y*s); c.lineTo(this.canvas.width,y*s); c.stroke(); }
        // Snake
        this.snake.forEach((p,i) => {
            c.fillStyle = i===0 ? '#66bb6a' : '#4caf50';
            c.fillRect(p.x*s+1, p.y*s+1, s-2, s-2);
        });
        // Food
        if (this.food) { c.fillStyle = '#f44336'; c.beginPath(); c.arc(this.food.x*s+s/2, this.food.y*s+s/2, s/2-2, 0, Math.PI*2); c.fill(); }
    },
};
