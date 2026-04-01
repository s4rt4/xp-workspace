/**
 * Stopwatch — Stopwatch + lap timer
 */
Apps.Stopwatch = {
    _running: false, _elapsed: 0, _startTime: 0, _interval: null, _laps: [],

    open() {
        if (XP.windows['stopwatch']) { XP.focusWindow('stopwatch'); return; }
        this._elapsed = 0; this._laps = []; this._running = false;

        XP.createWindow('stopwatch', {
            title: 'Stopwatch',
            icon: 'scheduled-tasks.png', width: 300, height: 380, resizable: false,
            content: `
                <style>
                    .sw-wrap{text-align:center;padding:16px;height:100%;display:flex;flex-direction:column}
                    .sw-time{font-size:48px;font-weight:bold;font-family:Consolas,'Courier New',monospace;color:#003c74;margin:16px 0}
                    .sw-ms{font-size:24px;color:#888}
                    .sw-controls{display:flex;gap:8px;justify-content:center;margin:12px 0}
                    .sw-btn{width:60px;height:60px;border-radius:50%;border:2px solid #d4d0c8;font-size:11px;cursor:pointer;font-weight:bold;display:flex;align-items:center;justify-content:center;min-width:0;min-height:0;box-shadow:none}
                    .sw-btn-start{background:#27ae60;color:#fff;border-color:#27ae60}
                    .sw-btn-start:hover{background:#2ecc71}
                    .sw-btn-stop{background:#e74c3c;color:#fff;border-color:#e74c3c}
                    .sw-btn-stop:hover{background:#c0392b}
                    .sw-btn-lap{background:#3498db;color:#fff;border-color:#3498db}
                    .sw-btn-lap:hover{background:#2980b9}
                    .sw-btn-reset{background:#ece9d8;border-color:#bbb}
                    .sw-btn-reset:hover{background:#ddd}
                    .sw-laps{flex:1;overflow-y:auto;text-align:left;margin-top:8px;font-size:11px}
                    .sw-lap{display:flex;justify-content:space-between;padding:3px 8px;border-bottom:1px solid #f0ece0}
                    .sw-lap:nth-child(odd){background:#f8f6f0}
                    .sw-lap-num{color:#888;width:40px}
                    .sw-lap-diff{color:#27ae60;font-family:Consolas,monospace}
                    .sw-lap-total{font-family:Consolas,monospace;color:#003c74;font-weight:bold}
                </style>
                <div class="sw-wrap">
                    <div class="sw-time" id="sw-time">00:00<span class="sw-ms">.00</span></div>
                    <div class="sw-controls">
                        <button class="sw-btn sw-btn-start" id="sw-toggle" onclick="Apps.Stopwatch.toggle()">Start</button>
                        <button class="sw-btn sw-btn-lap" onclick="Apps.Stopwatch.lap()">Lap</button>
                        <button class="sw-btn sw-btn-reset" onclick="Apps.Stopwatch.reset()">Reset</button>
                    </div>
                    <div class="sw-laps" id="sw-laps"></div>
                </div>
            `,
            onClose: () => { clearInterval(this._interval); this._running = false; },
        });
    },

    toggle() {
        if (this._running) this.stop(); else this.start();
    },

    start() {
        this._running = true;
        this._startTime = performance.now() - this._elapsed;
        const btn = document.getElementById('sw-toggle');
        if (btn) { btn.textContent = 'Stop'; btn.className = 'sw-btn sw-btn-stop'; }
        this._interval = setInterval(() => this._update(), 30);
    },

    stop() {
        this._running = false;
        clearInterval(this._interval);
        this._elapsed = performance.now() - this._startTime;
        const btn = document.getElementById('sw-toggle');
        if (btn) { btn.textContent = 'Start'; btn.className = 'sw-btn sw-btn-start'; }
    },

    reset() {
        this.stop();
        this._elapsed = 0; this._laps = [];
        this._updateDisplay(0);
        document.getElementById('sw-laps').innerHTML = '';
    },

    lap() {
        if (!this._running) return;
        const total = performance.now() - this._startTime;
        const prevTotal = this._laps.length > 0 ? this._laps[this._laps.length - 1].total : 0;
        this._laps.push({ num: this._laps.length + 1, diff: total - prevTotal, total });
        this._renderLaps();
    },

    _update() {
        const elapsed = performance.now() - this._startTime;
        this._updateDisplay(elapsed);
    },

    _updateDisplay(ms) {
        const el = document.getElementById('sw-time');
        if (!el) return;
        const totalSec = ms / 1000;
        const min = Math.floor(totalSec / 60);
        const sec = Math.floor(totalSec % 60);
        const cs = Math.floor((ms % 1000) / 10);
        el.innerHTML = `${String(min).padStart(2,'0')}:${String(sec).padStart(2,'0')}<span class="sw-ms">.${String(cs).padStart(2,'0')}</span>`;
    },

    _renderLaps() {
        const el = document.getElementById('sw-laps');
        if (!el) return;
        el.innerHTML = this._laps.slice().reverse().map(l =>
            `<div class="sw-lap"><span class="sw-lap-num">Lap ${l.num}</span><span class="sw-lap-diff">+${this._fmt(l.diff)}</span><span class="sw-lap-total">${this._fmt(l.total)}</span></div>`
        ).join('');
    },

    _fmt(ms) {
        const min = Math.floor(ms / 60000);
        const sec = Math.floor((ms % 60000) / 1000);
        const cs = Math.floor((ms % 1000) / 10);
        return `${String(min).padStart(2,'0')}:${String(sec).padStart(2,'0')}.${String(cs).padStart(2,'0')}`;
    },
};
