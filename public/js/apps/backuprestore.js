/**
 * Backup & Restore — Export/import all workspace data as JSON
 */
Apps.BackupRestore = {
    open() {
        if (XP.windows['backuprestore']) { XP.focusWindow('backuprestore'); return; }

        XP.createWindow('backuprestore', {
            title: 'Backup & Restore',
            icon: 'backup.png',
            width: 480, height: 380,
            resizable: false,
            content: `
                <style>
                    .br-wrap{padding:12px}
                    .br-section{background:#f5f3e8;border:1px solid #d4d0c8;padding:12px;margin-bottom:10px;border-radius:3px}
                    .br-section h3{font-size:12px;color:#003c74;margin:0 0 6px;display:flex;align-items:center;gap:6px}
                    .br-section p{font-size:10px;color:#666;margin:0 0 8px;line-height:1.4}
                    .br-progress{display:none;margin-top:8px;font-size:10px;color:#888}
                    .br-progress.active{display:block}
                    .br-bar{height:8px;background:#ddd;border-radius:4px;overflow:hidden;margin-top:4px}
                    .br-bar-fill{height:100%;background:#316ac5;border-radius:4px;transition:width .3s;width:0%}
                </style>
                <div class="br-wrap">
                    <div class="br-section">
                        <h3>💾 Backup</h3>
                        <p>Export all workspace data (projects, tasks, wiki pages, notes, todos, files metadata, preferences) as a single JSON file.</p>
                        <button class="xp-btn xp-btn-primary" onclick="Apps.BackupRestore.backup()">Create Backup</button>
                        <div class="br-progress" id="br-backup-prog">
                            <span id="br-backup-status">Preparing...</span>
                            <div class="br-bar"><div class="br-bar-fill" id="br-backup-bar"></div></div>
                        </div>
                    </div>
                    <div class="br-section">
                        <h3>📥 Restore</h3>
                        <p>Import a previously exported backup file. <strong style="color:#c00">Warning:</strong> This will merge data with existing records.</p>
                        <button class="xp-btn" onclick="document.getElementById('br-file').click()">Select Backup File</button>
                        <input type="file" id="br-file" accept=".json" style="display:none" onchange="Apps.BackupRestore.restore(this)">
                        <div class="br-progress" id="br-restore-prog">
                            <span id="br-restore-status">Restoring...</span>
                            <div class="br-bar"><div class="br-bar-fill" id="br-restore-bar"></div></div>
                        </div>
                    </div>
                    <div class="br-section">
                        <h3>🗑️ LocalStorage</h3>
                        <p>Export or clear browser-side settings (clock, widgets, pinned apps, startup apps).</p>
                        <button class="xp-btn" onclick="Apps.BackupRestore.exportLocalStorage()" style="margin-right:4px">Export Settings</button>
                        <button class="xp-btn" onclick="Apps.BackupRestore.importLocalStorage()">Import Settings</button>
                    </div>
                </div>
            `,
        });
    },

    async backup() {
        const prog = document.getElementById('br-backup-prog');
        const status = document.getElementById('br-backup-status');
        const bar = document.getElementById('br-backup-bar');
        prog.classList.add('active');

        const data = { _meta: { version: '1.0', date: new Date().toISOString(), app: 'XP Workspace' } };
        const endpoints = [
            { key: 'projects', url: '/api/projects' },
            { key: 'tasks', url: '/api/tasks' },
            { key: 'wiki', url: '/api/wiki' },
            { key: 'notes', url: '/api/notes' },
            { key: 'todos', url: '/api/todos' },
            { key: 'files', url: '/api/files?folder=/' },
        ];

        for (let i = 0; i < endpoints.length; i++) {
            const ep = endpoints[i];
            status.textContent = `Fetching ${ep.key}...`;
            bar.style.width = ((i + 1) / endpoints.length * 100) + '%';
            try {
                const res = await XP.api(ep.url);
                data[ep.key] = res.data || [];
            } catch { data[ep.key] = []; }
        }

        // Include wiki page contents
        status.textContent = 'Fetching wiki pages content...';
        if (data.wiki && data.wiki.length > 0) {
            const wikiDetails = [];
            for (const page of data.wiki) {
                try {
                    const res = await XP.api(`/api/wiki/${page.id}`);
                    wikiDetails.push(res.data || page);
                } catch { wikiDetails.push(page); }
            }
            data.wiki = wikiDetails;
        }

        // Preferences
        try {
            const res = await fetch(BASE_URL + '/desktop/config');
            const config = await res.json();
            data.preferences = config.preferences || {};
        } catch { data.preferences = {}; }

        status.textContent = 'Creating file...';
        bar.style.width = '100%';

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        const date = new Date().toISOString().slice(0, 10);
        a.href = URL.createObjectURL(blob);
        a.download = `xp-workspace-backup-${date}.json`;
        a.click();
        URL.revokeObjectURL(a.href);

        status.textContent = `Backup complete! (${(blob.size / 1024).toFixed(1)} KB)`;
        XP.notify('Backup', 'Workspace backup created successfully');
    },

    async restore(input) {
        const file = input.files?.[0];
        if (!file) return;
        input.value = '';

        const prog = document.getElementById('br-restore-prog');
        const status = document.getElementById('br-restore-status');
        const bar = document.getElementById('br-restore-bar');
        prog.classList.add('active');

        try {
            status.textContent = 'Reading file...';
            const text = await file.text();
            const data = JSON.parse(text);

            if (!data._meta) { status.textContent = 'Invalid backup file'; return; }

            const steps = [];
            if (data.projects) data.projects.forEach(p => steps.push({ type: 'project', data: p }));
            if (data.notes) data.notes.forEach(n => steps.push({ type: 'note', data: n }));
            if (data.todos) data.todos.forEach(t => steps.push({ type: 'todo', data: t }));

            let done = 0;
            for (const step of steps) {
                done++;
                bar.style.width = (done / steps.length * 100) + '%';
                status.textContent = `Restoring ${step.type} ${done}/${steps.length}...`;
                try {
                    if (step.type === 'project') await XP.api('/api/projects', 'POST', { name: step.data.name, description: step.data.description, color: step.data.color });
                    if (step.type === 'note') await XP.api('/api/notes', 'POST', { content: step.data.content, color: step.data.color });
                    if (step.type === 'todo') await XP.api('/api/todos', 'POST', { text: step.data.text, is_done: step.data.is_done });
                } catch {}
            }

            // Restore preferences
            if (data.preferences && Object.keys(data.preferences).length > 0) {
                status.textContent = 'Restoring preferences...';
                try { await XP.api('/desktop/preferences', 'POST', data.preferences); } catch {}
            }

            bar.style.width = '100%';
            status.textContent = `Restore complete! ${steps.length} items restored.`;
            XP.notify('Restore', 'Workspace data restored. Refresh to see changes.');
        } catch (e) {
            status.textContent = 'Error: ' + e.message;
        }
    },

    exportLocalStorage() {
        const data = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            data[key] = localStorage.getItem(key);
        }
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'xp-workspace-settings.json';
        a.click();
        XP.notify('Settings', 'LocalStorage settings exported');
    },

    importLocalStorage() {
        const input = document.createElement('input');
        input.type = 'file'; input.accept = '.json';
        input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return;
            try {
                const data = JSON.parse(await file.text());
                Object.entries(data).forEach(([k, v]) => localStorage.setItem(k, v));
                XP.notify('Settings', 'Settings imported. Refresh to apply.');
            } catch { XP.notify('Error', 'Invalid settings file'); }
        };
        input.click();
    },
};
