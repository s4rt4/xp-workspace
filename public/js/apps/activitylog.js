/**
 * Activity Log — View all workspace activity history
 */
Apps.ActivityLog = {
    open() {
        if (XP.windows['activitylog']) { XP.focusWindow('activitylog'); return; }

        XP.createWindow('activitylog', {
            title: 'Activity Log',
            icon: 'event-viewer.png',
            width: 600, height: 420,
            toolbar: `
                <button class="toolbar-btn" onclick="Apps.ActivityLog.refresh()"><img src="${ICON_PATH}/forward.png" style="width:16px;height:16px" alt=""> Refresh</button>
                <div class="toolbar-separator"></div>
                <select class="xp-select" id="al-filter" onchange="Apps.ActivityLog.refresh()" style="font-size:10px">
                    <option value="">All Types</option>
                    <option value="project">Projects</option>
                    <option value="task">Tasks</option>
                    <option value="wiki">Wiki</option>
                    <option value="file">Files</option>
                </select>
            `,
            statusbar: '<span id="al-status">Loading...</span>',
            content: `
                <style>
                    .al-list{height:100%;overflow-y:auto;font-size:11px}
                    .al-item{display:flex;align-items:flex-start;gap:8px;padding:6px 10px;border-bottom:1px solid #f0ece0}
                    .al-item:hover{background:#f8f6f0}
                    .al-icon{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0}
                    .al-icon.created{background:#d4edda;color:#155724}
                    .al-icon.updated{background:#fff3cd;color:#856404}
                    .al-icon.deleted{background:#f8d7da;color:#721c24}
                    .al-icon.uploaded{background:#cce5ff;color:#004085}
                    .al-body{flex:1;min-width:0}
                    .al-action{font-weight:bold;color:#003c74}
                    .al-entity{color:#444}
                    .al-time{color:#999;font-size:10px;white-space:nowrap}
                    .al-empty{text-align:center;padding:40px;color:#888}
                </style>
                <div class="al-list" id="al-list"></div>
            `,
            onReady: () => this.refresh(),
        });
    },

    async refresh() {
        const el = document.getElementById('al-list');
        const status = document.getElementById('al-status');
        if (!el) return;

        const filter = document.getElementById('al-filter')?.value || '';

        try {
            const res = await XP.api('/api/dashboard');
            let activities = res.recent_activity || [];

            if (filter) activities = activities.filter(a => a.type === filter);

            if (activities.length === 0) {
                el.innerHTML = '<div class="al-empty">No activity recorded yet</div>';
                status.textContent = '0 entries';
                return;
            }

            const iconMap = { created: '➕', updated: '✏️', deleted: '🗑️', uploaded: '📤' };
            const icons = { project: '📂', task: '✅', wiki: '📝', file: '📁' };

            el.innerHTML = activities.map(a => {
                const actionIcon = iconMap[a.action] || '📋';
                const typeIcon = icons[a.type] || '📋';
                const actionClass = a.action || 'updated';
                const time = a.created_at ? new Date(a.created_at).toLocaleString() : '';
                const relTime = a.created_at ? this._relative(new Date(a.created_at)) : '';

                return `<div class="al-item">
                    <div class="al-icon ${actionClass}">${actionIcon}</div>
                    <div class="al-body">
                        <span class="al-action">${a.action || 'unknown'}</span>
                        <span style="color:#888">${a.type || ''}</span>
                        <span class="al-entity">"${a.entity_name || ''}"</span>
                    </div>
                    <span class="al-time" title="${time}">${relTime}</span>
                </div>`;
            }).join('');

            status.textContent = `${activities.length} entries`;
        } catch {
            el.innerHTML = '<div class="al-empty" style="color:#c00">Failed to load activity log</div>';
        }
    },

    _relative(date) {
        const diff = Math.floor((Date.now() - date.getTime()) / 1000);
        if (diff < 60) return 'just now';
        if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
        if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
        if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
        return date.toLocaleDateString();
    },
};
