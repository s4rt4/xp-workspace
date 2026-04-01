/**
 * Startup Manager — Configure which apps auto-open on desktop load
 */
Apps.StartupManager = {
    _apps: [],

    open() {
        if (XP.windows['startupmanager']) { XP.focusWindow('startupmanager'); return; }

        XP.createWindow('startupmanager', {
            title: 'Startup Manager',
            icon: 'scheduled-tasks.png',
            width: 420, height: 400,
            resizable: false,
            content: `
                <style>
                    .sm-wrap{padding:8px;font-size:11px}
                    .sm-desc{color:#666;margin-bottom:8px;padding:6px;background:#f5f3e8;border:1px solid #d4d0c8;font-size:10px}
                    .sm-list{max-height:260px;overflow-y:auto;border:1px solid #d4d0c8}
                    .sm-item{display:flex;align-items:center;gap:8px;padding:4px 8px;border-bottom:1px solid #f0ece0}
                    .sm-item:hover{background:#e8f0fe}
                    .sm-item img{width:16px;height:16px}
                    .sm-item label{flex:1;cursor:pointer;display:flex;align-items:center;gap:6px}
                    .sm-item input[type=checkbox]{position:static!important;opacity:1!important;appearance:auto!important;-webkit-appearance:checkbox!important;width:14px;height:14px;accent-color:#316ac5}
                    .sm-actions{display:flex;gap:4px;margin-top:8px;justify-content:flex-end}
                </style>
                <div class="sm-wrap">
                    <div class="sm-desc">Select apps to automatically open when XP Workspace starts. Changes are saved immediately.</div>
                    <div class="sm-list" id="sm-list">Loading...</div>
                    <div class="sm-actions">
                        <button class="xp-btn" onclick="Apps.StartupManager.clearAll()">Disable All</button>
                    </div>
                </div>
            `,
            onReady: () => this.refresh(),
        });
    },

    refresh() {
        this._load();
        const el = document.getElementById('sm-list');
        if (!el) return;
        const modules = XP.config?.modules || {};
        const launchers = Object.keys(modules).filter(k => modules[k].enabled);

        el.innerHTML = launchers.map(key => {
            const mod = modules[key];
            const checked = this._apps.includes(key);
            return `<div class="sm-item">
                <label>
                    <input type="checkbox" ${checked ? 'checked' : ''} onchange="Apps.StartupManager.toggle('${key}', this.checked)">
                    <img src="${ICON_PATH}/${mod.icon}" onerror="this.src='${ICON_PATH}/generic-document.png'" alt="">
                    ${mod.name}
                </label>
            </div>`;
        }).join('');
    },

    toggle(key, enabled) {
        this._load();
        if (enabled && !this._apps.includes(key)) this._apps.push(key);
        else this._apps = this._apps.filter(k => k !== key);
        this._save();
    },

    clearAll() {
        this._apps = [];
        this._save();
        this.refresh();
    },

    _load() {
        try { this._apps = JSON.parse(localStorage.getItem('xp_startup_apps')) || []; } catch { this._apps = []; }
    },

    _save() {
        localStorage.setItem('xp_startup_apps', JSON.stringify(this._apps));
    },

    // Called from desktop.js init
    runStartupApps() {
        this._load();
        this._apps.forEach(key => {
            setTimeout(() => XP.openApp(key), 500);
        });
    },
};
