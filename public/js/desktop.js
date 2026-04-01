/**
 * XP Workspace — Desktop Shell
 * Window Manager, Start Menu, Taskbar, Notifications, App Launcher
 *
 * Uses global: BASE_URL, ICON_PATH, SOUND_PATH, IMG_PATH (set by PHP in the HTML head)
 */

const XP = {
    windows: {},
    activeWindowId: null,
    zCounter: 100,
    dragState: null,
    resizeState: null,
    config: null,
    sounds: {},
    soundEnabled: true,

    // Icon mapping: app id → real XP icon filename
    icons: {
        dashboard:  'my-documents.png',
        projects:   'briefcase.png',
        tasks:      'checklist.png',
        wiki:       'help-and-support.png',
        files:      'my-computer.png',
        notes:      'stickynotes.png',
        calendar:   'date-and-time.png',
        contacts:   'address-book.png',
        default:    'generic-document.png',
    },

    // Sound mapping: event → real XP sound filename
    soundMap: {
        startup:    'windows-xp-startup.wav',
        click:      'windows-xp-default.wav',
        error:      'windows-xp-error.wav',
        notify:     'windows-xp-balloon.wav',
        close:      'windows-xp-logoff-sound.wav',
        minimize:   'windows-xp-minimize.wav',
        maximize:   'windows-xp-restore.wav',
        recycle:    'windows-xp-recycle.wav',
        ding:       'windows-xp-ding.wav',
        exclamation:'windows-xp-exclamation.wav',
        logon:      'windows-xp-logon-sound.wav',
        start:      'windows-xp-start.wav',
        menu:       'windows-xp-menu-command.wav',
    },

    // ══════════════════════════════════════════════════════════
    //  INITIALIZATION
    // ══════════════════════════════════════════════════════════

    async init() {
        try {
            const res = await fetch(BASE_URL + '/desktop/config');
            this.config = await res.json();
        } catch (e) {
            console.warn('Config load failed, using defaults', e);
            this.config = { modules: {}, preferences: {} };
        }

        this.initSounds();
        this.SystemTray.init();
        this.initClock();
        StartMenu.init();
        this.initDesktopIcons();
        this.initContextMenu();
        this.initGlobalEvents();
        this.initWallpaper();
        DesktopWidgets.init();

        // Boot animation — wait for loading, then require a click to dismiss
        // (browsers block autoplay audio without user interaction)
        setTimeout(() => {
            const bs = document.getElementById('boot-screen');
            if (!bs) return;
            const sub = bs.querySelector('.boot-subtitle');
            if (sub) sub.textContent = 'Click anywhere or press Enter to start';
            bs.querySelector('.boot-progress').style.display = 'none';
            bs.style.cursor = 'pointer';
            const dismiss = () => {
                this.playSound('startup');
                bs.classList.add('fade-out');
                setTimeout(() => bs.remove(), 700);
                document.removeEventListener('keydown', onKey);
            };
            const onKey = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); dismiss(); } };
            bs.addEventListener('click', dismiss, { once: true });
            document.addEventListener('keydown', onKey);
        }, 2500);
    },

    // ══════════════════════════════════════════════════════════
    //  WALLPAPER
    // ══════════════════════════════════════════════════════════

    initWallpaper() {
        const wallpaper = this.config?.preferences?.wallpaper || 'bliss.png';
        this.setWallpaper(wallpaper);
    },

    setWallpaper(name) {
        const desktop = document.getElementById('desktop');
        if (name === 'none') {
            desktop.style.backgroundImage = 'none';
        } else {
            desktop.style.backgroundImage = `url('${IMG_PATH}/wallpapers/${name}')`;
            desktop.style.backgroundSize = 'cover';
            desktop.style.backgroundPosition = 'center';
        }
    },

    // ══════════════════════════════════════════════════════════
    //  SOUND SYSTEM
    // ══════════════════════════════════════════════════════════

    initSounds() {
        for (const [name, file] of Object.entries(this.soundMap)) {
            const audio = new Audio(SOUND_PATH + '/' + file);
            audio.preload = 'auto';
            audio.volume = name === 'startup' ? 0.4 : 0.3;
            this.sounds[name] = audio;
        }
    },

    playSound(name) {
        if (!this.soundEnabled) return;
        if (this.config?.preferences?.sounds === '0') return;
        const snd = this.sounds[name];
        if (snd) {
            snd.currentTime = 0;
            snd.play().catch(() => {});
        }
    },

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        const icon = document.getElementById('tray-icon-volume');
        if (icon) icon.src = ICON_PATH + '/' + (this.soundEnabled ? 'volume.png' : 'volume-alt.png');
        this.notify(this.soundEnabled ? 'Sound On' : 'Sound Off',
                    this.soundEnabled ? 'Sound effects enabled' : 'Sound effects muted');
    },

    // Get the icon path for an app
    getIcon(appId) {
        return this.icons[appId] || this.icons.default;
    },

    // ══════════════════════════════════════════════════════════
    //  CLOCK
    // ══════════════════════════════════════════════════════════

    _clockSettings: null,

    initClock() {
        // Load saved settings
        try { this._clockSettings = JSON.parse(localStorage.getItem('xp_clock_settings')); } catch {}
        if (!this._clockSettings) this._clockSettings = { timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, hour12: true, seconds: false };

        const el = document.getElementById('tray-clock');
        el.style.cursor = 'pointer';
        el.title = 'Click to open clock settings';
        el.addEventListener('click', (e) => { e.stopPropagation(); this._toggleClockPopup(); });

        const update = () => {
            const s = this._clockSettings;
            const opts = { hour: '2-digit', minute: '2-digit', hour12: s.hour12, timeZone: s.timezone };
            if (s.seconds) opts.second = '2-digit';
            try {
                el.textContent = new Date().toLocaleTimeString('en-US', opts);
            } catch { el.textContent = new Date().toLocaleTimeString(); }
        };
        update();
        setInterval(update, 1000);

        // Close popup on outside click
        document.addEventListener('click', (e) => {
            const popup = document.getElementById('clock-popup');
            if (popup && !popup.contains(e.target) && e.target !== el) popup.remove();
        });
    },

    _saveClockSettings() {
        localStorage.setItem('xp_clock_settings', JSON.stringify(this._clockSettings));
    },

    _toggleClockPopup() {
        let popup = document.getElementById('clock-popup');
        if (popup) { popup.remove(); return; }

        const s = this._clockSettings;
        const tzList = [
            ['Pacific/Midway','UTC-11 Midway'],['Pacific/Honolulu','UTC-10 Honolulu'],['America/Anchorage','UTC-9 Anchorage'],
            ['America/Los_Angeles','UTC-8 Los Angeles'],['America/Denver','UTC-7 Denver'],['America/Chicago','UTC-6 Chicago'],
            ['America/New_York','UTC-5 New York'],['America/Sao_Paulo','UTC-3 Sao Paulo'],['Atlantic/Reykjavik','UTC+0 Reykjavik'],
            ['Europe/London','UTC+0 London'],['Europe/Paris','UTC+1 Paris'],['Europe/Berlin','UTC+1 Berlin'],
            ['Europe/Moscow','UTC+3 Moscow'],['Asia/Dubai','UTC+4 Dubai'],['Asia/Karachi','UTC+5 Karachi'],
            ['Asia/Kolkata','UTC+5:30 Kolkata'],['Asia/Dhaka','UTC+6 Dhaka'],['Asia/Bangkok','UTC+7 Bangkok'],
            ['Asia/Jakarta','UTC+7 Jakarta'],['Asia/Makassar','UTC+8 Makassar'],['Asia/Shanghai','UTC+8 Shanghai'],
            ['Asia/Singapore','UTC+8 Singapore'],['Asia/Tokyo','UTC+9 Tokyo'],['Asia/Jayapura','UTC+9 Jayapura'],
            ['Australia/Sydney','UTC+10 Sydney'],['Pacific/Auckland','UTC+12 Auckland'],
        ];

        popup = document.createElement('div');
        popup.id = 'clock-popup';
        popup.innerHTML = `
            <style>
                #clock-popup {
                    position:fixed; bottom:36px; right:4px; width:280px;
                    background:#ece9d8; border:2px outset #fff; box-shadow:2px 2px 8px rgba(0,0,0,0.3);
                    font-size:11px; z-index:99999; border-radius:3px;
                }
                .cp-header { background:linear-gradient(180deg,#0a246a,#3a6ea5); color:#fff; padding:5px 8px; font-weight:bold; font-size:11px; display:flex; align-items:center; gap:6px; }
                .cp-header img { width:16px; height:16px; }
                .cp-clock-display { text-align:center; padding:10px; background:#fff; margin:6px; border:1px inset #999; }
                .cp-clock-time { font-size:32px; font-weight:bold; font-family:Consolas,'Courier New',monospace; color:#000; }
                .cp-clock-date { font-size:11px; color:#666; margin-top:2px; }
                .cp-clock-tz { font-size:10px; color:#888; }
                .cp-body { padding:6px 8px 8px; }
                .cp-row { display:flex; align-items:center; gap:6px; margin-bottom:6px; }
                .cp-row label { width:70px; font-weight:bold; color:#444; }
                .cp-row select, .cp-row input { flex:1; }
                .cp-checks { display:flex; gap:12px; margin:6px 0; }
                .cp-checks label { display:flex; align-items:center; gap:4px; cursor:pointer; font-weight:normal; width:auto; }
                .cp-sep { border-top:1px solid #d4d0c8; margin:8px 0; }
            </style>
            <div class="cp-header">
                <img src="${ICON_PATH}/date-and-time.png" onerror="this.style.display='none'" alt="">
                Date and Time Properties
            </div>
            <div class="cp-clock-display">
                <div class="cp-clock-time" id="cp-live-time">--:--:--</div>
                <div class="cp-clock-date" id="cp-live-date"></div>
                <div class="cp-clock-tz" id="cp-live-tz">${s.timezone}</div>
            </div>
            <div class="cp-body">
                <div class="cp-row">
                    <label>Timezone</label>
                    <select class="xp-select" id="cp-tz" onchange="XP._onClockChange()">
                        ${tzList.map(([tz, label]) => `<option value="${tz}"${tz === s.timezone ? ' selected' : ''}>${label}</option>`).join('')}
                    </select>
                </div>
                <div class="cp-sep"></div>
                <div class="cp-row">
                    <label>Format</label>
                    <div class="cp-checks">
                        <label><input type="radio" name="cp-fmt" value="12" ${s.hour12 ? 'checked' : ''} onchange="XP._onClockChange()"> 12 Hour</label>
                        <label><input type="radio" name="cp-fmt" value="24" ${!s.hour12 ? 'checked' : ''} onchange="XP._onClockChange()"> 24 Hour</label>
                    </div>
                </div>
                <div class="cp-row">
                    <label>Seconds</label>
                    <div class="cp-checks">
                        <label><input type="checkbox" id="cp-sec" ${s.seconds ? 'checked' : ''} onchange="XP._onClockChange()"> Show seconds</label>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(popup);
        popup.addEventListener('click', (e) => e.stopPropagation());

        // Live preview in popup
        const updatePreview = () => {
            const timeEl = document.getElementById('cp-live-time');
            const dateEl = document.getElementById('cp-live-date');
            if (!timeEl) return;
            const tz = this._clockSettings.timezone;
            const opts = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: this._clockSettings.hour12, timeZone: tz };
            try {
                timeEl.textContent = new Date().toLocaleTimeString('en-US', opts);
                dateEl.textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: tz });
            } catch {}
        };
        updatePreview();
        this._clockPreviewInterval = setInterval(updatePreview, 1000);
    },

    _onClockChange() {
        const tz = document.getElementById('cp-tz')?.value;
        const hour12 = document.querySelector('input[name="cp-fmt"]:checked')?.value === '12';
        const seconds = document.getElementById('cp-sec')?.checked || false;

        this._clockSettings = { timezone: tz || this._clockSettings.timezone, hour12, seconds };
        this._saveClockSettings();

        // Update tz label in popup
        const tzLabel = document.getElementById('cp-live-tz');
        if (tzLabel) tzLabel.textContent = this._clockSettings.timezone;
    },

    // Start Menu is handled by StartMenu module (startmenu.js)

    // ══════════════════════════════════════════════════════════
    //  SYSTEM TRAY
    // ══════════════════════════════════════════════════════════

    SystemTray: {
        icons: [],

        init() {
            this.icons = [
                { id: 'volume',  icon: 'volume.png',             title: 'Volume',         visible: true,  onClick: () => XP.SystemTray.showVolumePopup() },
                { id: 'network', icon: 'network-connection.png', title: 'Network',         visible: true,  onClick: () => XP.SystemTray.showNetworkPopup() },
                { id: 'battery', icon: 'battery-backup.png',     title: 'Battery',         visible: false, onClick: () => XP.SystemTray.showBatteryPopup() },
                { id: 'updates', icon: 'windows-update.png',     title: 'Windows Update',  visible: false, onClick: () => XP.notify('Windows Update', 'Your system is up to date.') },
                { id: 'shield',  icon: 'network-and-internet.png', title: 'Security Center', visible: false, onClick: () => XP.notify('Security Center', 'No issues found. System protected.') },
            ];
            this.render();

            // Close popups on outside click
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.tray-popup') && !e.target.closest('.tray-overflow-popup') && !e.target.closest('.tray-icons') && !e.target.closest('.tray-expand'))
                    this._closeAll();
            });
        },

        render() {
            const container = document.getElementById('tray-icons');
            if (!container) return;
            container.innerHTML = this.icons
                .filter(i => i.visible)
                .map(i => `<img class="tray-icon" id="tray-icon-${i.id}" src="${ICON_PATH}/${i.icon}" alt="${i.title}" title="${i.title}" onclick="event.stopPropagation(); XP.SystemTray.onIconClick('${i.id}')">`)
                .join('');

            // Show/hide expand arrow
            const arrow = document.getElementById('tray-expand');
            const hiddenCount = this.icons.filter(i => !i.visible).length;
            if (arrow) arrow.style.display = hiddenCount > 0 ? '' : 'none';
        },

        /* ── Overflow popup (Win 11 style grid) ── */
        toggleExpand() {
            const existing = document.querySelector('.tray-overflow-popup');
            if (existing) { existing.remove(); return; }
            this._closeAll();

            const hidden = this.icons.filter(i => !i.visible);
            if (hidden.length === 0) return;

            const popup = document.createElement('div');
            popup.className = 'tray-overflow-popup';
            popup.innerHTML = `
                <div class="tray-overflow-grid">
                    ${hidden.map(i => `
                        <div class="tray-overflow-item" title="${i.title}" onclick="event.stopPropagation(); XP.SystemTray.onIconClick('${i.id}'); document.querySelector('.tray-overflow-popup')?.remove();">
                            <img src="${ICON_PATH}/${i.icon}" alt="${i.title}">
                        </div>
                    `).join('')}
                </div>
                <div class="tray-overflow-label">${hidden.length} hidden icon${hidden.length > 1 ? 's' : ''}</div>
            `;
            popup.addEventListener('click', e => e.stopPropagation());
            document.body.appendChild(popup);
        },

        onIconClick(id) {
            this._closeAll();
            const icon = this.icons.find(i => i.id === id);
            if (icon?.onClick) icon.onClick();
        },

        _closeAll() {
            document.querySelectorAll('.tray-popup, .tray-overflow-popup').forEach(p => p.remove());
        },

        _createPopup(title, icon, bodyHtml) {
            this._closeAll();
            const popup = document.createElement('div');
            popup.className = 'tray-popup';
            popup.innerHTML = `
                <div class="tray-popup-header">
                    <img src="${ICON_PATH}/${icon}" onerror="this.style.display='none'" alt="">${title}
                </div>
                <div class="tray-popup-body">${bodyHtml}</div>
            `;
            popup.addEventListener('click', e => e.stopPropagation());
            document.body.appendChild(popup);
            return popup;
        },

        /* ── Volume ── */
        showVolumePopup() {
            const muted = !XP.soundEnabled;
            this._createPopup('Volume', 'volume.png', `
                <div style="text-align:center; padding:8px 0">
                    <div style="font-size:28px; margin-bottom:6px">${muted ? '&#128263;' : '&#128264;'}</div>
                    <div style="font-weight:600; margin-bottom:10px">${muted ? 'Muted' : 'Sound On'}</div>
                    <div style="display:flex; align-items:center; justify-content:center; gap:8px">
                        <span style="font-size:12px">&#128263;</span>
                        <input type="range" min="0" max="100" value="${muted ? 0 : 80}" style="width:130px; accent-color:#3b79e7">
                        <span style="font-size:12px">&#128264;</span>
                    </div>
                    <div style="margin-top:10px">
                        <button class="xp-btn" onclick="XP.toggleSound(); XP.SystemTray.showVolumePopup();" style="font-size:11px">
                            ${muted ? '&#128264; Unmute' : '&#128263; Mute'}
                        </button>
                    </div>
                </div>
            `);
        },

        /* ── Network ── */
        showNetworkPopup() {
            const online = navigator.onLine;
            const conn = navigator.connection || {};
            const type = conn.effectiveType || 'Unknown';
            const downlink = conn.downlink ? conn.downlink + ' Mbps' : 'N/A';
            this._createPopup('Network', 'network-connection.png', `
                <div class="tray-popup-row">
                    <label>Status</label>
                    <span style="color:${online ? '#27ae60' : '#c0392b'}; font-weight:600">${online ? '&#9679; Connected' : '&#9679; Disconnected'}</span>
                </div>
                <div class="tray-popup-row">
                    <label>Type</label><span>${type.toUpperCase()}</span>
                </div>
                <div class="tray-popup-row">
                    <label>Speed</label><span>${downlink}</span>
                </div>
                <div class="tray-popup-sep"></div>
                <div style="font-size:10px; color:#888; text-align:center">
                    Host: <span style="cursor:pointer;color:#2980b9" onclick="navigator.clipboard.writeText(this.textContent)" title="Click to copy">${location.hostname}</span>
                </div>
            `);
        },

        /* ── Battery ── */
        showBatteryPopup() {
            if ('getBattery' in navigator) {
                navigator.getBattery().then(bat => {
                    const pct = Math.round(bat.level * 100);
                    const charging = bat.charging;
                    const timeLeft = bat.dischargingTime && bat.dischargingTime !== Infinity
                        ? Math.floor(bat.dischargingTime / 60) + ' min remaining' : '';
                    this._createPopup('Power', 'battery-backup.png', `
                        <div style="text-align:center; padding:8px 0">
                            <div style="font-size:24px">${charging ? '&#128268;' : pct > 20 ? '&#128267;' : '&#129707;'}</div>
                            <div style="font-size:22px; font-weight:bold; margin:4px 0">${pct}%</div>
                            <div style="font-size:11px; color:#666; margin-bottom:6px">${charging ? 'Charging' : 'On Battery'}</div>
                            <div style="width:80%; margin:0 auto; height:12px; background:#eee; border-radius:6px; overflow:hidden">
                                <div style="height:100%; width:${pct}%; background:${pct > 20 ? 'linear-gradient(90deg,#27ae60,#2ecc71)' : 'linear-gradient(90deg,#c0392b,#e74c3c)'}; border-radius:6px; transition:width .3s"></div>
                            </div>
                            ${timeLeft ? `<div style="font-size:10px; color:#888; margin-top:6px">${timeLeft}</div>` : ''}
                        </div>
                    `);
                });
            } else {
                this._createPopup('Power', 'battery-backup.png', `
                    <div style="text-align:center; padding:12px; color:#888">Battery API not available<br><span style="font-size:10px">Desktop PC detected</span></div>
                `);
            }
        },

        /* ── Public API ── */
        addIcon(id, icon, title, onClick, visible = false) {
            if (this.icons.find(i => i.id === id)) return;
            this.icons.push({ id, icon, title, visible, onClick });
            this.render();
        },

        removeIcon(id) {
            this.icons = this.icons.filter(i => i.id !== id);
            this.render();
        },

        updateIcon(id, props) {
            const icon = this.icons.find(i => i.id === id);
            if (!icon) return;
            Object.assign(icon, props);
            const el = document.getElementById('tray-icon-' + id);
            if (el) {
                if (props.icon) el.src = ICON_PATH + '/' + props.icon;
                if (props.title) el.title = props.title;
            }
        },

        setBadge(id, count) {
            const el = document.getElementById('tray-icon-' + id);
            if (!el) return;
            if (count > 0) {
                el.parentElement?.classList?.add('tray-badge');
                el.parentElement?.setAttribute('data-badge', count > 99 ? '99+' : count);
            } else {
                el.parentElement?.classList?.remove('tray-badge');
            }
        },

        blink(id, on = true) {
            const el = document.getElementById('tray-icon-' + id);
            if (el) el.classList.toggle('tray-blink', on);
        },
    },

    // ══════════════════════════════════════════════════════════
    //  DESKTOP ICONS
    // ══════════════════════════════════════════════════════════

    initDesktopIcons() {
        document.querySelectorAll('.desktop-icon').forEach(icon => {
            icon.addEventListener('dblclick', () => {
                const app = icon.dataset.app;
                if (app === 'recycle') {
                    this.notify('Recycle Bin', 'Recycle Bin is empty');
                    return;
                }
                if (app) this.openApp(app);
            });
            icon.addEventListener('click', (e) => {
                document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
                icon.classList.add('selected');
                this.playSound('click');
                e.stopPropagation();
            });
        });

        document.getElementById('desktop').addEventListener('click', () => {
            document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
        });
    },

    // ══════════════════════════════════════════════════════════
    //  WINDOW MANAGEMENT
    // ══════════════════════════════════════════════════════════

    createWindow(id, options = {}) {
        const defaults = {
            title: 'Window',
            icon: 'generic-document.png',
            width: 700, height: 480,
            x: 60 + Object.keys(this.windows).length * 30,
            y: 40 + Object.keys(this.windows).length * 30,
            content: '', toolbar: '', statusbar: '',
            resizable: true, maximizable: true,
            onClose: null, onReady: null,
        };
        const opts = { ...defaults, ...options };

        if (this.windows[id]) {
            this.focusWindow(id);
            if (this.windows[id].minimized) this.restoreWindow(id);
            return this.windows[id].element;
        }

        const win = document.createElement('div');
        win.className = 'xp-window active';
        win.id = `window-${id}`;
        win.style.cssText = `width:${opts.width}px;height:${opts.height}px;left:${opts.x}px;top:${opts.y}px;z-index:${++this.zCounter}`;

        win.innerHTML = `
            <div class="title-bar" data-window="${id}">
                <img class="title-bar-icon" src="${ICON_PATH}/${opts.icon}" onerror="this.src='${ICON_PATH}/generic-document.png'" alt="">
                <div class="title-bar-text">${opts.title}</div>
                <div class="title-bar-controls">
                    <button aria-label="Minimize" onclick="XP.minimizeWindow('${id}')"></button>
                    ${opts.maximizable ? `<button aria-label="Maximize" onclick="XP.toggleMaximize('${id}')"></button>` : ''}
                    <button aria-label="Close" onclick="XP.closeWindow('${id}')"></button>
                </div>
            </div>
            ${opts.toolbar ? `<div class="window-toolbar">${opts.toolbar}</div>` : ''}
            <div class="window-content" id="content-${id}">${opts.content}</div>
            ${opts.statusbar ? `<div class="window-statusbar">${opts.statusbar}</div>` : ''}
            ${opts.resizable ? '<div class="resize-handle"></div>' : ''}
        `;

        document.getElementById('desktop').appendChild(win);

        this.windows[id] = {
            element: win, title: opts.title, icon: opts.icon,
            minimized: false, maximized: false, prevBounds: null,
            onClose: opts.onClose,
        };

        this.addTaskbarButton(id, opts.title, opts.icon);
        this.focusWindow(id);
        this.initWindowDrag(win, id);
        if (opts.resizable) this.initWindowResize(win, id);
        win.addEventListener('mousedown', () => this.focusWindow(id));

        if (opts.onReady) opts.onReady(win, document.getElementById(`content-${id}`));

        return win;
    },

    focusWindow(id) {
        if (!this.windows[id]) return;
        document.querySelectorAll('.xp-window').forEach(w => w.classList.remove('active'));
        document.querySelectorAll('.taskbar-btn').forEach(b => b.classList.remove('active'));

        const win = this.windows[id].element;
        win.classList.remove('minimized');
        win.classList.add('active');
        win.style.zIndex = ++this.zCounter;
        this.windows[id].minimized = false;
        this.activeWindowId = id;

        const tbtn = document.getElementById(`taskbar-btn-${id}`);
        if (tbtn) tbtn.classList.add('active');
    },

    minimizeWindow(id) {
        if (!this.windows[id]) return;
        this.windows[id].element.classList.add('minimized');
        this.windows[id].minimized = true;
        this.playSound('minimize');
        const others = Object.keys(this.windows).filter(k => k !== id && !this.windows[k].minimized);
        if (others.length) this.focusWindow(others[others.length - 1]);
    },

    restoreWindow(id) {
        if (!this.windows[id]) return;
        this.windows[id].element.classList.remove('minimized');
        this.windows[id].minimized = false;
        this.focusWindow(id);
    },

    toggleMaximize(id) {
        if (!this.windows[id]) return;
        const wData = this.windows[id];
        const win = wData.element;

        if (wData.maximized) {
            win.classList.remove('maximized');
            if (wData.prevBounds) {
                Object.assign(win.style, wData.prevBounds);
            }
            wData.maximized = false;
        } else {
            wData.prevBounds = { left: win.style.left, top: win.style.top, width: win.style.width, height: win.style.height };
            win.classList.add('maximized');
            wData.maximized = true;
            this.playSound('maximize');
        }
    },

    closeWindow(id) {
        if (!this.windows[id]) return;
        if (this.windows[id].onClose) this.windows[id].onClose();
        this.windows[id].element.remove();
        delete this.windows[id];

        const tbtn = document.getElementById(`taskbar-btn-${id}`);
        if (tbtn) tbtn.remove();
        this.playSound('close');

        const others = Object.keys(this.windows).filter(k => !this.windows[k].minimized);
        if (others.length) this.focusWindow(others[others.length - 1]);
    },

    addTaskbarButton(id, title, icon) {
        const container = document.getElementById('taskbar-buttons');
        const btn = document.createElement('button');
        btn.className = 'taskbar-btn active';
        btn.id = `taskbar-btn-${id}`;
        btn.innerHTML = `
            <img src="${ICON_PATH}/${icon}" onerror="this.src='${ICON_PATH}/generic-document.png'" alt="">
            <span>${title}</span>
        `;
        btn.addEventListener('click', () => {
            if (this.activeWindowId === id && !this.windows[id].minimized) {
                this.minimizeWindow(id);
            } else {
                this.focusWindow(id);
            }
        });
        btn.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this._showTaskbarContextMenu(e, id);
        });
        container.appendChild(btn);
    },

    _showTaskbarContextMenu(e, id) {
        const win = this.windows[id];
        if (!win) return;
        const ctx = document.getElementById('context-menu');
        if (!ctx) return;

        const isMin = win.minimized;
        const isMax = win.maximized;

        ctx.innerHTML = `
            <div class="context-menu-item${isMin ? '' : ' disabled'}" onclick="${isMin ? `XP.restoreWindow('${id}')` : ''}; document.getElementById('context-menu').classList.remove('visible');">
                <img src="${ICON_PATH}/restore.png" alt="" onerror="this.style.display='none'" style="width:16px;height:16px"> Restore
            </div>
            <div class="context-menu-item" onclick="XP.minimizeWindow('${id}'); document.getElementById('context-menu').classList.remove('visible');">
                <img src="${ICON_PATH}/minimize.png" alt="" onerror="this.style.display='none'" style="width:16px;height:16px"> Minimize
            </div>
            <div class="context-menu-item" onclick="XP.toggleMaximize('${id}'); document.getElementById('context-menu').classList.remove('visible');">
                <img src="${ICON_PATH}/maximize.png" alt="" onerror="this.style.display='none'" style="width:16px;height:16px"> ${isMax ? 'Restore Down' : 'Maximize'}
            </div>
            <div class="context-menu-separator"></div>
            <div class="context-menu-item" onclick="XP.closeWindow('${id}'); document.getElementById('context-menu').classList.remove('visible');" style="font-weight:bold">
                <img src="${ICON_PATH}/close-program.png" alt="" onerror="this.style.display='none'" style="width:16px;height:16px"> Close
            </div>
        `;
        ctx.style.left = '-9999px';
        ctx.style.top = '0';
        ctx.style.bottom = 'auto';
        ctx.classList.add('visible');

        requestAnimationFrame(() => {
            const mw = ctx.offsetWidth, mh = ctx.offsetHeight;
            const vw = window.innerWidth, vh = window.innerHeight;
            let x = e.clientX, y = e.clientY - mh;
            if (x + mw > vw) x = vw - mw - 4;
            if (y < 0) y = 4;
            if (x < 0) x = 4;
            ctx.style.left = x + 'px';
            ctx.style.top = y + 'px';
        });
    },

    // ── Dragging & Resizing ──────────────────────────────

    initWindowDrag(win, id) {
        const titlebar = win.querySelector('.title-bar');
        titlebar.addEventListener('mousedown', (e) => {
            if (e.target.closest('.title-bar-controls')) return;
            if (this.windows[id]?.maximized) return;
            this.dragState = {
                windowId: id, startX: e.clientX, startY: e.clientY,
                origLeft: parseInt(win.style.left), origTop: parseInt(win.style.top),
            };
            e.preventDefault();
        });
        titlebar.addEventListener('dblclick', (e) => {
            if (e.target.closest('.title-bar-controls')) return;
            this.toggleMaximize(id);
        });
    },

    initWindowResize(win, id) {
        const handle = win.querySelector('.resize-handle');
        if (!handle) return;
        handle.addEventListener('mousedown', (e) => {
            if (this.windows[id]?.maximized) return;
            this.resizeState = {
                windowId: id, startX: e.clientX, startY: e.clientY,
                origWidth: win.offsetWidth, origHeight: win.offsetHeight,
            };
            e.preventDefault(); e.stopPropagation();
        });
    },

    // ══════════════════════════════════════════════════════════
    //  GLOBAL EVENTS
    // ══════════════════════════════════════════════════════════

    initGlobalEvents() {
        document.addEventListener('mousemove', (e) => {
            if (this.dragState) {
                const d = this.dragState;
                const win = this.windows[d.windowId]?.element;
                if (win) {
                    win.style.left = (d.origLeft + e.clientX - d.startX) + 'px';
                    win.style.top  = (d.origTop + e.clientY - d.startY) + 'px';
                }
            }
            if (this.resizeState) {
                const r = this.resizeState;
                const win = this.windows[r.windowId]?.element;
                if (win) {
                    win.style.width = Math.max(300, r.origWidth + e.clientX - r.startX) + 'px';
                    win.style.height = Math.max(200, r.origHeight + e.clientY - r.startY) + 'px';
                }
            }
        });

        document.addEventListener('mouseup', () => {
            this.dragState = null;
            this.resizeState = null;
        });

        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'w') {
                e.preventDefault();
                if (this.activeWindowId) this.closeWindow(this.activeWindowId);
            }
        });
    },

    // ══════════════════════════════════════════════════════════
    //  CONTEXT MENU
    // ══════════════════════════════════════════════════════════

    initContextMenu() {
        const menu = document.getElementById('context-menu');
        document.getElementById('desktop').addEventListener('contextmenu', (e) => {
            e.preventDefault();
            menu.innerHTML = `
                <div class="context-menu-item" onclick="XP.openApp('dashboard')">
                    <img src="${ICON_PATH}/my-documents.png" alt=""> Dashboard
                </div>
                <div class="context-menu-item" onclick="XP.openApp('projects')">
                    <img src="${ICON_PATH}/briefcase.png" alt=""> Project Manager
                </div>
                <div class="context-menu-item" onclick="XP.openApp('wiki')">
                    <img src="${ICON_PATH}/help-and-support.png" alt=""> Knowledge Base
                </div>
                <div class="context-menu-separator"></div>
                <div class="context-menu-item" onclick="Apps.Notes.open()">
                    <img src="${ICON_PATH}/stickynotes.png" alt=""> New Sticky Note
                </div>
                <div class="context-menu-separator"></div>
                <div class="context-menu-item" onclick="DesktopWidgets.add('clock')">
                    <img src="${ICON_PATH}/date-and-time.png" alt=""> Add Clock Widget
                </div>
                <div class="context-menu-item" onclick="DesktopWidgets.add('weather')">
                    <img src="${ICON_PATH}/weather.png" alt=""> Add Weather Widget
                </div>
                <div class="context-menu-item" onclick="DesktopWidgets.add('calendar')">
                    <img src="${ICON_PATH}/date-and-time.png" alt=""> Add Calendar Widget
                </div>
                <div class="context-menu-item" onclick="DesktopWidgets.add('netspeed')">
                    <img src="${ICON_PATH}/network-connection.png" alt=""> Add Network Speed Widget
                </div>
                <div class="context-menu-item" onclick="DesktopWidgets.add('sysmonitor')">
                    <img src="${ICON_PATH}/display-adaptor.png" alt=""> Add System Monitor Widget
                </div>
                <div class="context-menu-separator"></div>
                <div class="context-menu-item" onclick="XP.showThemePicker()">
                    <img src="${ICON_PATH}/appearance.png" alt=""> Themes & Wallpaper
                </div>
                <div class="context-menu-item" onclick="XP.showAbout()">
                    <img src="${ICON_PATH}/information.png" alt=""> About XP Workspace
                </div>
            `;
            menu.style.left = '-9999px';
            menu.style.top = '0';
            menu.style.bottom = 'auto';
            menu.classList.add('visible');

            // Reposition to fit in viewport
            requestAnimationFrame(() => {
                const mw = menu.offsetWidth, mh = menu.offsetHeight;
                const vw = window.innerWidth, vh = window.innerHeight;
                let x = e.clientX, y = e.clientY;
                if (x + mw > vw) x = vw - mw - 4;
                if (y + mh > vh - 32) y = vh - 32 - mh; // 32 = taskbar
                if (x < 0) x = 4;
                if (y < 0) y = 4;
                menu.style.left = x + 'px';
                menu.style.top = y + 'px';
            });
        });
        document.addEventListener('click', () => menu.classList.remove('visible'));
    },

    // ══════════════════════════════════════════════════════════
    //  APP LAUNCHER
    // ══════════════════════════════════════════════════════════

    openApp(appId) {
        const launchers = {
            dashboard:  () => Apps.Dashboard.open(),
            projects:   () => Apps.Projects.open(),
            tasks:      () => Apps.Tasks.open(),
            wiki:       () => Apps.Wiki.open(),
            files:      () => Apps.Files.open(),
            notes:      () => Apps.Notes.open(),
            notepad:    () => Apps.Notepad.open(),
            codeplay:   () => Apps.CodePlayground.open(),
            vscoder:    () => Apps.VSCoder.open(),
            filegen:    () => Apps.FileGenerator.open(),
            csvviewer:  () => Apps.CSVViewer.open(),
            pdfflipbook:() => Apps.PDFFlipbook.open(),
            dummygen:   () => Apps.DummyGenerator.open(),
            tvplayer:   () => Apps.TVPlayer.open(),
            radio:      () => Apps.Radio.open(),
            invoice:    () => Apps.Invoice.open(),
            quran:      () => Apps.Quran.open(),
            calculator: () => Apps.Calculator.open(),
            weather:    () => Apps.Weather.open(),
            currency:   () => Apps.Currency.open(),
            translator: () => Apps.Translator.open(),
            imagetools: () => Apps.ImageTools.open(),
            imageeditor: () => Apps.ImageEditor.open(),
            colorpicker: () => Apps.ColorPicker.open(),
            jsonformat:  () => Apps.JSONFormatter.open(),
            pomodoro:    () => Apps.Pomodoro.open(),
            paint:       () => Apps.Paint.open(),
            regextester: () => Apps.RegexTester.open(),
            base64tool:  () => Apps.Base64Tool.open(),
            diffviewer:  () => Apps.DiffViewer.open(),
            timestamp:   () => Apps.Timestamp.open(),
            musicplayer: () => Apps.MusicPlayer.open(),
            videoplayer: () => Apps.VideoPlayer.open(),
            todolist:   () => Apps.TodoList.open(),
            piano:      () => Apps.Piano.open(),
            tetris:     () => Apps.Tetris.open(),
            hashgen:    () => Apps.HashGenerator.open(),
        };
        if (launchers[appId]) launchers[appId]();
        else this.notify('Application not available', `"${appId}" module is coming soon.`);
    },

    // ══════════════════════════════════════════════════════════
    //  NOTIFICATIONS & DIALOGS
    // ══════════════════════════════════════════════════════════

    notify(title, message, duration = 4000) {
        const notif = document.createElement('div');
        notif.className = 'xp-notification';
        notif.innerHTML = `
            <span class="notif-close" onclick="this.parentElement.remove()">×</span>
            <div class="notif-title">${title}</div>
            <div>${message}</div>
        `;
        document.body.appendChild(notif);
        this.playSound('notify');
        setTimeout(() => notif.remove(), duration);
    },

    dialog(title, message, buttons = [{ text: 'OK', primary: true }]) {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'xp-dialog-overlay';
            overlay.innerHTML = `
                <div class="xp-dialog">
                    <div class="title-bar">
                        <img class="title-bar-icon" src="${ICON_PATH}/information.png" alt="" style="width:16px;height:16px">
                        <div class="title-bar-text">${title}</div>
                        <div class="title-bar-controls">
                            <button aria-label="Close" data-action="close"></button>
                        </div>
                    </div>
                    <div class="xp-dialog-body"><div>${message}</div></div>
                    <div class="xp-dialog-footer">
                        ${buttons.map((b, i) => `
                            <button class="xp-btn ${b.primary ? 'xp-btn-primary' : ''}" data-action="${i}">${b.text}</button>
                        `).join('')}
                    </div>
                </div>
            `;
            overlay.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                if (action !== undefined) {
                    overlay.remove();
                    resolve(action === 'close' ? -1 : parseInt(action));
                }
            });
            document.body.appendChild(overlay);
            this.playSound('ding');
        });
    },

    confirm(title, message) {
        return this.dialog(title, message, [
            { text: 'Yes', primary: true }, { text: 'No' },
        ]).then(i => i === 0);
    },

    // ══════════════════════════════════════════════════════════
    //  THEME & WALLPAPER PICKER
    // ══════════════════════════════════════════════════════════

    showThemePicker() {
        const currentTheme = document.body.className.replace('theme-', '');
        const wallpapers = [
            'bliss.png', 'azul.png', 'autumn.png', 'ascent.png', 'crystal.png',
            'follow.png', 'friend.png', 'home.png', 'moon_flower.png', 'peace.png',
            'power.png', 'purple_flower.png', 'radiance.png', 'red_moon_desert.png',
            'ripple.png', 'stonehenge.png', 'tulips.png', 'vortec_space.png', 'wind.png',
            'windows_xp_home_edition.png', 'windows_xp_professional.png',
        ];

        XP.createWindow('display-properties', {
            title: 'Display Properties',
            icon: 'appearance.png',
            width: 500, height: 450,
            x: 150, y: 50,
            content: `
                <div class="xp-tabs">
                    <div class="xp-tab active" onclick="XP._switchTab('theme-panel','wallpaper-panel',this)">Themes</div>
                    <div class="xp-tab" onclick="XP._switchTab('wallpaper-panel','theme-panel',this)">Wallpaper</div>
                </div>
                <div class="xp-tab-content" style="min-height:0">
                    <div id="theme-panel">
                        <div class="theme-picker">
                            <div class="theme-option ${currentTheme==='luna-blue'?'active':''}" onclick="XP.applyTheme('luna-blue',this)">
                                <div class="theme-preview" style="background:linear-gradient(180deg,#3089ff,#0055ee)"></div>
                                <span>Luna Blue</span>
                            </div>
                            <div class="theme-option ${currentTheme==='luna-silver'?'active':''}" onclick="XP.applyTheme('luna-silver',this)">
                                <div class="theme-preview" style="background:linear-gradient(180deg,#b8bcc4,#8fa2b8)"></div>
                                <span>Luna Silver</span>
                            </div>
                            <div class="theme-option ${currentTheme==='classic'?'active':''}" onclick="XP.applyTheme('classic',this)">
                                <div class="theme-preview" style="background:#3a6ea5"></div>
                                <span>Classic</span>
                            </div>
                        </div>
                    </div>
                    <div id="wallpaper-panel" style="display:none">
                        <div class="wallpaper-grid">
                            <div class="wallpaper-none" onclick="XP.setWallpaper('none')">
                                <div style="font-size:18px">✕</div>
                                <div style="font-size:10px">None</div>
                            </div>
                            ${wallpapers.map(w => `
                                <img class="wallpaper-thumb" src="${IMG_PATH}/wallpapers/${w}" alt="${w.replace('.png','')}"
                                     title="${w.replace('.png','').replace(/_/g,' ')}"
                                     onclick="XP.setWallpaper('${w}')" onerror="this.style.display='none'">
                            `).join('')}
                        </div>
                    </div>
                </div>
            `,
            statusbar: '<span class="statusbar-section">Select a theme or wallpaper</span>',
        });
    },

    _switchTab(showId, hideId, tab) {
        document.getElementById(showId).style.display = 'block';
        document.getElementById(hideId).style.display = 'none';
        tab.parentElement.querySelectorAll('.xp-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
    },

    applyTheme(theme, el) {
        document.body.className = `theme-${theme}`;
        document.querySelectorAll('.theme-option').forEach(o => o.classList.remove('active'));
        if (el) el.classList.add('active');
        this.notify('Theme Changed', `Applied ${theme} theme`);
    },

    clearCacheAndReload() {
        // Clear all browser caches
        if ('caches' in window) {
            caches.keys().then(names => names.forEach(n => caches.delete(n)));
        }
        // Clear localStorage (except pinned apps)
        const pinned = localStorage.getItem('xp_pinned_apps');
        localStorage.clear();
        if (pinned) localStorage.setItem('xp_pinned_apps', pinned);
        // Clear sessionStorage
        sessionStorage.clear();
        // Force hard reload bypassing cache
        this.notify('Clear Cache', 'Cache cleared. Reloading...');
        setTimeout(() => location.href = location.href.split('?')[0] + '?nocache=' + Date.now(), 500);
    },

    showAbout() {
        this.dialog('About XP Workspace', `
            <div style="display:flex;gap:12px;align-items:flex-start">
                <img src="${ICON_PATH}/windows-xp.png" alt="" style="width:48px;height:48px;image-rendering:pixelated" onerror="this.style.display='none'">
                <div>
                    <div style="font-size:16px;font-weight:bold;margin-bottom:4px">XP Workspace</div>
                    <div style="color:#666;margin-bottom:4px">Version 1.0.0</div>
                    <div style="font-size:10px;color:#999">Project Management & Knowledge Base</div>
                    <div style="font-size:10px;color:#999;margin-top:4px">PHP Native MVC &bull; SQLite &bull; Vanilla JS</div>
                    <div style="font-size:10px;color:#999;margin-top:8px;border-top:1px solid #e0e0e0;padding-top:6px">
                        Themed with authentic Windows XP assets
                    </div>
                </div>
            </div>
        `);
    },

    // ══════════════════════════════════════════════════════════
    //  API HELPER
    // ══════════════════════════════════════════════════════════

    async api(url, method = 'GET', body = null) {
        const opts = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
        };

        if (body && method !== 'GET') {
            opts.body = JSON.stringify(body);
        }
        if (body && method === 'GET') {
            url += '?' + new URLSearchParams(body).toString();
        }

        try {
            const res = await fetch(BASE_URL + url, opts);
            return await res.json();
        } catch (err) {
            console.error('API Error:', err);
            this.notify('Error', 'Failed to communicate with server');
            return { success: false, error: err.message };
        }
    },
};


// ══════════════════════════════════════════════════════════════
//  APP MODULES
// ══════════════════════════════════════════════════════════════

const Apps = {};

// ── Helper: escape strings for inline HTML ───────────────────
function esc(str) {
    return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// ── Dashboard ────────────────────────────────────────────────
Apps.Dashboard = {
    async open() {
        const data = await XP.api('/api/dashboard');
        const s = data.stats || {};

        XP.createWindow('dashboard', {
            title: 'Dashboard — XP Workspace',
            icon: 'my-documents.png',
            width: 720, height: 500,
            statusbar: '<span class="statusbar-section">Overview</span>',
            content: `
                <h2 style="font-size:14px;margin-bottom:10px;color:#003c74;display:flex;align-items:center;gap:6px">
                    <img src="${ICON_PATH}/my-documents.png" style="width:20px;height:20px" alt=""> Dashboard
                </h2>
                <div class="dashboard-grid">
                    <div class="stat-card"><div class="stat-value">${s.total_projects||0}</div><div class="stat-label">Projects</div></div>
                    <div class="stat-card"><div class="stat-value">${s.open_tasks||0}</div><div class="stat-label">Open Tasks</div></div>
                    <div class="stat-card"><div class="stat-value">${s.done_tasks||0}</div><div class="stat-label">Completed</div></div>
                    <div class="stat-card"><div class="stat-value">${s.wiki_pages||0}</div><div class="stat-label">Wiki Pages</div></div>
                    <div class="stat-card"><div class="stat-value">${s.total_files||0}</div><div class="stat-label">Files</div></div>
                    <div class="stat-card"><div class="stat-value">${s.total_notes||0}</div><div class="stat-label">Notes</div></div>
                </div>
                <h3 style="font-size:12px;margin:12px 0 6px;color:#003c74;display:flex;align-items:center;gap:6px">
                    <img src="${ICON_PATH}/recent-documents.png" style="width:16px;height:16px" alt="" onerror="this.style.display='none'"> Recent Activity
                </h3>
                <table class="xp-listview" style="width:100%">
                    <tr><th>Action</th><th>Item</th><th>Time</th></tr>
                    ${(data.recent_activity||[]).map(a => `
                        <tr>
                            <td><span class="badge badge-${a.action}">${a.action}</span></td>
                            <td>${esc(a.entity_name)}</td>
                            <td style="font-size:10px;color:#888">${a.created_at}</td>
                        </tr>
                    `).join('') || '<tr><td colspan="3" style="text-align:center;color:#999">No activity yet</td></tr>'}
                </table>
            `,
        });
    },
};

// ── Projects ─────────────────────────────────────────────────
Apps.Projects = {
    async open() {
        XP.createWindow('projects', {
            title: 'Project Manager',
            icon: 'briefcase.png',
            width: 750, height: 500,
            toolbar: `
                <button class="toolbar-btn" onclick="Apps.Projects.showNewDialog()">
                    <img src="${ICON_PATH}/add.png" alt="" onerror="this.style.display='none'"> New Project
                </button>
                <div class="toolbar-separator"></div>
                <button class="toolbar-btn" onclick="Apps.Projects.refresh()">
                    <img src="${ICON_PATH}/forward.png" alt="" onerror="this.style.display='none'"> Refresh
                </button>
            `,
            statusbar: '<span class="statusbar-section" id="projects-status">Loading...</span>',
            content: '<div id="projects-list">Loading...</div>',
            onReady: () => this.refresh(),
        });
    },

    async refresh() {
        const res = await XP.api('/api/projects');
        const projects = res.data || [];
        const el = document.getElementById('projects-list');
        if (!el) return;

        if (projects.length === 0) {
            el.innerHTML = `<div style="text-align:center;padding:40px;color:#999">
                <img src="${ICON_PATH}/folder-closed.png" style="width:48px;height:48px;opacity:0.5" alt="">
                <div style="margin-top:8px">No projects yet. Click "New Project" to create one!</div>
            </div>`;
        } else {
            el.innerHTML = `
                <table class="xp-listview">
                    <tr><th style="width:30px"></th><th>Name</th><th>Description</th><th>Tasks</th><th>Progress</th><th style="width:80px">Actions</th></tr>
                    ${projects.map(p => {
                        const pct = p.task_count > 0 ? Math.round(p.done_count / p.task_count * 100) : 0;
                        return `
                        <tr style="cursor:pointer" ondblclick="Apps.Tasks.openForProject(${p.id}, '${esc(p.name)}')">
                            <td><div style="width:12px;height:12px;border-radius:2px;background:${p.color}"></div></td>
                            <td><strong>${esc(p.name)}</strong></td>
                            <td class="truncate" style="max-width:200px">${esc(p.description)||'—'}</td>
                            <td>${p.done_count}/${p.task_count}</td>
                            <td><div style="background:#ddd;border-radius:2px;height:12px;width:80px;overflow:hidden"><div style="background:${p.color};height:100%;width:${pct}%;border-radius:2px"></div></div></td>
                            <td>
                                <button class="xp-btn" onclick="Apps.Tasks.openForProject(${p.id},'${esc(p.name)}')" style="font-size:10px;padding:1px 6px">Board</button>
                                <button class="xp-btn" onclick="Apps.Projects.deleteProject(${p.id})" style="font-size:10px;padding:1px 6px;color:red">✕</button>
                            </td>
                        </tr>`;
                    }).join('')}
                </table>
            `;
        }
        const statusEl = document.getElementById('projects-status');
        if (statusEl) statusEl.textContent = `${projects.length} project(s)`;
    },

    async showNewDialog() {
        const result = await XP.dialog('New Project', `
            <div style="display:flex;flex-direction:column;gap:8px;min-width:280px">
                <label style="font-size:11px">Project Name:</label>
                <input class="xp-input" id="new-project-name" placeholder="My Project" style="width:100%">
                <label style="font-size:11px">Description:</label>
                <input class="xp-input" id="new-project-desc" placeholder="Optional" style="width:100%">
                <label style="font-size:11px">Color:</label>
                <input type="color" id="new-project-color" value="#3B79E7" style="width:50px;height:24px">
            </div>
        `, [{ text: 'Create', primary: true }, { text: 'Cancel' }]);

        if (result === 0) {
            const name = document.getElementById('new-project-name')?.value?.trim();
            if (!name) { XP.notify('Error', 'Project name is required'); return; }
            await XP.api('/api/projects', 'POST', {
                name,
                description: document.getElementById('new-project-desc')?.value || '',
                color: document.getElementById('new-project-color')?.value || '#3B79E7',
            });
            XP.notify('Project Created', `"${name}" has been created!`);
            this.refresh();
        }
    },

    async deleteProject(id) {
        if (await XP.confirm('Delete Project', 'This will delete all tasks. Continue?')) {
            await XP.api(`/api/projects/${id}`, 'DELETE');
            XP.notify('Deleted', 'Project deleted.');
            this.refresh();
        }
    },
};

// ── Tasks (Kanban Board) ─────────────────────────────────────
Apps.Tasks = {
    currentProject: null,

    async openForProject(projectId, projectName) {
        this.currentProject = projectId;
        const winId = `tasks-${projectId}`;

        XP.createWindow(winId, {
            title: `Task Board — ${projectName || 'Project'}`,
            icon: 'checklist.png',
            width: 850, height: 520,
            toolbar: `
                <button class="toolbar-btn" onclick="Apps.Tasks.showNewTask(${projectId})">
                    <img src="${ICON_PATH}/add.png" alt="" onerror="this.style.display='none'"> New Task
                </button>
                <div class="toolbar-separator"></div>
                <button class="toolbar-btn" onclick="Apps.Tasks.refreshBoard(${projectId})">
                    <img src="${ICON_PATH}/forward.png" alt="" onerror="this.style.display='none'"> Refresh
                </button>
            `,
            statusbar: `<span class="statusbar-section" id="tasks-status-${projectId}">Loading...</span>`,
            content: `<div class="kanban-board" id="kanban-${projectId}">Loading...</div>`,
            onReady: () => this.refreshBoard(projectId),
        });
    },

    async open() {
        const res = await XP.api('/api/projects');
        const projects = res.data || [];

        if (projects.length === 0) {
            XP.notify('No Projects', 'Create a project first.');
            Apps.Projects.open();
            return;
        }
        if (projects.length === 1) {
            this.openForProject(projects[0].id, projects[0].name);
            return;
        }

        const html = projects.map(p =>
            `<div class="start-menu-item" style="cursor:pointer"
                  onclick="Apps.Tasks.openForProject(${p.id},'${esc(p.name)}');this.closest('.xp-dialog-overlay')?.remove();">
                <div style="width:12px;height:12px;border-radius:2px;background:${p.color};flex-shrink:0"></div>
                <span>${esc(p.name)}</span>
            </div>`
        ).join('');
        XP.dialog('Select Project', `<div style="min-width:240px">${html}</div>`, [{ text: 'Cancel' }]);
    },

    async refreshBoard(projectId) {
        const res = await XP.api(`/api/tasks/board/${projectId}`);
        const columns = res.data || [];
        const board = document.getElementById(`kanban-${projectId}`);
        if (!board) return;

        let total = 0;
        board.innerHTML = columns.map(col => {
            total += (col.tasks||[]).length;
            return `
                <div class="kanban-column" data-column="${col.id}"
                     ondragover="event.preventDefault();this.style.background='#dde8d0'"
                     ondragleave="this.style.background=''"
                     ondrop="Apps.Tasks.onDrop(event,${col.id},${projectId})">
                    <div class="kanban-column-header" style="border-left:3px solid ${col.color}">
                        <span>${esc(col.name)}</span>
                        <span style="font-size:10px;color:#888">${(col.tasks||[]).length}</span>
                    </div>
                    <div class="kanban-column-body">
                        ${(col.tasks||[]).map(t => `
                            <div class="kanban-card" draggable="true"
                                 ondragstart="Apps.Tasks.onDragStart(event,${t.id})"
                                 ondblclick="Apps.Tasks.showDetail(${t.id},${projectId})">
                                <div class="card-title">${esc(t.title)}</div>
                                <div class="card-meta">
                                    <span class="badge badge-${t.priority}">${t.priority}</span>
                                    ${t.due_date ? `<span style="display:flex;align-items:center;gap:2px"><img src="${ICON_PATH}/date-and-time.png" style="width:12px;height:12px" alt=""> ${t.due_date}</span>` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>`;
        }).join('');

        const statusEl = document.getElementById(`tasks-status-${projectId}`);
        if (statusEl) statusEl.textContent = `${total} task(s) across ${columns.length} columns`;
    },

    onDragStart(e, taskId) { e.dataTransfer.setData('text/plain', taskId); },

    async onDrop(e, columnId, projectId) {
        e.preventDefault();
        e.currentTarget.style.background = '';
        const taskId = e.dataTransfer.getData('text/plain');
        await XP.api(`/api/tasks/${taskId}/move`, 'PUT', { column_id: columnId });
        this.refreshBoard(projectId);
    },

    async showNewTask(projectId) {
        const result = await XP.dialog('New Task', `
            <div style="display:flex;flex-direction:column;gap:8px;min-width:300px">
                <label style="font-size:11px">Title:</label>
                <input class="xp-input" id="new-task-title" style="width:100%" placeholder="Task title">
                <label style="font-size:11px">Description:</label>
                <textarea class="xp-textarea" id="new-task-desc" rows="3" style="width:100%"></textarea>
                <div style="display:flex;gap:8px">
                    <div style="flex:1">
                        <label style="font-size:11px">Priority:</label>
                        <select class="xp-select" id="new-task-priority" style="width:100%">
                            <option value="low">Low</option><option value="medium" selected>Medium</option>
                            <option value="high">High</option><option value="critical">Critical</option>
                        </select>
                    </div>
                    <div style="flex:1">
                        <label style="font-size:11px">Due Date:</label>
                        <input type="date" class="xp-input" id="new-task-due" style="width:100%">
                    </div>
                </div>
            </div>
        `, [{ text: 'Create', primary: true }, { text: 'Cancel' }]);

        if (result === 0) {
            const title = document.getElementById('new-task-title')?.value?.trim();
            if (!title) { XP.notify('Error', 'Title is required'); return; }
            await XP.api('/api/tasks', 'POST', {
                project_id: projectId, title,
                description: document.getElementById('new-task-desc')?.value || '',
                priority: document.getElementById('new-task-priority')?.value || 'medium',
                due_date: document.getElementById('new-task-due')?.value || null,
            });
            XP.notify('Task Created', `"${title}" added`);
            this.refreshBoard(projectId);
        }
    },

    async showDetail(taskId, projectId) {
        const res = await XP.api(`/api/tasks/${taskId}`);
        const t = res.data;
        if (!t) return;

        const result = await XP.dialog(esc(t.title), `
            <div style="min-width:350px;max-width:400px">
                <div style="display:flex;gap:6px;margin-bottom:8px">
                    <span class="badge badge-${t.priority}">${t.priority}</span>
                    <span class="badge badge-${t.status}">${t.status}</span>
                    ${t.due_date ? `<span style="font-size:10px;color:#888;display:flex;align-items:center;gap:2px"><img src="${ICON_PATH}/date-and-time.png" style="width:12px;height:12px" alt=""> ${t.due_date}</span>` : ''}
                </div>
                <div style="font-size:11px;margin-bottom:8px;line-height:1.5;color:#333">
                    ${esc(t.description) || '<em style="color:#999">No description</em>'}
                </div>
                <div style="font-size:10px;color:#999;border-top:1px solid #e0e0e0;padding-top:6px">
                    Created: ${t.created_at}${t.completed_at ? '<br>Completed: '+t.completed_at : ''}
                </div>
            </div>
        `, [
            { text: 'Mark Done', primary: true },
            { text: 'Delete' },
            { text: 'Close' },
        ]);

        if (result === 0) {
            await XP.api(`/api/tasks/${taskId}`, 'PUT', { status: 'done' });
            XP.notify('Done!', `"${t.title}" completed`);
            this.refreshBoard(projectId);
        } else if (result === 1) {
            if (await XP.confirm('Delete Task', `Delete "${esc(t.title)}"?`)) {
                await XP.api(`/api/tasks/${taskId}`, 'DELETE');
                this.refreshBoard(projectId);
            }
        }
    },
};

// ── Wiki / Knowledge Base ────────────────────────────────────
Apps.Wiki = {
    currentPage: null,

    async open() {
        XP.createWindow('wiki', {
            title: 'Knowledge Base',
            icon: 'help-and-support.png',
            width: 800, height: 520,
            toolbar: `
                <button class="toolbar-btn" onclick="Apps.Wiki.newPage()">
                    <img src="${ICON_PATH}/generic-document.png" alt="" onerror="this.style.display='none'"> New Page
                </button>
                <div class="toolbar-separator"></div>
                <button class="toolbar-btn" onclick="Apps.Wiki.refresh()">
                    <img src="${ICON_PATH}/forward.png" alt="" onerror="this.style.display='none'"> Refresh
                </button>
                <div class="toolbar-separator"></div>
                <input class="xp-input" id="wiki-search" placeholder="Search wiki..." style="width:180px"
                       onkeyup="if(event.key==='Enter') Apps.Wiki.doSearch(this.value)">
                <button class="toolbar-btn" onclick="Apps.Wiki.doSearch(document.getElementById('wiki-search').value)">
                    <img src="${ICON_PATH}/search.png" alt="" onerror="this.style.display='none'"> Search
                </button>
            `,
            statusbar: '<span class="statusbar-section" id="wiki-status">Ready</span>',
            content: `
                <div class="wiki-layout" style="margin:-8px;height:calc(100% + 16px)">
                    <div class="wiki-sidebar" id="wiki-sidebar">Loading...</div>
                    <div class="wiki-content" id="wiki-content">
                        <div style="text-align:center;padding:40px;color:#999">
                            <img src="${ICON_PATH}/help-and-support.png" style="width:48px;height:48px;opacity:0.4" alt="">
                            <div style="margin-top:8px">Select a page or create a new one</div>
                        </div>
                    </div>
                </div>
            `,
            onReady: () => this.refresh(),
        });
    },

    async refresh() {
        const res = await XP.api('/api/wiki');
        const pages = res.data || [];
        const sidebar = document.getElementById('wiki-sidebar');
        if (!sidebar) return;

        sidebar.innerHTML = pages.length === 0
            ? '<div style="padding:12px;color:#999;font-size:11px;text-align:center">No pages yet</div>'
            : pages.map(p => `
                <div class="wiki-tree-item ${this.currentPage==p.id?'active':''}" onclick="Apps.Wiki.loadPage(${p.id})">
                    <img src="${ICON_PATH}/generic-text-document.png" style="width:16px;height:16px" alt="">
                    <span class="truncate">${esc(p.title)}</span>
                </div>
            `).join('');

        const s = document.getElementById('wiki-status');
        if (s) s.textContent = `${pages.length} page(s)`;
    },

    async loadPage(id) {
        this.currentPage = id;
        const res = await XP.api(`/api/wiki/${id}`);
        const page = res.data;
        if (!page) return;

        const content = document.getElementById('wiki-content');
        if (!content) return;

        content.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                <h1 style="margin:0;display:flex;align-items:center;gap:6px">
                    <img src="${ICON_PATH}/generic-text-document.png" style="width:20px;height:20px" alt="">
                    ${esc(page.title)}
                </h1>
                <div style="display:flex;gap:4px">
                    <button class="xp-btn" onclick="Apps.Wiki.editPage(${page.id})" style="font-size:10px">Edit</button>
                    <button class="xp-btn" onclick="Apps.Wiki.deletePage(${page.id})" style="font-size:10px;color:red">Delete</button>
                </div>
            </div>
            ${page.tags?.length ? `<div style="margin-bottom:8px">${page.tags.map(t=>`<span style="background:#e8f0fe;padding:1px 6px;border-radius:8px;font-size:10px;margin-right:4px">${esc(t.name)}</span>`).join('')}</div>` : ''}
            <div style="line-height:1.6">${this.renderMarkdown(page.content||'')}</div>
            <div style="margin-top:16px;padding-top:8px;border-top:1px solid #e0e0e0;font-size:10px;color:#999">Last updated: ${page.updated_at}</div>
        `;
        this.refresh();
    },

    async newPage() {
        const result = await XP.dialog('New Wiki Page', `
            <div style="display:flex;flex-direction:column;gap:8px;min-width:320px">
                <label style="font-size:11px">Title:</label>
                <input class="xp-input" id="wiki-new-title" style="width:100%" placeholder="Page title">
                <label style="font-size:11px">Content (Markdown):</label>
                <textarea class="xp-textarea" id="wiki-new-content" rows="8" style="width:100%;font-family:Consolas,monospace" placeholder="# My Page"></textarea>
            </div>
        `, [{ text: 'Create', primary: true }, { text: 'Cancel' }]);

        if (result === 0) {
            const title = document.getElementById('wiki-new-title')?.value?.trim();
            if (!title) { XP.notify('Error', 'Title is required'); return; }
            const res = await XP.api('/api/wiki', 'POST', {
                title,
                content: document.getElementById('wiki-new-content')?.value || '',
            });
            XP.notify('Page Created', `"${title}" created!`);
            this.refresh();
            if (res.data?.id) this.loadPage(res.data.id);
        }
    },

    async editPage(id) {
        const res = await XP.api(`/api/wiki/${id}`);
        const page = res.data;
        if (!page) return;

        const result = await XP.dialog('Edit Page', `
            <div style="display:flex;flex-direction:column;gap:8px;min-width:380px">
                <label style="font-size:11px">Title:</label>
                <input class="xp-input" id="wiki-edit-title" style="width:100%" value="${esc(page.title)}">
                <label style="font-size:11px">Content (Markdown):</label>
                <textarea class="xp-textarea" id="wiki-edit-content" rows="12" style="width:100%;font-family:Consolas,monospace">${esc(page.content||'')}</textarea>
            </div>
        `, [{ text: 'Save', primary: true }, { text: 'Cancel' }]);

        if (result === 0) {
            await XP.api(`/api/wiki/${id}`, 'PUT', {
                title: document.getElementById('wiki-edit-title')?.value,
                content: document.getElementById('wiki-edit-content')?.value,
            });
            XP.notify('Saved', 'Page updated');
            this.loadPage(id);
        }
    },

    async deletePage(id) {
        if (await XP.confirm('Delete Page', 'Delete this page?')) {
            await XP.api(`/api/wiki/${id}`, 'DELETE');
            this.currentPage = null;
            document.getElementById('wiki-content').innerHTML = '<div style="text-align:center;padding:40px;color:#999">Page deleted</div>';
            this.refresh();
        }
    },

    async doSearch(query) {
        if (!query || query.length < 2) return;
        const res = await XP.api(`/api/wiki/search?q=${encodeURIComponent(query)}`);
        const results = res.data || [];
        const content = document.getElementById('wiki-content');
        if (!content) return;

        content.innerHTML = `
            <h2 style="font-size:14px;margin-bottom:8px;display:flex;align-items:center;gap:6px">
                <img src="${ICON_PATH}/search-results.png" style="width:20px;height:20px" alt="" onerror="this.style.display='none'">
                Search: "${esc(query)}"
            </h2>
            ${results.length === 0 ? '<p style="color:#999">No results.</p>' :
                results.map(r => `
                    <div style="padding:6px 8px;border-bottom:1px solid #eee;cursor:pointer;display:flex;align-items:center;gap:6px"
                         onclick="Apps.Wiki.loadPage(${r.id})"
                         onmouseover="this.style.background='#e8f0fe'" onmouseout="this.style.background=''">
                        <img src="${ICON_PATH}/generic-text-document.png" style="width:16px;height:16px" alt="">
                        <div>
                            <div style="font-weight:bold">${esc(r.title)}</div>
                            ${r.snippet ? `<div style="font-size:10px;color:#666;margin-top:2px">...${esc(r.snippet)}...</div>` : ''}
                        </div>
                    </div>
                `).join('')}
        `;
    },

    renderMarkdown(md) {
        return md
            .replace(/^### (.+)$/gm, '<h3>$1</h3>')
            .replace(/^## (.+)$/gm, '<h2>$1</h2>')
            .replace(/^# (.+)$/gm, '<h1>$1</h1>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/`(.+?)`/g, '<code>$1</code>')
            .replace(/^\- (.+)$/gm, '&bull; $1<br>')
            .replace(/\|(.+)\|/gm, (match) => {
                const cells = match.split('|').filter(c => c.trim());
                if (cells.every(c => c.trim().match(/^[-]+$/))) return '';
                return '<tr>' + cells.map(c => `<td style="border:1px solid #d4d0c8;padding:4px 8px">${c.trim()}</td>`).join('') + '</tr>';
            })
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>');
    },
};

// ── Notes (Sticky Notes) ────────────────────────────────────
Apps.Notes = {
    async open() {
        const colors = ['#FFF7AD', '#C7F0DB', '#B8D4E3', '#F5C6CB', '#E2CFEA'];
        const color = colors[Math.floor(Math.random() * colors.length)];

        const res = await XP.api('/api/notes', 'POST', {
            content: '', color,
            pos_x: 100 + Math.random() * 200,
            pos_y: 80 + Math.random() * 150,
        });
        if (res.data) this.renderNote(res.data);
    },

    renderNote(note) {
        const id = `note-${note.id}`;
        const el = document.createElement('div');
        el.id = id;
        el.className = 'xp-window';
        el.style.cssText = `left:${note.pos_x}px;top:${note.pos_y}px;width:${note.width||250}px;height:${note.height||200}px;min-width:180px;min-height:120px;z-index:${++XP.zCounter}`;
        el.innerHTML = `
            <div class="title-bar" style="background:${note.color};min-height:22px;padding:2px 4px;cursor:move">
                <img src="${ICON_PATH}/stickynotes.png" style="width:14px;height:14px" alt="">
                <div class="title-bar-text" style="color:#333;font-size:10px;text-shadow:none">Quick Note</div>
                <div class="title-bar-controls">
                    <button aria-label="Close" onclick="Apps.Notes.deleteNote(${note.id},'${id}')"></button>
                </div>
            </div>
            <div style="flex:1;padding:0;overflow:hidden">
                <textarea style="width:100%;height:100%;border:none;background:${note.color};padding:6px;font-family:var(--xp-font);font-size:11px;resize:none;outline:none"
                          onblur="Apps.Notes.saveNote(${note.id},this.value)"
                          placeholder="Type your note here...">${esc(note.content||'')}</textarea>
            </div>
        `;

        document.getElementById('desktop').appendChild(el);

        // Draggable
        const tb = el.querySelector('.title-bar');
        let dragging=false, sx, sy, ol, ot;
        tb.addEventListener('mousedown', (e) => {
            dragging=true; sx=e.clientX; sy=e.clientY;
            ol=parseInt(el.style.left); ot=parseInt(el.style.top);
            el.style.zIndex = ++XP.zCounter;
        });
        document.addEventListener('mousemove', (e) => {
            if (!dragging) return;
            el.style.left = (ol+e.clientX-sx)+'px';
            el.style.top = (ot+e.clientY-sy)+'px';
        });
        document.addEventListener('mouseup', () => {
            if (dragging) {
                dragging=false;
                XP.api(`/api/notes/${note.id}`, 'PUT', {
                    pos_x: parseInt(el.style.left), pos_y: parseInt(el.style.top),
                });
            }
        });
    },

    async saveNote(id, content) { await XP.api(`/api/notes/${id}`, 'PUT', { content }); },
    async deleteNote(id, elId) { await XP.api(`/api/notes/${id}`, 'DELETE'); document.getElementById(elId)?.remove(); },
    async loadAllNotes() {
        const res = await XP.api('/api/notes');
        (res.data||[]).forEach(n => this.renderNote(n));
    },
};

// ── Files ────────────────────────────────────────────────────
Apps.Files = {
    async open() {
        XP.createWindow('files', {
            title: 'File Manager',
            icon: 'my-computer.png',
            width: 600, height: 400,
            toolbar: `
                <button class="toolbar-btn" onclick="Apps.Files.upload()">
                    <img src="${ICON_PATH}/add.png" alt="" onerror="this.style.display='none'"> Upload
                </button>
                <div class="toolbar-separator"></div>
                <button class="toolbar-btn" onclick="Apps.Files.refresh()">
                    <img src="${ICON_PATH}/forward.png" alt="" onerror="this.style.display='none'"> Refresh
                </button>
            `,
            statusbar: '<span class="statusbar-section" id="files-status">Ready</span>',
            content: '<div id="files-list">Loading...</div>',
            onReady: () => this.refresh(),
        });
    },

    async refresh() {
        const res = await XP.api('/api/files');
        const files = res.data || [];
        const el = document.getElementById('files-list');
        if (!el) return;

        if (files.length === 0) {
            el.innerHTML = `<div style="text-align:center;padding:40px;color:#999">
                <img src="${ICON_PATH}/folder-opened.png" style="width:48px;height:48px;opacity:0.5" alt="">
                <div style="margin-top:8px">No files yet. Click "Upload" to add files.</div>
            </div>`;
        } else {
            el.innerHTML = `
                <table class="xp-listview">
                    <tr><th>Name</th><th>Size</th><th>Type</th><th>Uploaded</th><th>Actions</th></tr>
                    ${files.map(f => `
                        <tr>
                            <td style="display:flex;align-items:center;gap:4px">
                                <img src="${ICON_PATH}/generic-document.png" style="width:16px;height:16px" alt="">
                                ${esc(f.original_name)}
                            </td>
                            <td>${this.fmtSize(f.size)}</td>
                            <td>${esc(f.mime_type)}</td>
                            <td style="font-size:10px">${f.created_at}</td>
                            <td>
                                <button class="xp-btn" onclick="window.open('${BASE_URL}/api/files/${f.id}/download')" style="font-size:10px;padding:1px 6px">Save</button>
                                <button class="xp-btn" onclick="Apps.Files.deleteFile(${f.id})" style="font-size:10px;padding:1px 6px;color:red">Delete</button>
                            </td>
                        </tr>
                    `).join('')}
                </table>
            `;
        }
        const s = document.getElementById('files-status');
        if (s) s.textContent = `${files.length} file(s)`;
    },

    upload() {
        const input = document.createElement('input');
        input.type = 'file';
        input.onchange = async () => {
            const file = input.files[0]; if (!file) return;
            const formData = new FormData();
            formData.append('file', file);
            try {
                const res = await fetch(BASE_URL + '/api/files/upload', { method: 'POST', body: formData });
                const data = await res.json();
                if (data.success) { XP.notify('Uploaded', `"${file.name}" uploaded`); this.refresh(); }
                else XP.notify('Error', data.message || 'Upload failed');
            } catch (e) { XP.notify('Error', 'Upload failed'); }
        };
        input.click();
    },

    async deleteFile(id) {
        if (await XP.confirm('Delete File', 'Delete permanently?')) {
            await XP.api(`/api/files/${id}`, 'DELETE');
            this.refresh();
        }
    },

    fmtSize(b) {
        if (!b) return '0 B';
        const k=1024, s=['B','KB','MB','GB'];
        const i=Math.floor(Math.log(b)/Math.log(k));
        return parseFloat((b/Math.pow(k,i)).toFixed(1))+' '+s[i];
    },
};


// ══════════════════════════════════════════════════════════════
//  BOOT
// ══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    XP.init().then(() => Apps.Notes.loadAllNotes());
});
