/**
 * XP Workspace — Start Menu Module
 * Separated for complexity: categories, pinned apps, search
 */

const StartMenu = {
    menu: null,
    btn: null,
    activeCategory: null,
    pinned: [],

    init() {
        this.menu = document.getElementById('start-menu');
        this.btn = document.getElementById('start-button');
        if (!this.menu || !this.btn) return;

        this.btn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });

        document.addEventListener('click', (e) => {
            if (!this.menu.contains(e.target) && !this.btn.contains(e.target)) {
                this.close();
            }
        });

        this._loadPinned();
        this._buildRightPanel();
        this._showCategory('workspace'); // default
        this._initSearch();
    },

    toggle() {
        this.menu.classList.toggle('visible');
        if (this.menu.classList.contains('visible')) {
            XP.playSound('menu');
            // Reset search
            const search = document.getElementById('sm-search');
            if (search) { search.value = ''; }
            this._showCategory(this.activeCategory || 'workspace');
        }
    },

    close() {
        this.menu.classList.remove('visible');
    },

    // ══════════════════════════════════════════════
    //  RIGHT PANEL — Categories
    // ══════════════════════════════════════════════

    _buildRightPanel() {
        const right = this.menu.querySelector('.start-menu-right');
        if (!right || !XP.config?.categories) return;

        let html = '';
        for (const [catId, cat] of Object.entries(XP.config.categories)) {
            html += `
                <div class="start-menu-cat" data-cat="${catId}" onclick="StartMenu._showCategory('${catId}')">
                    <img src="${ICON_PATH}/${cat.icon}" onerror="this.src='${ICON_PATH}/generic-document.png'" alt="">
                    <span>${cat.name}</span>
                </div>`;
        }

        html += '<div class="start-menu-separator"></div>';
        html += `
            <div class="start-menu-cat" onclick="StartMenu._showAllApps()">
                <img src="${ICON_PATH}/start-menu-programs.png" onerror="this.src='${ICON_PATH}/generic-document.png'" alt="">
                <span>All Programs</span>
            </div>`;
        html += `
            <div class="start-menu-cat" onclick="XP.showThemePicker(); StartMenu.close();">
                <img src="${ICON_PATH}/appearance.png" alt="">
                <span>Display</span>
            </div>`;
        html += `
            <div class="start-menu-cat" onclick="XP.showAbout(); StartMenu.close();">
                <img src="${ICON_PATH}/information.png" alt="">
                <span>About</span>
            </div>`;

        right.innerHTML = html;
    },

    // ══════════════════════════════════════════════
    //  LEFT PANEL — App List (scrollable)
    // ══════════════════════════════════════════════

    _showCategory(catId) {
        this.activeCategory = catId;

        // Highlight active category
        this.menu.querySelectorAll('.start-menu-cat').forEach(el => {
            el.classList.toggle('active', el.dataset.cat === catId);
        });

        const left = this.menu.querySelector('.start-menu-left');
        if (!left || !XP.config?.modules) return;

        // Get pinned apps first
        const pinnedHtml = this._renderPinned();

        // Filter modules by category
        const modules = Object.entries(XP.config.modules)
            .filter(([_, mod]) => mod.enabled && mod.category === catId);

        if (modules.length === 0) {
            left.innerHTML = pinnedHtml + '<div class="sm-empty">No apps in this category</div>';
            return;
        }

        const catName = XP.config.categories?.[catId]?.name || catId;
        let html = pinnedHtml;
        html += `<div class="sm-section-label">${catName}</div>`;
        html += modules.map(([key, mod]) => this._renderAppItem(key, mod)).join('');

        left.innerHTML = html;
        left.scrollTop = 0;
    },

    _showAllApps() {
        this.activeCategory = null;
        this.menu.querySelectorAll('.start-menu-cat').forEach(el => el.classList.remove('active'));

        const left = this.menu.querySelector('.start-menu-left');
        if (!left || !XP.config?.modules) return;

        const pinnedHtml = this._renderPinned();
        let html = pinnedHtml;

        // Group by category
        const categories = XP.config.categories || {};
        for (const [catId, cat] of Object.entries(categories)) {
            const modules = Object.entries(XP.config.modules)
                .filter(([_, mod]) => mod.enabled && mod.category === catId);
            if (modules.length === 0) continue;

            html += `<div class="sm-section-label">${cat.name}</div>`;
            html += modules.map(([key, mod]) => this._renderAppItem(key, mod)).join('');
        }

        left.innerHTML = html;
        left.scrollTop = 0;
    },

    _renderAppItem(key, mod) {
        const isPinned = this.pinned.includes(key);
        return `
            <div class="start-menu-item" data-app="${key}" onclick="XP.openApp('${key}'); StartMenu.close();"
                 oncontextmenu="StartMenu._appContextMenu(event, '${key}', ${isPinned})">
                <img src="${ICON_PATH}/${mod.icon}" onerror="this.src='${ICON_PATH}/generic-document.png'" alt="">
                <span>${mod.name}</span>
            </div>`;
    },

    // ══════════════════════════════════════════════
    //  PINNED APPS
    // ══════════════════════════════════════════════

    _loadPinned() {
        try {
            this.pinned = JSON.parse(localStorage.getItem('xp_pinned_apps')) || [];
        } catch { this.pinned = []; }
    },

    _savePinned() {
        localStorage.setItem('xp_pinned_apps', JSON.stringify(this.pinned));
    },

    _renderPinned() {
        if (this.pinned.length === 0) return '';
        const modules = XP.config?.modules || {};
        let html = '<div class="sm-section-label">Pinned</div>';
        for (const key of this.pinned) {
            const mod = modules[key];
            if (!mod || !mod.enabled) continue;
            html += `
                <div class="start-menu-item sm-pinned" data-app="${key}" onclick="XP.openApp('${key}'); StartMenu.close();"
                     oncontextmenu="StartMenu._appContextMenu(event, '${key}', true)">
                    <img src="${ICON_PATH}/${mod.icon}" onerror="this.src='${ICON_PATH}/generic-document.png'" alt="">
                    <span>${mod.name}</span>
                    <span class="sm-pin-icon" title="Pinned">📌</span>
                </div>`;
        }
        html += '<div class="start-menu-separator" style="margin:2px 8px"></div>';
        return html;
    },

    pinApp(key) {
        if (!this.pinned.includes(key)) {
            this.pinned.push(key);
            this._savePinned();
            this._showCategory(this.activeCategory || 'workspace');
            XP.notify('Pinned', `${XP.config.modules[key]?.name} pinned to Start Menu`);
        }
    },

    unpinApp(key) {
        this.pinned = this.pinned.filter(k => k !== key);
        this._savePinned();
        this._showCategory(this.activeCategory || 'workspace');
    },

    _appContextMenu(e, key, isPinned) {
        e.preventDefault();
        e.stopPropagation();
        const ctxMenu = document.getElementById('context-menu');
        const mod = XP.config.modules?.[key];
        if (!ctxMenu || !mod) return;

        ctxMenu.innerHTML = `
            <div class="context-menu-item" onclick="XP.openApp('${key}'); document.getElementById('context-menu').classList.remove('visible');">
                <img src="${ICON_PATH}/${mod.icon}" alt=""> Open ${mod.name}
            </div>
            <div class="context-menu-separator"></div>
            ${isPinned
                ? `<div class="context-menu-item" onclick="StartMenu.unpinApp('${key}'); document.getElementById('context-menu').classList.remove('visible');">
                    <img src="${ICON_PATH}/delete.png" alt="" onerror="this.style.display='none'"> Unpin from Start
                </div>`
                : `<div class="context-menu-item" onclick="StartMenu.pinApp('${key}'); document.getElementById('context-menu').classList.remove('visible');">
                    <img src="${ICON_PATH}/add.png" alt="" onerror="this.style.display='none'"> Pin to Start
                </div>`
            }`;
        ctxMenu.style.left = e.clientX + 'px';
        ctxMenu.style.top = e.clientY + 'px';
        ctxMenu.classList.add('visible');
    },

    // ══════════════════════════════════════════════
    //  SEARCH
    // ══════════════════════════════════════════════

    _initSearch() {
        const search = document.getElementById('sm-search');
        if (!search) return;
        search.addEventListener('input', () => this._doSearch(search.value));
        search.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const first = this.menu.querySelector('.start-menu-left .start-menu-item');
                if (first) first.click();
            }
            if (e.key === 'Escape') {
                search.value = '';
                this._showCategory(this.activeCategory || 'workspace');
            }
        });
    },

    _doSearch(query) {
        if (!query || query.length < 1) {
            this._showCategory(this.activeCategory || 'workspace');
            return;
        }

        const q = query.toLowerCase();
        const left = this.menu.querySelector('.start-menu-left');
        if (!left || !XP.config?.modules) return;

        const results = Object.entries(XP.config.modules)
            .filter(([key, mod]) => mod.enabled && (mod.name.toLowerCase().includes(q) || key.includes(q)));

        if (results.length === 0) {
            left.innerHTML = `<div class="sm-empty">No apps found for "${esc(query)}"</div>`;
        } else {
            left.innerHTML = `<div class="sm-section-label">Search: "${esc(query)}"</div>` +
                results.map(([key, mod]) => this._renderAppItem(key, mod)).join('');
        }
    },
};
