/**
 * Dzikir Counter — Digital tasbih with presets and history
 */
Apps.DzikirCounter = {
    _count: 0, _target: 33, _preset: 'SubhanAllah', _history: [],

    open() {
        if (XP.windows['dzikircounter']) { XP.focusWindow('dzikircounter'); return; }
        try { this._history = JSON.parse(localStorage.getItem('xp_dzikir_history')) || []; } catch { this._history = []; }

        XP.createWindow('dzikircounter', {
            title: 'Dzikir Counter',
            icon: 'quran.png',
            width: 320, height: 420,
            resizable: false,
            content: `
                <style>
                    .dz-wrap{text-align:center;padding:12px;background:linear-gradient(180deg,#1a472a,#0d2818);color:#fff;height:100%;display:flex;flex-direction:column}
                    .dz-presets{display:flex;flex-wrap:wrap;gap:4px;justify-content:center;margin-bottom:12px}
                    .dz-preset{padding:4px 10px;border-radius:12px;font-size:10px;cursor:pointer;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:#a0d8b4}
                    .dz-preset:hover,.dz-preset.active{background:rgba(255,255,255,0.2);color:#fff}
                    .dz-label{font-size:14px;color:#a0d8b4;margin-bottom:4px}
                    .dz-arabic{font-family:'Amiri','Traditional Arabic',serif;font-size:28px;direction:rtl;margin-bottom:8px;min-height:36px}
                    .dz-count{font-size:72px;font-weight:bold;cursor:pointer;user-select:none;line-height:1;margin:10px 0;transition:transform .1s}
                    .dz-count:active{transform:scale(0.95)}
                    .dz-target{font-size:11px;color:#888;margin-bottom:8px}
                    .dz-progress{width:80%;height:6px;background:rgba(255,255,255,0.1);border-radius:3px;margin:0 auto 12px;overflow:hidden}
                    .dz-progress-bar{height:100%;background:#27ae60;border-radius:3px;transition:width .2s}
                    .dz-controls{display:flex;gap:6px;justify-content:center;margin-bottom:8px}
                    .dz-btn{background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:#fff;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:11px;min-width:0;min-height:0;box-shadow:none}
                    .dz-btn:hover{background:rgba(255,255,255,0.2)}
                    .dz-history{flex:1;overflow-y:auto;text-align:left;font-size:10px;color:#a0d8b4;padding:0 8px}
                    .dz-hist-item{padding:2px 0;border-bottom:1px solid rgba(255,255,255,0.05);display:flex;justify-content:space-between}
                </style>
                <div class="dz-wrap">
                    <div class="dz-presets">
                        <span class="dz-preset active" onclick="Apps.DzikirCounter.setPreset('SubhanAllah','سُبْحَانَ اللَّهِ',33)">SubhanAllah</span>
                        <span class="dz-preset" onclick="Apps.DzikirCounter.setPreset('Alhamdulillah','الْحَمْدُ لِلَّهِ',33)">Alhamdulillah</span>
                        <span class="dz-preset" onclick="Apps.DzikirCounter.setPreset('Allahu Akbar','اللَّهُ أَكْبَرُ',33)">Allahu Akbar</span>
                        <span class="dz-preset" onclick="Apps.DzikirCounter.setPreset('Istighfar','أَسْتَغْفِرُ اللَّهَ',100)">Istighfar</span>
                        <span class="dz-preset" onclick="Apps.DzikirCounter.setPreset('La ilaha illallah','لَا إِلَهَ إِلَّا اللَّهُ',100)">Tahlil</span>
                    </div>
                    <div class="dz-label" id="dz-label">SubhanAllah</div>
                    <div class="dz-arabic" id="dz-arabic">سُبْحَانَ اللَّهِ</div>
                    <div class="dz-count" id="dz-count" onclick="Apps.DzikirCounter.increment()">0</div>
                    <div class="dz-target" id="dz-target">Target: 33</div>
                    <div class="dz-progress"><div class="dz-progress-bar" id="dz-bar" style="width:0%"></div></div>
                    <div class="dz-controls">
                        <button class="dz-btn" onclick="Apps.DzikirCounter.reset()">Reset</button>
                        <button class="dz-btn" onclick="Apps.DzikirCounter.setCustomTarget()">Set Target</button>
                    </div>
                    <div class="dz-history" id="dz-history"></div>
                </div>
            `,
            onReady: () => this._renderHistory(),
        });
    },

    setPreset(name, arabic, target) {
        if (this._count > 0) this._saveSession();
        this._preset = name; this._target = target; this._count = 0;
        document.getElementById('dz-label').textContent = name;
        document.getElementById('dz-arabic').textContent = arabic;
        document.getElementById('dz-target').textContent = 'Target: ' + target;
        document.getElementById('dz-count').textContent = '0';
        document.getElementById('dz-bar').style.width = '0%';
        document.querySelectorAll('.dz-preset').forEach(p => p.classList.toggle('active', p.textContent === name || p.textContent === 'Tahlil' && name === 'La ilaha illallah'));
    },

    increment() {
        this._count++;
        document.getElementById('dz-count').textContent = this._count;
        const pct = Math.min(100, (this._count / this._target) * 100);
        document.getElementById('dz-bar').style.width = pct + '%';
        if (this._count === this._target) {
            XP.playSound('notify');
            XP.notify('Dzikir', `${this._preset} × ${this._target} completed!`);
            this._saveSession();
        }
    },

    reset() { if (this._count > 0) this._saveSession(); this._count = 0; document.getElementById('dz-count').textContent = '0'; document.getElementById('dz-bar').style.width = '0%'; },

    setCustomTarget() {
        const t = prompt('Set target:', this._target);
        if (t && +t > 0) { this._target = +t; document.getElementById('dz-target').textContent = 'Target: ' + this._target; }
    },

    _saveSession() {
        this._history.unshift({ name: this._preset, count: this._count, target: this._target, date: new Date().toLocaleString() });
        if (this._history.length > 50) this._history.pop();
        localStorage.setItem('xp_dzikir_history', JSON.stringify(this._history));
        this._renderHistory();
    },

    _renderHistory() {
        const el = document.getElementById('dz-history');
        if (!el) return;
        el.innerHTML = this._history.length ? this._history.slice(0, 15).map(h =>
            `<div class="dz-hist-item"><span>${h.name} × ${h.count}</span><span style="color:#666">${h.date}</span></div>`
        ).join('') : '<div style="text-align:center;color:#666;padding:8px">No history yet</div>';
    },
};
document.addEventListener('keydown', e => { if (e.code === 'Space' && document.getElementById('window-dzikircounter') && XP.activeWindowId === 'dzikircounter') { e.preventDefault(); Apps.DzikirCounter.increment(); } });
