/**
 * Radio Player — Streaming radio with station management
 */
Apps.Radio = {
    _hlsLoaded: false,
    hls: null,
    audio: null,
    stations: [],
    currentIdx: -1,

    open() {
        this._loadHLS().then(() => this._createWindow());
    },

    _js(u){return new Promise(r=>{if(document.querySelector(`script[src="${u}"]`))return r();const s=document.createElement('script');s.src=u;s.onload=r;document.head.appendChild(s);});},
    _loadHLS() {
        if (this._hlsLoaded) return Promise.resolve();
        return this._js('https://cdn.jsdelivr.net/npm/hls.js@latest').then(() => { this._hlsLoaded = true; });
    },

    async _createWindow() {
        XP.createWindow('radio', {
            title: 'Radio',
            icon: 'audio-cd.png',
            width: 500, height: 440,
            toolbar: `
                <button class="toolbar-btn" onclick="Apps.Radio.showAddDialog()"><img src="${ICON_PATH}/add.png" style="width:16px;height:16px" alt=""> Add Station</button>
                <div class="toolbar-separator"></div>
                <select class="xp-select" id="radio-filter" onchange="Apps.Radio.refresh()" style="width:120px">
                    <option value="">All</option>
                    <option value="local">Indonesia</option>
                    <option value="international">International</option>
                </select>
                <div class="toolbar-separator"></div>
                <button class="toolbar-btn" onclick="Apps.Radio.refresh()"><img src="${ICON_PATH}/forward.png" style="width:16px;height:16px" alt=""> Refresh</button>
            `,
            statusbar: '<span class="statusbar-section" id="radio-status">Select a station</span>',
            content: `
                <style>
                    .radio-player { background:#2a2a2a; padding:10px 14px; display:flex; align-items:center; gap:10px; margin:-8px -8px 8px; border-bottom:1px solid #444; }
                    .radio-player .rp-info { flex:1; color:#fff; }
                    .radio-player .rp-name { font-size:13px; font-weight:bold; }
                    .radio-player .rp-country { font-size:10px; color:#888; }
                    .radio-controls { display:flex; align-items:center; gap:6px; }
                    .radio-controls button { background:#444; color:#fff; border:1px solid #555; padding:6px 10px; cursor:pointer; font-size:14px; min-width:0; min-height:0; box-shadow:none; border-radius:3px; }
                    .radio-controls button:hover { background:#555; }
                    .radio-vol { width:80px; accent-color:#007acc; }
                    .radio-list { max-height:300px; overflow-y:auto; }
                    .radio-item { display:flex; align-items:center; gap:8px; padding:4px 8px; font-size:11px; cursor:pointer; border-bottom:1px solid #f0ece0; }
                    .radio-item:hover { background:#e8f0fe; }
                    .radio-item.active { background:#094771; color:#fff; }
                    .radio-item .ri-name { flex:1; }
                    .radio-item .ri-country { color:#888; font-size:10px; }
                    .radio-item .ri-del { color:#ccc; cursor:pointer; font-size:12px; padding:0 4px; }
                    .radio-item .ri-del:hover { color:#e53935; }
                    .radio-item .ri-edit { color:#ccc; cursor:pointer; font-size:10px; padding:0 4px; }
                    .radio-item .ri-edit:hover { color:#007acc; }
                </style>
                <div class="radio-player">
                    <div class="rp-info"><div class="rp-name" id="rp-name">No station selected</div><div class="rp-country" id="rp-country"></div></div>
                    <div class="radio-controls">
                        <button onclick="Apps.Radio.prev()">⏮</button>
                        <button onclick="Apps.Radio.togglePlay()" id="radio-play-btn">▶</button>
                        <button onclick="Apps.Radio.next()">⏭</button>
                        <input type="range" class="radio-vol" min="0" max="100" value="70" oninput="Apps.Radio.setVolume(this.value)">
                    </div>
                </div>
                <div class="radio-list" id="radio-list">Loading...</div>
            `,
            onReady: () => { this.audio = new Audio(); this.audio.volume = 0.7; this.refresh(); },
            onClose: () => { if (this.audio) { this.audio.pause(); this.audio = null; } if (this.hls) { this.hls.destroy(); this.hls = null; } },
        });
    },

    async refresh() {
        const cat = document.getElementById('radio-filter')?.value || '';
        const res = await XP.api(`/api/radio/stations${cat ? '?category=' + cat : ''}`);
        this.stations = res.data || [];
        this._renderList();
    },

    _renderList() {
        const el = document.getElementById('radio-list');
        if (!el) return;
        if (this.stations.length === 0) {
            el.innerHTML = '<div style="text-align:center;padding:30px;color:#999;font-size:11px">No stations found</div>';
            return;
        }
        let lastCountry = '';
        el.innerHTML = this.stations.map((s, i) => {
            let header = '';
            if (s.country !== lastCountry) { lastCountry = s.country; header = `<div style="font-size:9px;color:#888;padding:6px 8px 2px;text-transform:uppercase;letter-spacing:1px;border-top:1px solid #e8e4d8">${esc(s.country)}</div>`; }
            return header + `<div class="radio-item ${i === this.currentIdx ? 'active' : ''}" data-idx="${i}" ondblclick="Apps.Radio.playIdx(${i})">
                <span class="ri-name">${esc(s.name)}</span>
                <span class="ri-country">${esc(s.country)}</span>
                <span class="ri-edit" onclick="event.stopPropagation();Apps.Radio.editStation(${s.id},'${esc(s.name)}','${esc(s.url)}','${esc(s.country)}','${esc(s.category)}')" title="Edit">✏</span>
                <span class="ri-del" onclick="event.stopPropagation();Apps.Radio.deleteStation(${s.id})" title="Delete">✕</span>
            </div>`;
        }).join('');
        document.getElementById('radio-status').textContent = `${this.stations.length} station(s)`;
    },

    playIdx(idx) {
        if (idx < 0 || idx >= this.stations.length) return;
        this.currentIdx = idx;
        const s = this.stations[idx];
        this._playUrl(s.url);
        document.getElementById('rp-name').textContent = s.name;
        document.getElementById('rp-country').textContent = s.country;
        document.getElementById('radio-play-btn').textContent = '⏸';
        this._renderList();
    },

    _playUrl(url) {
        if (this.hls) { this.hls.destroy(); this.hls = null; }
        if (url.includes('.m3u8') && typeof Hls !== 'undefined' && Hls.isSupported()) {
            this.hls = new Hls();
            this.hls.loadSource(url);
            this.hls.attachMedia(this.audio);
            this.hls.on(Hls.Events.MANIFEST_PARSED, () => this.audio.play());
        } else {
            this.audio.src = url;
            this.audio.play().catch(() => {});
        }
    },

    togglePlay() {
        if (!this.audio) return;
        if (this.audio.paused) {
            if (this.currentIdx >= 0) this.audio.play();
            document.getElementById('radio-play-btn').textContent = '⏸';
        } else {
            this.audio.pause();
            document.getElementById('radio-play-btn').textContent = '▶';
        }
    },

    prev() { if (this.stations.length) this.playIdx((this.currentIdx - 1 + this.stations.length) % this.stations.length); },
    next() { if (this.stations.length) this.playIdx((this.currentIdx + 1) % this.stations.length); },
    setVolume(v) { if (this.audio) this.audio.volume = v / 100; },

    async showAddDialog() {
        const r = await XP.dialog('Add Radio Station', `
            <div style="display:flex;flex-direction:column;gap:6px;min-width:300px">
                <label style="font-size:11px">Station Name</label>
                <input class="xp-input" id="radio-add-name" placeholder="My Station">
                <label style="font-size:11px">Stream URL</label>
                <input class="xp-input" id="radio-add-url" placeholder="https://...">
                <label style="font-size:11px">Country</label>
                <input class="xp-input" id="radio-add-country" value="Indonesia">
                <label style="font-size:11px">Category</label>
                <select class="xp-select" id="radio-add-cat"><option value="local">Local</option><option value="international">International</option></select>
            </div>
        `, [{ text: 'Add', primary: true }, { text: 'Cancel' }]);
        if (r === 0) {
            const name = document.getElementById('radio-add-name')?.value?.trim();
            const url = document.getElementById('radio-add-url')?.value?.trim();
            if (!name || !url) { XP.notify('Error', 'Name and URL required'); return; }
            await XP.api('/api/radio/stations', 'POST', {
                name, url,
                country: document.getElementById('radio-add-country')?.value || 'Indonesia',
                category: document.getElementById('radio-add-cat')?.value || 'local',
            });
            XP.notify('Added', `${name} added`);
            this.refresh();
        }
    },

    async editStation(id, name, url, country, category) {
        const r = await XP.dialog('Edit Station', `
            <div style="display:flex;flex-direction:column;gap:6px;min-width:300px">
                <label style="font-size:11px">Station Name</label>
                <input class="xp-input" id="radio-edit-name" value="${esc(name)}">
                <label style="font-size:11px">Stream URL</label>
                <input class="xp-input" id="radio-edit-url" value="${esc(url)}">
                <label style="font-size:11px">Country</label>
                <input class="xp-input" id="radio-edit-country" value="${esc(country)}">
                <label style="font-size:11px">Category</label>
                <select class="xp-select" id="radio-edit-cat"><option value="local" ${category==='local'?'selected':''}>Local</option><option value="international" ${category==='international'?'selected':''}>International</option></select>
            </div>
        `, [{ text: 'Save', primary: true }, { text: 'Cancel' }]);
        if (r === 0) {
            await XP.api(`/api/radio/stations/${id}`, 'PUT', {
                name: document.getElementById('radio-edit-name')?.value,
                url: document.getElementById('radio-edit-url')?.value,
                country: document.getElementById('radio-edit-country')?.value,
                category: document.getElementById('radio-edit-cat')?.value,
            });
            XP.notify('Saved', 'Station updated');
            this.refresh();
        }
    },

    async deleteStation(id) {
        if (await XP.confirm('Delete Station', 'Delete this station?')) {
            await XP.api(`/api/radio/stations/${id}`, 'DELETE');
            this.refresh();
        }
    },
};
