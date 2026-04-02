/**
 * Storage Manager — View storage usage across workspace
 */
Apps.StorageManager = {
    open() {
        if (XP.windows['storagemanager']) { XP.focusWindow('storagemanager'); return; }

        XP.createWindow('storagemanager', {
            title: 'Storage Manager',
            icon: 'defragment.png',
            width: 500, height: 420,
            toolbar: `
                <button class="toolbar-btn" onclick="Apps.StorageManager.refresh()"><img src="${ICON_PATH}/forward.png" style="width:16px;height:16px" alt=""> Refresh</button>
            `,
            content: '<div id="stm-body" style="padding:8px;font-size:11px;overflow-y:auto;height:100%">Loading...</div>',
            onReady: () => this.refresh(),
        });
    },

    async refresh() {
        const el = document.getElementById('stm-body');
        if (!el) return;
        el.innerHTML = '<div style="text-align:center;padding:20px;color:#888">Analyzing storage...</div>';

        // Fetch stats from API
        let dbStats = {};
        try {
            const res = await XP.api('/api/dashboard/stats');
            dbStats = res || {};
        } catch {}

        // Files info
        let filesData = [];
        try {
            const res = await XP.api('/api/files?folder=/');
            filesData = res.data || [];
        } catch {}

        const totalFileSize = filesData.reduce((s, f) => s + (f.size || 0), 0);

        // LocalStorage
        let lsEntries = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const val = localStorage.getItem(key);
            lsEntries.push({ key, size: new Blob([val]).size });
        }
        lsEntries.sort((a, b) => b.size - a.size);
        const lsTotal = lsEntries.reduce((s, e) => s + e.size, 0);

        // Browser storage estimate
        let browserQuota = null;
        try {
            if ('storage' in navigator && 'estimate' in navigator.storage) {
                browserQuota = await navigator.storage.estimate();
            }
        } catch {}

        let html = '';

        // Overview
        html += `<div style="font-weight:bold;color:#003c74;padding:4px 0;border-bottom:1px solid #d4d0c8">Overview</div>`;
        html += '<div style="display:flex;gap:8px;margin:8px 0;flex-wrap:wrap">';
        html += this._card('📁', 'Uploaded Files', filesData.length + ' files', this._fmt(totalFileSize));
        html += this._card('📊', 'Database Records', `${dbStats.total_projects || 0} projects, ${dbStats.total_tasks || 0} tasks`, `${dbStats.wiki_pages || 0} wiki, ${dbStats.total_notes || 0} notes`);
        html += this._card('💾', 'LocalStorage', lsEntries.length + ' keys', this._fmt(lsTotal));
        if (browserQuota) html += this._card('🌐', 'Browser Storage', this._fmt(browserQuota.usage) + ' used', this._fmt(browserQuota.quota) + ' quota');
        html += '</div>';

        // Files breakdown
        if (filesData.length > 0) {
            html += `<div style="font-weight:bold;color:#003c74;padding:4px 0;border-bottom:1px solid #d4d0c8;margin-top:8px">Uploaded Files (Top 10)</div>`;
            html += '<table style="width:100%;border-collapse:collapse;margin-top:4px">';
            html += '<tr style="background:#ece9d8"><th style="text-align:left;padding:3px 6px">Name</th><th style="text-align:left;padding:3px 6px">Type</th><th style="text-align:right;padding:3px 6px">Size</th></tr>';
            filesData.sort((a, b) => (b.size || 0) - (a.size || 0)).slice(0, 10).forEach(f => {
                html += `<tr style="border-bottom:1px solid #f0ece0"><td style="padding:2px 6px">${f.original_name || f.name}</td><td style="padding:2px 6px;color:#888">${f.mime_type || ''}</td><td style="padding:2px 6px;text-align:right">${this._fmt(f.size)}</td></tr>`;
            });
            html += '</table>';
        }

        // LocalStorage breakdown
        html += `<div style="font-weight:bold;color:#003c74;padding:4px 0;border-bottom:1px solid #d4d0c8;margin-top:12px">LocalStorage Keys</div>`;
        html += '<table style="width:100%;border-collapse:collapse;margin-top:4px">';
        html += '<tr style="background:#ece9d8"><th style="text-align:left;padding:3px 6px">Key</th><th style="text-align:right;padding:3px 6px">Size</th><th style="padding:3px 6px">Action</th></tr>';
        lsEntries.forEach(e => {
            html += `<tr style="border-bottom:1px solid #f0ece0"><td style="padding:2px 6px;font-family:Consolas,monospace;font-size:10px">${e.key}</td><td style="padding:2px 6px;text-align:right">${this._fmt(e.size)}</td><td style="padding:2px 6px;text-align:center"><span style="color:#c00;cursor:pointer;font-size:10px" onclick="if(confirm('Delete ${e.key}?')){localStorage.removeItem('${e.key}');Apps.StorageManager.refresh()}" title="Delete">✕</span></td></tr>`;
        });
        html += '</table>';

        el.innerHTML = html;
    },

    _card(icon, title, line1, line2) {
        return `<div style="background:#f5f3e8;border:1px solid #d4d0c8;padding:8px 12px;border-radius:3px;min-width:120px;flex:1">
            <div style="font-size:16px;margin-bottom:2px">${icon}</div>
            <div style="font-weight:bold;font-size:10px;color:#003c74">${title}</div>
            <div style="font-size:10px;color:#666;margin-top:2px">${line1}</div>
            <div style="font-size:10px;color:#888">${line2}</div>
        </div>`;
    },

    _fmt(b) {
        if (!b) return '0 B';
        if (b < 1024) return b + ' B';
        if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
        if (b < 1073741824) return (b / 1048576).toFixed(1) + ' MB';
        return (b / 1073741824).toFixed(2) + ' GB';
    },
};
