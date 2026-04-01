/**
 * Music Player — Retro WMP-style audio player
 * Supports local files, playlist, visualizer, shuffle/repeat
 */
Apps.MusicPlayer = {
    audio: null,
    playlist: [],
    currentIdx: -1,
    shuffle: false,
    repeat: 'none', // 'none', 'all', 'one'
    _animFrame: null,
    _analyser: null,
    _audioCtx: null,
    _source: null,

    open() {
        if (XP.windows['musicplayer']) { XP.focusWindow('musicplayer'); return; }

        if (!this.audio) {
            this.audio = new Audio();
            this.audio.addEventListener('ended', () => this.next());
            this.audio.addEventListener('timeupdate', () => this._updateProgress());
            this.audio.addEventListener('loadedmetadata', () => this._updateDuration());
        }

        XP.createWindow('musicplayer', {
            title: 'Music Player',
            icon: 'windows-media-player-9.png',
            width: 480, height: 520,
            content: `
                <style>
                    .mp-wrap { display:flex; flex-direction:column; height:100%; background:#1a1a2e; color:#e0e0e0; }

                    /* Visualizer */
                    .mp-viz { height:140px; background:linear-gradient(180deg,#0a0a1a 0%,#1a1a2e 100%); border-bottom:1px solid #333; position:relative; overflow:hidden; }
                    .mp-viz canvas { width:100%; height:100%; }
                    .mp-viz-label { position:absolute; bottom:6px; left:10px; font-size:10px; color:#555; }

                    /* Now playing */
                    .mp-now { padding:8px 12px; background:#16213e; border-bottom:1px solid #333; text-align:center; }
                    .mp-title { font-size:13px; font-weight:bold; color:#00d4ff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
                    .mp-artist { font-size:10px; color:#888; }

                    /* Progress */
                    .mp-progress { padding:4px 12px; display:flex; align-items:center; gap:6px; background:#16213e; }
                    .mp-time { font-size:10px; color:#888; font-family:Consolas,monospace; width:38px; }
                    .mp-bar-wrap { flex:1; height:6px; background:#333; border-radius:3px; cursor:pointer; position:relative; }
                    .mp-bar { height:100%; background:linear-gradient(90deg,#00d4ff,#0099cc); border-radius:3px; width:0%; transition:width .1s; }

                    /* Controls */
                    .mp-controls { display:flex; align-items:center; justify-content:center; gap:4px; padding:8px; background:#0f3460; }
                    .mp-btn { background:none; border:1px solid #335; color:#ccc; width:36px; height:36px; border-radius:50%; cursor:pointer; font-size:16px; display:flex; align-items:center; justify-content:center; transition:all .15s; min-width:0; min-height:0; padding:0; box-shadow:none; }
                    .mp-btn:hover { background:#1a5276; border-color:#00d4ff; color:#fff; }
                    .mp-btn.active { color:#00d4ff; border-color:#00d4ff; }
                    .mp-btn-play { width:44px; height:44px; font-size:20px; background:#0099cc; border-color:#00d4ff; color:#fff; }
                    .mp-btn-play:hover { background:#00b8e6; }
                    .mp-vol { display:flex; align-items:center; gap:4px; margin-left:8px; }
                    .mp-vol input { width:60px; accent-color:#00d4ff; }
                    .mp-vol-icon { font-size:14px; cursor:pointer; }

                    /* Playlist */
                    .mp-playlist { flex:1; overflow-y:auto; background:#111; }
                    .mp-pl-header { display:flex; align-items:center; padding:4px 10px; background:#16213e; border-top:1px solid #333; border-bottom:1px solid #333; }
                    .mp-pl-header span { flex:1; font-size:10px; font-weight:bold; color:#888; text-transform:uppercase; }
                    .mp-pl-add { background:none; border:1px solid #335; color:#00d4ff; padding:2px 8px; font-size:10px; cursor:pointer; border-radius:2px; min-width:0; min-height:0; box-shadow:none; }
                    .mp-pl-add:hover { background:#1a5276; }
                    .mp-item { display:flex; align-items:center; padding:5px 10px; font-size:11px; cursor:pointer; border-bottom:1px solid #1a1a2e; gap:8px; }
                    .mp-item:hover { background:#1a2744; }
                    .mp-item.active { background:#0f3460; color:#00d4ff; }
                    .mp-item-idx { width:20px; color:#555; text-align:right; font-size:10px; }
                    .mp-item-name { flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
                    .mp-item-dur { color:#666; font-size:10px; font-family:Consolas,monospace; }
                    .mp-item-rm { color:#555; cursor:pointer; font-size:12px; padding:2px; visibility:hidden; }
                    .mp-item:hover .mp-item-rm { visibility:visible; }
                    .mp-item-rm:hover { color:#e74c3c; }
                    .mp-empty { padding:30px; text-align:center; color:#555; font-size:12px; }
                </style>
                <div class="mp-wrap">
                    <div class="mp-viz">
                        <canvas id="mp-canvas"></canvas>
                        <div class="mp-viz-label">XP Media Player</div>
                    </div>
                    <div class="mp-now">
                        <div class="mp-title" id="mp-title">No track loaded</div>
                        <div class="mp-artist" id="mp-artist">Add music files to get started</div>
                    </div>
                    <div class="mp-progress">
                        <span class="mp-time" id="mp-cur">0:00</span>
                        <div class="mp-bar-wrap" onclick="Apps.MusicPlayer.seek(event)">
                            <div class="mp-bar" id="mp-bar"></div>
                        </div>
                        <span class="mp-time" id="mp-dur">0:00</span>
                    </div>
                    <div class="mp-controls">
                        <button class="mp-btn" id="mp-shuf" onclick="Apps.MusicPlayer.toggleShuffle()" title="Shuffle">&#8645;</button>
                        <button class="mp-btn" onclick="Apps.MusicPlayer.prev()" title="Previous">&#9198;</button>
                        <button class="mp-btn mp-btn-play" id="mp-play" onclick="Apps.MusicPlayer.togglePlay()" title="Play">&#9654;</button>
                        <button class="mp-btn" onclick="Apps.MusicPlayer.next()" title="Next">&#9197;</button>
                        <button class="mp-btn" id="mp-rep" onclick="Apps.MusicPlayer.toggleRepeat()" title="Repeat">&#128257;</button>
                        <div class="mp-vol">
                            <span class="mp-vol-icon" onclick="Apps.MusicPlayer.toggleMute()">&#128264;</span>
                            <input type="range" min="0" max="100" value="80" oninput="Apps.MusicPlayer.setVolume(this.value)">
                        </div>
                    </div>
                    <div class="mp-pl-header">
                        <span>Playlist (<span id="mp-count">0</span> tracks)</span>
                        <button class="mp-pl-add" onclick="Apps.MusicPlayer.addFiles()">+ Add Files</button>
                        <button class="mp-pl-add" onclick="Apps.MusicPlayer.clearPlaylist()" style="margin-left:4px">Clear</button>
                    </div>
                    <div class="mp-playlist" id="mp-playlist">
                        <div class="mp-empty">Click "Add Files" to load music</div>
                    </div>
                    <input type="file" id="mp-file-input" accept="audio/*" multiple style="display:none">
                </div>
            `,
            onReady: () => {
                this.audio.volume = 0.8;
                document.getElementById('mp-file-input').addEventListener('change', (e) => this._onFilesAdded(e));
                this._initVisualizer();
                this._renderPlaylist();
            },
            onClose: () => {
                cancelAnimationFrame(this._animFrame);
            },
        });
    },

    addFiles() { document.getElementById('mp-file-input').click(); },

    _onFilesAdded(e) {
        const files = Array.from(e.target.files);
        files.forEach(f => {
            this.playlist.push({
                name: f.name.replace(/\.[^.]+$/, ''),
                file: f,
                url: URL.createObjectURL(f),
                duration: 0,
            });
        });
        e.target.value = '';
        this._renderPlaylist();
        if (this.currentIdx === -1 && this.playlist.length > 0) {
            this.play(0);
        }
    },

    _renderPlaylist() {
        const el = document.getElementById('mp-playlist');
        const count = document.getElementById('mp-count');
        if (!el) return;
        if (count) count.textContent = this.playlist.length;

        if (this.playlist.length === 0) {
            el.innerHTML = '<div class="mp-empty">Click "Add Files" to load music</div>';
            return;
        }

        el.innerHTML = this.playlist.map((t, i) => `
            <div class="mp-item${i === this.currentIdx ? ' active' : ''}" ondblclick="Apps.MusicPlayer.play(${i})">
                <span class="mp-item-idx">${i === this.currentIdx ? '&#9654;' : i + 1}</span>
                <span class="mp-item-name">${this._esc(t.name)}</span>
                <span class="mp-item-dur">${t.duration ? this._fmt(t.duration) : ''}</span>
                <span class="mp-item-rm" onclick="event.stopPropagation();Apps.MusicPlayer.removeTrack(${i})" title="Remove">&times;</span>
            </div>
        `).join('');
    },

    play(idx) {
        if (idx < 0 || idx >= this.playlist.length) return;
        this.currentIdx = idx;
        const track = this.playlist[idx];
        this.audio.src = track.url;
        this.audio.play();
        document.getElementById('mp-play').innerHTML = '&#9646;&#9646;';
        document.getElementById('mp-title').textContent = track.name;
        document.getElementById('mp-artist').textContent = `Track ${idx + 1} of ${this.playlist.length}`;
        this._renderPlaylist();
        this._connectAnalyser();
    },

    togglePlay() {
        if (!this.audio.src) {
            if (this.playlist.length > 0) this.play(0);
            return;
        }
        if (this.audio.paused) {
            this.audio.play();
            document.getElementById('mp-play').innerHTML = '&#9646;&#9646;';
        } else {
            this.audio.pause();
            document.getElementById('mp-play').innerHTML = '&#9654;';
        }
    },

    next() {
        if (this.playlist.length === 0) return;
        if (this.repeat === 'one') { this.play(this.currentIdx); return; }
        let idx;
        if (this.shuffle) {
            idx = Math.floor(Math.random() * this.playlist.length);
        } else {
            idx = this.currentIdx + 1;
            if (idx >= this.playlist.length) {
                if (this.repeat === 'all') idx = 0; else return;
            }
        }
        this.play(idx);
    },

    prev() {
        if (this.playlist.length === 0) return;
        if (this.audio.currentTime > 3) { this.audio.currentTime = 0; return; }
        let idx = this.currentIdx - 1;
        if (idx < 0) idx = this.repeat === 'all' ? this.playlist.length - 1 : 0;
        this.play(idx);
    },

    seek(e) {
        const rect = e.currentTarget.getBoundingClientRect();
        const pct = (e.clientX - rect.left) / rect.width;
        if (this.audio.duration) this.audio.currentTime = pct * this.audio.duration;
    },

    setVolume(v) { this.audio.volume = v / 100; },
    toggleMute() {
        this.audio.muted = !this.audio.muted;
        document.querySelector('.mp-vol-icon').innerHTML = this.audio.muted ? '&#128263;' : '&#128264;';
    },

    toggleShuffle() {
        this.shuffle = !this.shuffle;
        document.getElementById('mp-shuf').classList.toggle('active', this.shuffle);
    },

    toggleRepeat() {
        const modes = ['none', 'all', 'one'];
        this.repeat = modes[(modes.indexOf(this.repeat) + 1) % 3];
        const btn = document.getElementById('mp-rep');
        btn.classList.toggle('active', this.repeat !== 'none');
        btn.title = this.repeat === 'one' ? 'Repeat One' : this.repeat === 'all' ? 'Repeat All' : 'Repeat Off';
        btn.innerHTML = this.repeat === 'one' ? '&#128258;' : '&#128257;';
    },

    removeTrack(idx) {
        if (idx === this.currentIdx) { this.audio.pause(); this.audio.src = ''; this.currentIdx = -1; }
        else if (idx < this.currentIdx) this.currentIdx--;
        URL.revokeObjectURL(this.playlist[idx].url);
        this.playlist.splice(idx, 1);
        this._renderPlaylist();
        if (this.playlist.length === 0) {
            document.getElementById('mp-title').textContent = 'No track loaded';
            document.getElementById('mp-play').innerHTML = '&#9654;';
        }
    },

    clearPlaylist() {
        this.audio.pause(); this.audio.src = '';
        this.playlist.forEach(t => URL.revokeObjectURL(t.url));
        this.playlist = []; this.currentIdx = -1;
        this._renderPlaylist();
        document.getElementById('mp-title').textContent = 'No track loaded';
        document.getElementById('mp-artist').textContent = 'Add music files to get started';
        document.getElementById('mp-play').innerHTML = '&#9654;';
        document.getElementById('mp-bar').style.width = '0%';
        document.getElementById('mp-cur').textContent = '0:00';
        document.getElementById('mp-dur').textContent = '0:00';
    },

    _updateProgress() {
        if (!this.audio.duration) return;
        const pct = (this.audio.currentTime / this.audio.duration) * 100;
        const bar = document.getElementById('mp-bar');
        const cur = document.getElementById('mp-cur');
        if (bar) bar.style.width = pct + '%';
        if (cur) cur.textContent = this._fmt(this.audio.currentTime);
    },

    _updateDuration() {
        const dur = document.getElementById('mp-dur');
        if (dur) dur.textContent = this._fmt(this.audio.duration);
        if (this.currentIdx >= 0) {
            this.playlist[this.currentIdx].duration = this.audio.duration;
        }
    },

    /* ── Visualizer ── */
    _initVisualizer() {
        const canvas = document.getElementById('mp-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;

        const resize = () => {
            const rect = canvas.parentElement.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
        };
        resize();

        const draw = () => {
            this._animFrame = requestAnimationFrame(draw);
            const w = canvas.width / dpr, h = canvas.height / dpr;
            ctx.fillStyle = '#0a0a1a';
            ctx.fillRect(0, 0, w, h);

            if (!this._analyser || this.audio.paused) {
                // Idle animation
                const t = Date.now() / 1000;
                ctx.strokeStyle = '#1a3a5c';
                ctx.lineWidth = 1;
                for (let i = 0; i < 3; i++) {
                    ctx.beginPath();
                    for (let x = 0; x < w; x++) {
                        const y = h/2 + Math.sin(x/30 + t*(1+i*0.3)) * (8 + i*4);
                        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                    }
                    ctx.stroke();
                }
                return;
            }

            const bufLen = this._analyser.frequencyBinCount;
            const data = new Uint8Array(bufLen);
            this._analyser.getByteFrequencyData(data);

            const barW = (w / bufLen) * 2.5;
            for (let i = 0; i < bufLen; i++) {
                const barH = (data[i] / 255) * h;
                const hue = (i / bufLen) * 200 + 180;
                ctx.fillStyle = `hsla(${hue}, 80%, 55%, 0.9)`;
                ctx.fillRect(i * barW, h - barH, barW - 1, barH);
            }
        };
        draw();
    },

    _connectAnalyser() {
        try {
            if (!this._audioCtx) this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (this._audioCtx.state === 'suspended') this._audioCtx.resume();

            if (!this._source) {
                this._source = this._audioCtx.createMediaElementSource(this.audio);
                this._analyser = this._audioCtx.createAnalyser();
                this._analyser.fftSize = 256;
                this._source.connect(this._analyser);
                this._analyser.connect(this._audioCtx.destination);
            }
        } catch (e) { /* Analyser optional */ }
    },

    _fmt(s) {
        if (!s || isNaN(s)) return '0:00';
        const m = Math.floor(s / 60), sec = Math.floor(s % 60);
        return m + ':' + String(sec).padStart(2, '0');
    },

    _esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); },
};
