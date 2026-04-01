/**
 * Typing Test — Measure typing speed (WPM) and accuracy
 */
Apps.TypingTest = {
    _words: [], _input: '', _started: false, _startTime: 0, _wordIdx: 0, _correct: 0, _wrong: 0, _timer: null, _duration: 60, _elapsed: 0,

    _wordBank: 'the be to of and a in that have i it for not on with he as you do at this but his by from they we say her she or an will my one all would there their what so up out if about who get which go me when make can like time no just him know take people into year your good some could them see other than then now look only come its over think also back after use two how our work first well way even new want because any these give day most us'.split(' '),

    open() {
        if (XP.windows['typingtest']) { XP.focusWindow('typingtest'); return; }
        XP.createWindow('typingtest', {
            title: 'Typing Test', icon: 'notepad.png', width: 600, height: 380, resizable: false,
            content: `
                <style>
                    .tt-wrap{padding:12px;height:100%;display:flex;flex-direction:column}
                    .tt-stats{display:flex;gap:16px;justify-content:center;margin-bottom:12px}
                    .tt-stat{text-align:center}
                    .tt-stat-val{font-size:28px;font-weight:bold;color:#003c74}
                    .tt-stat-label{font-size:10px;color:#888}
                    .tt-timer{font-size:20px;font-weight:bold;color:#c0392b;text-align:center;margin-bottom:8px}
                    .tt-words{background:#f5f3e8;border:1px solid #d4d0c8;padding:12px;line-height:2;font-size:16px;font-family:'Consolas',monospace;min-height:80px;border-radius:4px;margin-bottom:8px;overflow:hidden;max-height:100px}
                    .tt-word{padding:2px 1px;border-radius:2px}
                    .tt-word.current{background:#e8f0fe;border-bottom:2px solid #316ac5}
                    .tt-word.correct{color:#27ae60}
                    .tt-word.wrong{color:#e74c3c;text-decoration:line-through}
                    .tt-input{width:100%;font-size:16px;font-family:'Consolas',monospace;padding:8px;border:2px solid #d4d0c8;border-radius:4px;text-align:center}
                    .tt-input:focus{border-color:#316ac5;outline:none}
                    .tt-actions{text-align:center;margin-top:8px}
                    .tt-result{text-align:center;padding:20px;background:#f5f3e8;border:1px solid #d4d0c8;border-radius:4px;margin-top:8px}
                    .tt-result h3{color:#003c74;margin:0 0 8px}
                </style>
                <div class="tt-wrap">
                    <div class="tt-stats">
                        <div class="tt-stat"><div class="tt-stat-val" id="tt-wpm">0</div><div class="tt-stat-label">WPM</div></div>
                        <div class="tt-stat"><div class="tt-stat-val" id="tt-acc">100</div><div class="tt-stat-label">Accuracy %</div></div>
                        <div class="tt-stat"><div class="tt-stat-val" id="tt-correct">0</div><div class="tt-stat-label">Correct</div></div>
                        <div class="tt-stat"><div class="tt-stat-val" id="tt-wrong">0</div><div class="tt-stat-label">Wrong</div></div>
                    </div>
                    <div class="tt-timer" id="tt-timer">60s</div>
                    <div class="tt-words" id="tt-words"></div>
                    <input class="tt-input" id="tt-input" placeholder="Start typing..." autocomplete="off" spellcheck="false" oninput="Apps.TypingTest._onInput(this.value)" onkeydown="Apps.TypingTest._onKey(event)">
                    <div class="tt-actions">
                        <button class="xp-btn" onclick="Apps.TypingTest.restart()">Restart</button>
                        <select class="xp-select" style="font-size:10px" onchange="Apps.TypingTest._duration=+this.value;Apps.TypingTest.restart()">
                            <option value="30">30s</option><option value="60" selected>60s</option><option value="120">120s</option>
                        </select>
                    </div>
                    <div class="tt-result" id="tt-result" style="display:none"></div>
                </div>
            `,
            onReady: () => this.restart(),
            onClose: () => clearInterval(this._timer),
        });
    },

    restart() {
        clearInterval(this._timer);
        this._words = []; this._wordIdx = 0; this._correct = 0; this._wrong = 0; this._started = false; this._elapsed = 0;
        for (let i = 0; i < 80; i++) this._words.push({ text: this._wordBank[Math.floor(Math.random() * this._wordBank.length)], status: '' });
        this._renderWords();
        document.getElementById('tt-input').value = '';
        document.getElementById('tt-input').disabled = false;
        document.getElementById('tt-input').focus();
        document.getElementById('tt-timer').textContent = this._duration + 's';
        document.getElementById('tt-result').style.display = 'none';
        this._updateStats();
    },

    _renderWords() {
        const el = document.getElementById('tt-words');
        if (!el) return;
        el.innerHTML = this._words.map((w, i) => {
            let cls = 'tt-word';
            if (i === this._wordIdx) cls += ' current';
            if (w.status === 'correct') cls += ' correct';
            if (w.status === 'wrong') cls += ' wrong';
            return `<span class="${cls}">${w.text}</span>`;
        }).join(' ');
    },

    _onInput(val) {
        if (!this._started) {
            this._started = true;
            this._startTime = Date.now();
            this._timer = setInterval(() => this._tick(), 100);
        }
    },

    _onKey(e) {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            const input = document.getElementById('tt-input');
            const typed = input.value.trim();
            if (!typed) return;

            const word = this._words[this._wordIdx];
            if (typed === word.text) { word.status = 'correct'; this._correct++; }
            else { word.status = 'wrong'; this._wrong++; }

            this._wordIdx++;
            input.value = '';
            this._renderWords();
            this._updateStats();

            if (this._wordIdx >= this._words.length) this._finish();
        }
    },

    _tick() {
        this._elapsed = (Date.now() - this._startTime) / 1000;
        const remaining = Math.max(0, this._duration - this._elapsed);
        document.getElementById('tt-timer').textContent = Math.ceil(remaining) + 's';
        this._updateStats();
        if (remaining <= 0) this._finish();
    },

    _updateStats() {
        const minutes = Math.max(0.01, this._elapsed / 60);
        const wpm = Math.round(this._correct / minutes);
        const total = this._correct + this._wrong;
        const acc = total > 0 ? Math.round((this._correct / total) * 100) : 100;
        document.getElementById('tt-wpm').textContent = this._started ? wpm : 0;
        document.getElementById('tt-acc').textContent = acc;
        document.getElementById('tt-correct').textContent = this._correct;
        document.getElementById('tt-wrong').textContent = this._wrong;
    },

    _finish() {
        clearInterval(this._timer);
        document.getElementById('tt-input').disabled = true;
        const minutes = this._elapsed / 60;
        const wpm = Math.round(this._correct / minutes);
        const total = this._correct + this._wrong;
        const acc = total > 0 ? Math.round((this._correct / total) * 100) : 100;
        const result = document.getElementById('tt-result');
        result.style.display = '';
        result.innerHTML = `<h3>Results</h3><div style="font-size:36px;font-weight:bold;color:#003c74">${wpm} WPM</div><div style="margin-top:6px;font-size:12px">Accuracy: ${acc}% · ${this._correct} correct · ${this._wrong} wrong · ${Math.round(this._elapsed)}s</div>`;
    },
};
