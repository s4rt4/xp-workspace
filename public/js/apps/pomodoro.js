/**
 * Pomodoro Timer — Focus timer with work/break cycles
 * 25 min work → 5 min break → repeat, 15 min long break every 4 cycles
 */
Apps.Pomodoro = {
    timer: null,
    seconds: 25 * 60,
    running: false,
    mode: 'work',      // 'work', 'break', 'longbreak'
    cycle: 0,
    settings: { work: 25, break: 5, longbreak: 15 },

    open() {
        if (XP.windows['pomodoro']) { XP.focusWindow('pomodoro'); return; }

        this.seconds = this.settings.work * 60;
        this.running = false;
        this.mode = 'work';
        this.cycle = 0;

        XP.createWindow('pomodoro', {
            title: 'Pomodoro Timer',
            icon: 'scheduled-tasks.png',
            width: 340, height: 380,
            resizable: false,
            content: `
                <style>
                    .pm-wrap { text-align:center; padding:16px; user-select:none; }
                    .pm-mode-tabs { display:flex; justify-content:center; gap:4px; margin-bottom:16px; }
                    .pm-mode-tab { padding:4px 12px; font-size:11px; border-radius:3px; cursor:pointer; border:1px solid #d4d0c8; background:#ece9d8; }
                    .pm-mode-tab.active { background:#3b79e7; color:#fff; border-color:#3b79e7; }
                    .pm-time { font-size:64px; font-weight:bold; font-family:'Segoe UI',Tahoma,sans-serif; color:#222; margin:20px 0; letter-spacing:2px; }
                    .pm-time.work { color:#c0392b; }
                    .pm-time.break { color:#27ae60; }
                    .pm-time.longbreak { color:#2980b9; }
                    .pm-controls { display:flex; justify-content:center; gap:8px; margin:16px 0; }
                    .pm-controls button { min-width:80px; }
                    .pm-cycles { font-size:11px; color:#666; margin-top:12px; }
                    .pm-dot { display:inline-block; width:10px; height:10px; border-radius:50%; border:1px solid #aaa; margin:0 3px; }
                    .pm-dot.done { background:#c0392b; border-color:#c0392b; }
                    .pm-settings { margin-top:12px; font-size:11px; }
                    .pm-settings input { width:40px; text-align:center; }
                    .pm-label { font-size:12px; font-weight:bold; margin-bottom:4px; }
                </style>
                <div class="pm-wrap">
                    <div class="pm-mode-tabs">
                        <div class="pm-mode-tab active" data-mode="work" onclick="Apps.Pomodoro.switchMode('work')">Focus</div>
                        <div class="pm-mode-tab" data-mode="break" onclick="Apps.Pomodoro.switchMode('break')">Break</div>
                        <div class="pm-mode-tab" data-mode="longbreak" onclick="Apps.Pomodoro.switchMode('longbreak')">Long Break</div>
                    </div>
                    <div class="pm-label" id="pm-label">Focus Time</div>
                    <div class="pm-time work" id="pm-time">25:00</div>
                    <div class="pm-controls">
                        <button class="xp-btn xp-btn-primary" id="pm-start" onclick="Apps.Pomodoro.toggleTimer()">Start</button>
                        <button class="xp-btn" onclick="Apps.Pomodoro.reset()">Reset</button>
                    </div>
                    <div class="pm-cycles" id="pm-cycles"></div>
                    <div class="pm-settings">
                        <label>Focus <input class="xp-input" id="pm-set-work" type="number" min="1" max="90" value="25" onchange="Apps.Pomodoro.updateSettings()">m</label>
                        <label> Break <input class="xp-input" id="pm-set-break" type="number" min="1" max="30" value="5" onchange="Apps.Pomodoro.updateSettings()">m</label>
                        <label> Long <input class="xp-input" id="pm-set-long" type="number" min="1" max="60" value="15" onchange="Apps.Pomodoro.updateSettings()">m</label>
                    </div>
                </div>
            `,
            onReady: () => {
                this._updateDisplay();
                this._renderCycles();
            },
            onClose: () => {
                this.stop();
            },
        });
    },

    switchMode(mode) {
        this.stop();
        this.mode = mode;
        this.seconds = this.settings[mode] * 60;
        document.querySelectorAll('.pm-mode-tab').forEach(t => t.classList.toggle('active', t.dataset.mode === mode));
        this._updateDisplay();
    },

    toggleTimer() {
        if (this.running) this.stop();
        else this.start();
    },

    start() {
        if (this.running) return;
        this.running = true;
        const btn = document.getElementById('pm-start');
        if (btn) btn.textContent = 'Pause';

        this.timer = setInterval(() => {
            this.seconds--;
            this._updateDisplay();
            if (this.seconds <= 0) {
                this._onComplete();
            }
        }, 1000);
    },

    stop() {
        this.running = false;
        clearInterval(this.timer);
        this.timer = null;
        const btn = document.getElementById('pm-start');
        if (btn) btn.textContent = 'Start';
    },

    reset() {
        this.stop();
        this.seconds = this.settings[this.mode] * 60;
        this._updateDisplay();
    },

    _onComplete() {
        this.stop();
        XP.playSound('notify');

        if (this.mode === 'work') {
            this.cycle++;
            this._renderCycles();
            XP.notify('Pomodoro', `Focus session #${this.cycle} complete! Time for a break.`);
            if (this.cycle % 4 === 0) {
                this.switchMode('longbreak');
            } else {
                this.switchMode('break');
            }
        } else {
            XP.notify('Pomodoro', 'Break is over! Ready to focus?');
            this.switchMode('work');
        }
    },

    _updateDisplay() {
        const m = Math.floor(this.seconds / 60);
        const s = this.seconds % 60;
        const el = document.getElementById('pm-time');
        if (el) {
            el.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
            el.className = 'pm-time ' + this.mode;
        }
        const label = document.getElementById('pm-label');
        if (label) {
            const labels = { work: 'Focus Time', break: 'Short Break', longbreak: 'Long Break' };
            label.textContent = labels[this.mode];
        }
        // Update window title
        if (XP.windows['pomodoro']) {
            const title = XP.windows['pomodoro'].querySelector('.window-title span');
            if (title) title.textContent = `Pomodoro — ${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        }
    },

    _renderCycles() {
        const el = document.getElementById('pm-cycles');
        if (!el) return;
        let html = '';
        for (let i = 0; i < 4; i++) {
            html += `<span class="pm-dot${i < (this.cycle % 4) ? ' done' : ''}"></span>`;
        }
        el.innerHTML = `Session ${this.cycle} &nbsp; ${html}`;
    },

    updateSettings() {
        const w = parseInt(document.getElementById('pm-set-work')?.value) || 25;
        const b = parseInt(document.getElementById('pm-set-break')?.value) || 5;
        const l = parseInt(document.getElementById('pm-set-long')?.value) || 15;
        this.settings = { work: w, break: b, longbreak: l };
        if (!this.running) {
            this.seconds = this.settings[this.mode] * 60;
            this._updateDisplay();
        }
    },
};
