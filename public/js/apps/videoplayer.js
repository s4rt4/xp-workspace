/**
 * Video Player — Retro WMP-style video player
 * Supports local files, playlist, fullscreen, playback speed
 */
Apps.VideoPlayer = {
    video: null,
    playlist: [],
    currentIdx: -1,

    open() {
        if (XP.windows['videoplayer']) { XP.focusWindow('videoplayer'); return; }

        XP.createWindow('videoplayer', {
            title: 'Video Player',
            icon: 'windows-movie-maker.png',
            width: 720, height: 540,
            content: `
                <style>
                    .vp-wrap { display:flex; flex-direction:column; height:100%; background:#0a0a0a; color:#ccc; }

                    /* Video area */
                    .vp-screen { flex:1; background:#000; display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden; cursor:pointer; min-height:0; }
                    .vp-screen video { max-width:100%; max-height:100%; }
                    .vp-screen-msg { color:#555; font-size:13px; text-align:center; }
                    .vp-screen-msg div { font-size:48px; margin-bottom:8px; }

                    /* Progress */
                    .vp-progress { height:18px; background:#111; display:flex; align-items:center; padding:0 8px; gap:4px; cursor:pointer; }
                    .vp-prog-wrap { flex:1; height:4px; background:#333; border-radius:2px; position:relative; }
                    .vp-prog-wrap:hover { height:6px; }
                    .vp-prog-bar { height:100%; background:linear-gradient(90deg,#00d4ff,#0077b6); border-radius:2px; width:0%; }
                    .vp-prog-buf { position:absolute; top:0; height:100%; background:#444; border-radius:2px; width:0%; z-index:0; }
                    .vp-prog-bar { position:relative; z-index:1; }
                    .vp-time { font-size:9px; color:#888; font-family:Consolas,monospace; min-width:70px; text-align:center; }

                    /* Controls */
                    .vp-controls { display:flex; align-items:center; padding:4px 8px; background:linear-gradient(180deg,#1a1a2e 0%,#0f1a2e 100%); gap:2px; border-top:1px solid #222; }
                    .vp-btn { background:none; border:none; color:#aaa; width:32px; height:32px; cursor:pointer; font-size:15px; display:flex; align-items:center; justify-content:center; border-radius:4px; min-width:0; min-height:0; padding:0; box-shadow:none; transition:all .1s; }
                    .vp-btn:hover { background:#1a3a5c; color:#fff; }
                    .vp-btn-play { width:38px; height:38px; font-size:18px; background:#0077b6; color:#fff; border-radius:50%; margin:0 4px; }
                    .vp-btn-play:hover { background:#0099cc; }
                    .vp-spacer { flex:1; }
                    .vp-speed { background:none; border:1px solid #333; color:#aaa; font-size:10px; padding:2px 4px; border-radius:2px; cursor:pointer; font-family:Consolas,monospace; }
                    .vp-speed:hover { border-color:#00d4ff; color:#fff; }
                    .vp-vol { display:flex; align-items:center; gap:2px; }
                    .vp-vol input { width:50px; accent-color:#00d4ff; }
                    .vp-vol-icon { font-size:13px; cursor:pointer; }

                    /* Playlist */
                    .vp-bottom { display:flex; max-height:120px; border-top:1px solid #222; }
                    .vp-pl { flex:1; overflow-y:auto; background:#0f0f1a; }
                    .vp-pl-header { display:flex; align-items:center; padding:3px 8px; background:#16213e; }
                    .vp-pl-header span { flex:1; font-size:9px; font-weight:bold; color:#666; text-transform:uppercase; }
                    .vp-pl-btn { background:none; border:1px solid #335; color:#00d4ff; padding:1px 6px; font-size:9px; cursor:pointer; border-radius:2px; min-width:0; min-height:0; box-shadow:none; margin-left:4px; }
                    .vp-pl-btn:hover { background:#1a3a5c; }
                    .vp-item { display:flex; align-items:center; padding:3px 8px; font-size:10px; cursor:pointer; border-bottom:1px solid #1a1a2e; gap:6px; }
                    .vp-item:hover { background:#1a2744; }
                    .vp-item.active { background:#0f3460; color:#00d4ff; }
                    .vp-item-name { flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
                    .vp-item-rm { color:#555; cursor:pointer; visibility:hidden; padding:0 2px; }
                    .vp-item:hover .vp-item-rm { visibility:visible; }
                    .vp-item-rm:hover { color:#e74c3c; }
                </style>
                <div class="vp-wrap">
                    <div class="vp-screen" id="vp-screen" onclick="Apps.VideoPlayer.togglePlay()" ondblclick="Apps.VideoPlayer.toggleFullscreen()">
                        <video id="vp-video" preload="metadata"></video>
                        <div class="vp-screen-msg" id="vp-msg">
                            <div>&#127916;</div>
                            Click "Open" or drag files here
                        </div>
                    </div>
                    <div class="vp-progress" onclick="Apps.VideoPlayer.seek(event)">
                        <div class="vp-prog-wrap">
                            <div class="vp-prog-buf" id="vp-buf"></div>
                            <div class="vp-prog-bar" id="vp-bar"></div>
                        </div>
                        <span class="vp-time" id="vp-time">0:00 / 0:00</span>
                    </div>
                    <div class="vp-controls">
                        <button class="vp-btn" onclick="Apps.VideoPlayer.addFiles()" title="Open files">&#128194;</button>
                        <button class="vp-btn" onclick="Apps.VideoPlayer.prev()" title="Previous">&#9198;</button>
                        <button class="vp-btn vp-btn-play" id="vp-play" onclick="Apps.VideoPlayer.togglePlay()" title="Play">&#9654;</button>
                        <button class="vp-btn" onclick="Apps.VideoPlayer.next()" title="Next">&#9197;</button>
                        <button class="vp-btn" onclick="Apps.VideoPlayer.stop()" title="Stop">&#9632;</button>
                        <div class="vp-spacer"></div>
                        <select class="vp-speed" id="vp-speed" onchange="Apps.VideoPlayer.setSpeed(this.value)" title="Playback speed">
                            <option value="0.25">0.25x</option>
                            <option value="0.5">0.5x</option>
                            <option value="0.75">0.75x</option>
                            <option value="1" selected>1x</option>
                            <option value="1.25">1.25x</option>
                            <option value="1.5">1.5x</option>
                            <option value="2">2x</option>
                        </select>
                        <div class="vp-vol">
                            <span class="vp-vol-icon" onclick="Apps.VideoPlayer.toggleMute()">&#128264;</span>
                            <input type="range" min="0" max="100" value="80" oninput="Apps.VideoPlayer.setVolume(this.value)">
                        </div>
                        <button class="vp-btn" onclick="Apps.VideoPlayer.toggleFullscreen()" title="Fullscreen">&#9974;</button>
                    </div>
                    <div class="vp-bottom">
                        <div class="vp-pl" style="width:100%">
                            <div class="vp-pl-header">
                                <span>Playlist (<span id="vp-count">0</span>)</span>
                                <button class="vp-pl-btn" onclick="Apps.VideoPlayer.addFiles()">+ Add</button>
                                <button class="vp-pl-btn" onclick="Apps.VideoPlayer.clearPlaylist()">Clear</button>
                            </div>
                            <div id="vp-playlist"></div>
                        </div>
                    </div>
                    <input type="file" id="vp-file-input" accept="video/*" multiple style="display:none">
                </div>
            `,
            onReady: () => {
                this.video = document.getElementById('vp-video');
                this.video.volume = 0.8;
                this.video.addEventListener('ended', () => this.next());
                this.video.addEventListener('timeupdate', () => this._updateProgress());
                this.video.addEventListener('progress', () => this._updateBuffer());
                this.video.addEventListener('play', () => { document.getElementById('vp-play').innerHTML = '&#9646;&#9646;'; document.getElementById('vp-msg').style.display = 'none'; });
                this.video.addEventListener('pause', () => { document.getElementById('vp-play').innerHTML = '&#9654;'; });

                document.getElementById('vp-file-input').addEventListener('change', (e) => this._onFilesAdded(e));

                // Drag & drop
                const screen = document.getElementById('vp-screen');
                screen.addEventListener('dragover', (e) => { e.preventDefault(); screen.style.borderColor = '#00d4ff'; });
                screen.addEventListener('dragleave', () => { screen.style.borderColor = ''; });
                screen.addEventListener('drop', (e) => {
                    e.preventDefault();
                    screen.style.borderColor = '';
                    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('video/'));
                    if (files.length) this._addFiles(files);
                });

                // Keyboard
                document.getElementById('videoplayer')?.addEventListener('keydown', (e) => {
                    if (e.code === 'Space') { e.preventDefault(); this.togglePlay(); }
                    if (e.code === 'ArrowLeft') { this.video.currentTime -= 5; }
                    if (e.code === 'ArrowRight') { this.video.currentTime += 5; }
                    if (e.code === 'ArrowUp') { this.video.volume = Math.min(1, this.video.volume + 0.05); }
                    if (e.code === 'ArrowDown') { this.video.volume = Math.max(0, this.video.volume - 0.05); }
                    if (e.key === 'f' || e.key === 'F') this.toggleFullscreen();
                });
            },
            onClose: () => {
                if (this.video) { this.video.pause(); this.video.src = ''; }
            },
        });
    },

    addFiles() { document.getElementById('vp-file-input').click(); },

    _onFilesAdded(e) {
        this._addFiles(Array.from(e.target.files));
        e.target.value = '';
    },

    _addFiles(files) {
        files.forEach(f => {
            this.playlist.push({ name: f.name.replace(/\.[^.]+$/, ''), url: URL.createObjectURL(f), file: f });
        });
        this._renderPlaylist();
        if (this.currentIdx === -1 && this.playlist.length > 0) this.play(0);
    },

    _renderPlaylist() {
        const el = document.getElementById('vp-playlist');
        const count = document.getElementById('vp-count');
        if (count) count.textContent = this.playlist.length;
        if (!el) return;
        if (this.playlist.length === 0) { el.innerHTML = ''; return; }

        el.innerHTML = this.playlist.map((t, i) => `
            <div class="vp-item${i === this.currentIdx ? ' active' : ''}" ondblclick="Apps.VideoPlayer.play(${i})">
                <span style="width:16px;text-align:center;color:#555;font-size:9px">${i === this.currentIdx ? '&#9654;' : i + 1}</span>
                <span class="vp-item-name">${this._esc(t.name)}</span>
                <span class="vp-item-rm" onclick="event.stopPropagation();Apps.VideoPlayer.removeTrack(${i})">&times;</span>
            </div>
        `).join('');
    },

    play(idx) {
        if (idx < 0 || idx >= this.playlist.length) return;
        this.currentIdx = idx;
        const track = this.playlist[idx];
        this.video.src = track.url;
        this.video.play();
        this._renderPlaylist();
        // Update window title
        const titleEl = document.querySelector('#videoplayer .window-title span');
        if (titleEl) titleEl.textContent = 'Video Player — ' + track.name;
    },

    togglePlay() {
        if (!this.video.src || this.video.src === location.href) {
            if (this.playlist.length > 0) this.play(0);
            return;
        }
        this.video.paused ? this.video.play() : this.video.pause();
    },

    stop() {
        if (!this.video) return;
        this.video.pause();
        this.video.currentTime = 0;
    },

    next() {
        if (this.playlist.length === 0) return;
        let idx = this.currentIdx + 1;
        if (idx >= this.playlist.length) idx = 0;
        this.play(idx);
    },

    prev() {
        if (this.playlist.length === 0) return;
        if (this.video.currentTime > 3) { this.video.currentTime = 0; return; }
        let idx = this.currentIdx - 1;
        if (idx < 0) idx = this.playlist.length - 1;
        this.play(idx);
    },

    seek(e) {
        const wrap = e.currentTarget.querySelector('.vp-prog-wrap') || e.currentTarget;
        const rect = wrap.getBoundingClientRect();
        const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        if (this.video.duration) this.video.currentTime = pct * this.video.duration;
    },

    setVolume(v) { if (this.video) this.video.volume = v / 100; },
    setSpeed(v) { if (this.video) this.video.playbackRate = parseFloat(v); },

    toggleMute() {
        if (!this.video) return;
        this.video.muted = !this.video.muted;
        document.querySelector('.vp-vol-icon').innerHTML = this.video.muted ? '&#128263;' : '&#128264;';
    },

    toggleFullscreen() {
        const screen = document.getElementById('vp-screen');
        if (!screen) return;
        if (document.fullscreenElement) document.exitFullscreen();
        else screen.requestFullscreen().catch(() => {});
    },

    removeTrack(idx) {
        if (idx === this.currentIdx) { this.video.pause(); this.video.src = ''; this.currentIdx = -1; document.getElementById('vp-msg').style.display = ''; }
        else if (idx < this.currentIdx) this.currentIdx--;
        URL.revokeObjectURL(this.playlist[idx].url);
        this.playlist.splice(idx, 1);
        this._renderPlaylist();
    },

    clearPlaylist() {
        this.video.pause(); this.video.src = '';
        this.playlist.forEach(t => URL.revokeObjectURL(t.url));
        this.playlist = []; this.currentIdx = -1;
        this._renderPlaylist();
        document.getElementById('vp-msg').style.display = '';
        document.getElementById('vp-play').innerHTML = '&#9654;';
        const titleEl = document.querySelector('#videoplayer .window-title span');
        if (titleEl) titleEl.textContent = 'Video Player';
    },

    _updateProgress() {
        if (!this.video.duration) return;
        const pct = (this.video.currentTime / this.video.duration) * 100;
        const bar = document.getElementById('vp-bar');
        const time = document.getElementById('vp-time');
        if (bar) bar.style.width = pct + '%';
        if (time) time.textContent = this._fmt(this.video.currentTime) + ' / ' + this._fmt(this.video.duration);
    },

    _updateBuffer() {
        if (!this.video.buffered.length) return;
        const buf = (this.video.buffered.end(this.video.buffered.length - 1) / this.video.duration) * 100;
        const el = document.getElementById('vp-buf');
        if (el) el.style.width = buf + '%';
    },

    _fmt(s) {
        if (!s || isNaN(s)) return '0:00';
        const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
        return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}` : `${m}:${String(sec).padStart(2,'0')}`;
    },

    _esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); },
};
