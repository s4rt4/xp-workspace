/**
 * TV Player — HLS TV Streaming
 */
Apps.TVPlayer = {
    _hlsLoaded: false,
    hls: null,
    currentChannel: null,

    open() {
        this._loadHLS().then(() => this._createWindow());
    },

    _js(u){return new Promise(r=>{if(document.querySelector(`script[src="${u}"]`))return r();const s=document.createElement('script');s.src=u;s.onload=r;document.head.appendChild(s);});},

    _loadHLS() {
        if (this._hlsLoaded) return Promise.resolve();
        return this._js('https://cdn.jsdelivr.net/npm/hls.js@latest').then(() => { this._hlsLoaded = true; });
    },

    async _createWindow() {
        const res = await XP.api('/api/tv/channels');
        const channels = res.data || [];

        // Group channels
        const groups = {};
        const singles = [];
        channels.forEach(ch => {
            if (ch.group_name) {
                if (!groups[ch.group_name]) groups[ch.group_name] = [];
                groups[ch.group_name].push(ch);
            } else {
                singles.push(ch);
            }
        });

        let sidebarHtml = '';
        for (const [group, chs] of Object.entries(groups)) {
            sidebarHtml += `<div class="tv-group">${esc(group)}</div>`;
            chs.forEach(ch => { sidebarHtml += this._chItem(ch); });
        }
        singles.forEach(ch => { sidebarHtml += this._chItem(ch); });

        XP.createWindow('tvplayer', {
            title: 'TV Player',
            icon: 'windows-media-player-10.png',
            width: 800, height: 500,
            content: `
                <style>
                    .tv-layout { display:flex; height:100%; margin:-8px; background:#111; }
                    .tv-sidebar { width:180px; background:#1a1a1a; overflow-y:auto; flex-shrink:0; border-right:1px solid #333; }
                    .tv-group { color:#888; font-size:9px; text-transform:uppercase; padding:6px 10px 2px; letter-spacing:1px; }
                    .tv-ch { display:flex; align-items:center; gap:6px; padding:5px 10px; cursor:pointer; color:#ccc; font-size:11px; border-left:3px solid transparent; }
                    .tv-ch:hover { background:#2a2a2a; }
                    .tv-ch.active { background:#094771; color:#fff; border-left-color:#007acc; }
                    .tv-ch img { width:20px; height:20px; border-radius:2px; background:#333; }
                    .tv-main { flex:1; display:flex; align-items:center; justify-content:center; background:#000; position:relative; }
                    .tv-main video { width:100%; height:100%; background:#000; }
                    .tv-empty { color:#555; font-size:12px; text-align:center; }
                    .tv-now { position:absolute; top:8px; left:8px; background:rgba(0,0,0,0.7); color:#fff; padding:3px 10px; font-size:10px; border-radius:3px; display:none; }
                </style>
                <div class="tv-layout">
                    <div class="tv-sidebar" id="tv-sidebar">${sidebarHtml}</div>
                    <div class="tv-main">
                        <video id="tv-video" controls autoplay></video>
                        <div class="tv-now" id="tv-now"></div>
                        <div class="tv-empty" id="tv-empty">Select a channel to watch</div>
                    </div>
                </div>
            `,
            onClose: () => { if (this.hls) { this.hls.destroy(); this.hls = null; } },
        });
    },

    _chItem(ch) {
        const logo = ch.logo ? `${IMG_PATH}/${ch.logo}` : `${ICON_PATH}/windows-media-player-10.png`;
        return `<div class="tv-ch" data-id="${ch.id}" onclick="Apps.TVPlayer.play(${ch.id},'${esc(ch.url)}','${esc(ch.name)}')">
            <img src="${logo}" onerror="this.src='${ICON_PATH}/windows-media-player-10.png'" alt="">
            <span>${esc(ch.name)}</span>
        </div>`;
    },

    play(id, url, name) {
        const video = document.getElementById('tv-video');
        const empty = document.getElementById('tv-empty');
        const now = document.getElementById('tv-now');
        if (!video) return;

        if (empty) empty.style.display = 'none';
        if (now) { now.textContent = name; now.style.display = 'block'; setTimeout(() => now.style.display = 'none', 3000); }

        document.querySelectorAll('.tv-ch').forEach(el => el.classList.remove('active'));
        document.querySelector(`.tv-ch[data-id="${id}"]`)?.classList.add('active');

        if (this.hls) { this.hls.destroy(); this.hls = null; }

        if (url.includes('.m3u8') && Hls.isSupported()) {
            this.hls = new Hls();
            this.hls.loadSource(url);
            this.hls.attachMedia(video);
            this.hls.on(Hls.Events.MANIFEST_PARSED, () => video.play());
        } else {
            video.src = url;
            video.play();
        }
    },
};
