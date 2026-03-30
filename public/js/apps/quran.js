/**
 * Quran App — Digital Quran with audio, tafsir, doa, shalat schedule
 * Uses equran.id public API
 */
Apps.Quran = {
    currentSurah: null,
    audio: null,
    qaris: [
        { id: '01', name: 'Abdullah Al-Juhany' },
        { id: '02', name: 'Abdul Muhsin Al-Qasim' },
        { id: '03', name: 'Abdurrahman As-Sudais' },
        { id: '04', name: 'Ibrahim Al-Dossari' },
        { id: '05', name: 'Misyari Rasyid Al-Afasy' },
    ],
    selectedQari: '05',

    open() {
        XP.createWindow('quran', {
            title: 'Quran',
            icon: 'quran.png',
            width: 850, height: 560,
            content: `
                <style>
                    .qr-layout { display:flex; height:100%; margin:-8px; }
                    .qr-sidebar { width:80px; background:#1a472a; display:flex; flex-direction:column; align-items:center; padding:8px 0; gap:4px; flex-shrink:0; }
                    .qr-nav-btn { width:56px; padding:8px 4px; text-align:center; color:#a0d8b4; font-size:9px; cursor:pointer; border-radius:4px; border:none; background:transparent; min-width:0; min-height:0; box-shadow:none; }
                    .qr-nav-btn:hover { background:rgba(255,255,255,0.1); }
                    .qr-nav-btn.active { background:rgba(255,255,255,0.15); color:#fff; }
                    .qr-nav-btn .qr-nav-icon { font-size:20px; display:block; margin-bottom:2px; }
                    .qr-main { flex:1; display:flex; flex-direction:column; min-width:0; }
                    .qr-header { background:#f5f3e8; padding:6px 12px; border-bottom:1px solid #d4d0c8; display:flex; align-items:center; gap:8px; flex-shrink:0; }
                    .qr-body { flex:1; overflow-y:auto; padding:12px; }
                    .qr-surah-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:6px; }
                    .qr-surah-card { background:#fff; border:1px solid #d4d0c8; padding:8px 10px; cursor:pointer; border-radius:3px; font-size:11px; }
                    .qr-surah-card:hover { border-color:#316ac5; background:#f0f6ff; }
                    .qr-surah-card .qs-num { color:#003c74; font-weight:bold; margin-right:6px; }
                    .qr-surah-card .qs-name { font-weight:bold; }
                    .qr-surah-card .qs-info { color:#888; font-size:10px; margin-top:2px; }
                    .qr-ayah { padding:10px 0; border-bottom:1px solid #f0ece0; }
                    .qr-ayah-arab { font-family:'Amiri','Traditional Arabic',serif; font-size:26px; text-align:right; direction:rtl; line-height:2; color:#1a472a; margin-bottom:6px; }
                    .qr-ayah-latin { font-size:11px; color:#666; font-style:italic; margin-bottom:4px; }
                    .qr-ayah-trans { font-size:12px; line-height:1.6; }
                    .qr-ayah-num { color:#003c74; font-weight:bold; font-size:10px; margin-bottom:4px; }
                    .qr-ayah-actions { display:flex; gap:4px; margin-top:4px; }
                    .qr-ayah-actions button { font-size:10px; padding:1px 6px; min-width:0; min-height:0; box-shadow:none; background:#f5f3e8; border:1px solid #d4d0c8; cursor:pointer; border-radius:2px; }
                    .qr-ayah-actions button:hover { background:#e8f0fe; }
                    .qr-player { background:#1a472a; color:#fff; padding:6px 12px; display:flex; align-items:center; gap:8px; flex-shrink:0; font-size:11px; }
                    .qr-player button { background:#2a6a3e; color:#fff; border:1px solid #3a8a4e; padding:4px 10px; cursor:pointer; min-width:0; min-height:0; box-shadow:none; border-radius:3px; font-size:12px; }
                    .qr-player button:hover { background:#3a8a4e; }
                    .qr-player select { font-size:10px; padding:2px; background:#2a6a3e; color:#fff; border:1px solid #3a8a4e; border-radius:3px; min-width:0; min-height:0; box-shadow:none; }
                    .qr-doa-item { padding:10px; border-bottom:1px solid #f0ece0; cursor:pointer; }
                    .qr-doa-item:hover { background:#f0f6ff; }
                    .qr-doa-item .doa-title { font-weight:bold; font-size:12px; color:#003c74; }
                </style>
                <div class="qr-layout">
                    <div class="qr-sidebar">
                        <button class="qr-nav-btn active" data-view="surah" onclick="Apps.Quran.showView('surah')"><span class="qr-nav-icon">📖</span>Quran</button>
                        <button class="qr-nav-btn" data-view="doa" onclick="Apps.Quran.showView('doa')"><span class="qr-nav-icon">🤲</span>Doa</button>
                        <button class="qr-nav-btn" data-view="shalat" onclick="Apps.Quran.showView('shalat')"><span class="qr-nav-icon">🕌</span>Shalat</button>
                        <button class="qr-nav-btn" data-view="search" onclick="Apps.Quran.showView('search')"><span class="qr-nav-icon">🔍</span>Search</button>
                    </div>
                    <div class="qr-main">
                        <div class="qr-header" id="qr-header">
                            <strong>Al-Quran Digital</strong>
                            <span style="flex:1"></span>
                            <select class="xp-select" id="qr-qari" onchange="Apps.Quran.selectedQari=this.value" style="font-size:10px;max-width:160px">${this.qaris.map(q => `<option value="${q.id}" ${q.id===this.selectedQari?'selected':''}>${q.name}</option>`).join('')}</select>
                        </div>
                        <div class="qr-body" id="qr-body">Loading...</div>
                        <div class="qr-player" id="qr-player" style="display:none">
                            <button onclick="Apps.Quran.toggleAudio()" id="qr-play-btn">▶</button>
                            <span id="qr-now-playing">-</span>
                        </div>
                    </div>
                </div>
            `,
            onReady: () => { this.audio = new Audio(); this.showView('surah'); },
            onClose: () => { if (this.audio) { this.audio.pause(); this.audio = null; } },
        });
    },

    showView(view) {
        document.querySelectorAll('.qr-nav-btn').forEach(b => b.classList.toggle('active', b.dataset.view === view));
        if (view === 'surah') this._loadSurahList();
        else if (view === 'doa') this._loadDoa();
        else if (view === 'shalat') this._loadShalat();
        else if (view === 'search') this._showSearch();
    },

    // ── Surah List ──
    async _loadSurahList() {
        const body = document.getElementById('qr-body');
        body.innerHTML = '<div style="text-align:center;padding:20px;color:#888">Loading surahs...</div>';
        try {
            const res = await fetch('${BASE_URL}/api/proxy/quran?path=v2/surat');
            const data = await res.json();
            const surahs = data.data || [];
            body.innerHTML = `<div class="qr-surah-grid">${surahs.map(s => `
                <div class="qr-surah-card" onclick="Apps.Quran.loadSurah(${s.nomor})">
                    <span class="qs-num">${s.nomor}.</span>
                    <span class="qs-name">${esc(s.namaLatin)}</span>
                    <div class="qs-info">${esc(s.arti)} • ${s.jumlahAyat} ayat • ${esc(s.tempatTurun)}</div>
                </div>
            `).join('')}</div>`;
        } catch (e) { body.innerHTML = '<div style="color:red;padding:20px">Failed to load surahs</div>'; }
    },

    // ── Read Surah ──
    async loadSurah(nomor) {
        const body = document.getElementById('qr-body');
        body.innerHTML = '<div style="text-align:center;padding:20px;color:#888">Loading...</div>';
        try {
            const res = await fetch(`${BASE_URL}/api/proxy/quran?path=v2/surat/${nomor}`);
            const data = await res.json();
            const surah = data.data;
            this.currentSurah = surah;

            const header = document.getElementById('qr-header');
            header.innerHTML = `<button class="xp-btn" onclick="Apps.Quran._loadSurahList()" style="font-size:10px;padding:2px 8px;min-width:0;min-height:0;box-shadow:none">← Back</button>
                <strong>${surah.nomor}. ${esc(surah.namaLatin)}</strong> <span style="color:#888;font-size:10px">${esc(surah.arti)} • ${surah.jumlahAyat} ayat</span>
                <span style="flex:1"></span>
                <select class="xp-select" id="qr-qari" onchange="Apps.Quran.selectedQari=this.value" style="font-size:10px;max-width:160px">${this.qaris.map(q => `<option value="${q.id}" ${q.id===this.selectedQari?'selected':''}>${q.name}</option>`).join('')}</select>`;

            body.innerHTML = surah.ayat.map(a => `
                <div class="qr-ayah">
                    <div class="qr-ayah-num">Ayat ${a.nomorAyat}</div>
                    <div class="qr-ayah-arab">${a.teksArab}</div>
                    <div class="qr-ayah-latin">${a.teksLatin || ''}</div>
                    <div class="qr-ayah-trans">${a.teksIndonesia || ''}</div>
                    <div class="qr-ayah-actions">
                        <button onclick="Apps.Quran.playAyah(${nomor},${a.nomorAyat})">▶ Play</button>
                    </div>
                </div>
            `).join('');

            document.getElementById('qr-player').style.display = 'flex';
        } catch (e) { body.innerHTML = '<div style="color:red;padding:20px">Failed to load surah</div>'; }
    },

    // ── Audio ──
    playAyah(surah, ayah) {
        const url = `${BASE_URL}/api/proxy/quran?path=v2/surat/${surah}`;
        // Fetch surah to get audio URL for specific qari
        fetch(url).then(r => r.json()).then(data => {
            const ayahData = data.data.ayat.find(a => a.nomorAyat === ayah);
            if (!ayahData?.audio?.[this.selectedQari]) return;
            this.audio.src = ayahData.audio[this.selectedQari];
            this.audio.play();
            document.getElementById('qr-now-playing').textContent = `Surah ${surah}, Ayat ${ayah}`;
            document.getElementById('qr-play-btn').textContent = '⏸';
        });
    },

    toggleAudio() {
        if (!this.audio) return;
        if (this.audio.paused) { this.audio.play(); document.getElementById('qr-play-btn').textContent = '⏸'; }
        else { this.audio.pause(); document.getElementById('qr-play-btn').textContent = '▶'; }
    },

    // ── Doa ──
    async _loadDoa() {
        const body = document.getElementById('qr-body');
        body.innerHTML = '<div style="text-align:center;padding:20px;color:#888">Loading doa...</div>';
        try {
            const res = await fetch('${BASE_URL}/api/proxy/quran?path=doa');
            const json = await res.json();
            const doas = json.data || json || [];
            body.innerHTML = doas.map((d, i) => `
                <div class="qr-doa-item" onclick="this.querySelector('.doa-detail').style.display=this.querySelector('.doa-detail').style.display==='none'?'block':'none'">
                    <div class="doa-title">${i + 1}. ${esc(d.nama || d.judul || '')}</div>
                    <div class="doa-detail" style="display:none;margin-top:8px">
                        <div style="font-family:'Amiri',serif;font-size:22px;text-align:right;direction:rtl;line-height:2;color:#1a472a;margin-bottom:6px">${d.ar || d.arab || ''}</div>
                        <div style="font-size:11px;color:#666;font-style:italic;margin-bottom:4px">${d.latin || d.tr || ''}</div>
                        <div style="font-size:12px;line-height:1.5">${d.idn || d.artinya || ''}</div>
                    </div>
                </div>
            `).join('');
        } catch (e) { body.innerHTML = '<div style="color:red;padding:20px">Failed to load doa</div>'; }
    },

    // ── Shalat Schedule ──
    async _loadShalat() {
        const body = document.getElementById('qr-body');
        body.innerHTML = `<div style="padding:12px">
            <h3 style="font-size:13px;color:#003c74;margin-bottom:8px">Jadwal Shalat</h3>
            <div style="display:flex;gap:8px;margin-bottom:8px">
                <div style="flex:1">
                    <label style="font-size:10px;color:#666">Provinsi</label>
                    <select class="xp-select" id="qr-provinsi" style="width:100%" onchange="Apps.Quran._loadKota()"><option>Loading...</option></select>
                </div>
                <div style="flex:1">
                    <label style="font-size:10px;color:#666">Kota</label>
                    <select class="xp-select" id="qr-kota" style="width:100%"><option>Select provinsi first</option></select>
                </div>
            </div>
            <button class="xp-btn xp-btn-primary" onclick="Apps.Quran._getShalat()">Get Schedule</button>
            <div id="qr-shalat-result" style="margin-top:10px"></div>
        </div>`;
        try {
            const res = await fetch(`${BASE_URL}/api/proxy/quran?path=v2/shalat/provinsi`);
            const data = await res.json();
            const sel = document.getElementById('qr-provinsi');
            sel.innerHTML = (data.data || []).map(p => `<option value="${esc(p)}">${esc(p)}</option>`).join('');
            this._loadKota();
        } catch { document.getElementById('qr-provinsi').innerHTML = '<option>Failed to load</option>'; }
    },

    async _loadKota() {
        const prov = document.getElementById('qr-provinsi')?.value;
        if (!prov) return;
        const sel = document.getElementById('qr-kota');
        sel.innerHTML = '<option>Loading...</option>';
        try {
            const res = await fetch(`${BASE_URL}/api/proxy/quran?path=v2/shalat/kabkota?provinsi=${encodeURIComponent(prov)}`);
            const data = await res.json();
            sel.innerHTML = (data.data || []).map(k => `<option value="${k.id}">${esc(k.lokasi)}</option>`).join('');
        } catch { sel.innerHTML = '<option>Failed to load</option>'; }
    },

    async _getShalat() {
        const kota = document.getElementById('qr-kota')?.value;
        if (!kota) return;
        const today = new Date();
        const dateStr = `${today.getFullYear()}/${String(today.getMonth()+1).padStart(2,'0')}/${String(today.getDate()).padStart(2,'0')}`;
        const el = document.getElementById('qr-shalat-result');
        el.innerHTML = '<div style="color:#888">Loading...</div>';
        try {
            const res = await fetch(`${BASE_URL}/api/proxy/quran?path=v2/shalat/jadwal/${kota}/${dateStr}`);
            const data = await res.json();
            const j = data.data?.jadwal;
            if (!j) { el.innerHTML = '<div style="color:#888">No schedule data</div>'; return; }
            el.innerHTML = `<table class="xp-listview" style="width:100%">
                <tr><th>Waktu</th><th>Jam</th></tr>
                <tr><td>Subuh</td><td>${j.subuh}</td></tr>
                <tr><td>Dzuhur</td><td>${j.dzuhur}</td></tr>
                <tr><td>Ashar</td><td>${j.ashar}</td></tr>
                <tr><td>Maghrib</td><td>${j.maghrib}</td></tr>
                <tr><td>Isya</td><td>${j.isya}</td></tr>
            </table>
            <div style="font-size:10px;color:#888;margin-top:6px">Tanggal: ${j.tanggal || dateStr}</div>`;
        } catch { el.innerHTML = '<div style="color:red">Failed to load schedule</div>'; }
    },

    // ── Search ──
    _showSearch() {
        const body = document.getElementById('qr-body');
        body.innerHTML = `<div style="padding:12px">
            <h3 style="font-size:13px;color:#003c74;margin-bottom:8px">Cari di Al-Quran</h3>
            <div style="display:flex;gap:8px;margin-bottom:12px">
                <input class="xp-input" id="qr-search-q" placeholder="Cari ayat, kata, atau topik..." style="flex:1" onkeydown="if(event.key==='Enter')Apps.Quran._doSearch()">
                <button class="xp-btn xp-btn-primary" onclick="Apps.Quran._doSearch()">Search</button>
            </div>
            <div id="qr-search-result"></div>
        </div>`;
    },

    async _doSearch() {
        const q = document.getElementById('qr-search-q')?.value?.trim();
        if (!q) return;
        const el = document.getElementById('qr-search-result');
        el.innerHTML = '<div style="color:#888">Searching...</div>';
        try {
            const res = await fetch(`${BASE_URL}/api/proxy/quran?path=v2/surat?keyword=${encodeURIComponent(q)}`);
            const data = await res.json();
            const results = data.data || [];
            if (results.length === 0) { el.innerHTML = '<div style="color:#888">No results found</div>'; return; }
            el.innerHTML = results.map(s => `
                <div class="qr-surah-card" onclick="Apps.Quran.loadSurah(${s.nomor})" style="margin-bottom:4px">
                    <span class="qs-num">${s.nomor}.</span>
                    <span class="qs-name">${esc(s.namaLatin)}</span>
                    <div class="qs-info">${esc(s.arti)} • ${s.jumlahAyat} ayat</div>
                </div>
            `).join('');
        } catch { el.innerHTML = '<div style="color:red">Search failed</div>'; }
    },
};
