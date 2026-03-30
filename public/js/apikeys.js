/**
 * API Key Manager — Shared dialog for managing API keys per app
 */
const ApiKeys = {
    async showSettings(appId, providers, onSaved) {
        const res = await XP.api(`/api/keys?app=${appId}`);
        const keys = res.data || [];

        const keyMap = {};
        keys.forEach(k => { keyMap[k.provider] = k; });

        const rows = providers.map(p => {
            const existing = keyMap[p.id];
            const masked = existing ? existing.api_key_masked : '';
            const active = existing ? existing.is_active : 1;
            return `
                <div class="ak-row">
                    <label class="ak-label">${esc(p.name)}</label>
                    <div class="ak-field">
                        <input class="xp-input ak-input" id="ak-${p.id}" placeholder="${masked || 'Enter API key...'}"
                               style="flex:1" data-provider="${p.id}">
                        ${existing ? `<span class="ak-status ${active ? 'ak-on' : 'ak-off'}">${active ? 'ON' : 'OFF'}</span>` : ''}
                    </div>
                    ${p.extraFields ? p.extraFields.map(ef =>
                        `<div class="ak-field" style="margin-top:2px">
                            <input class="xp-input ak-input" id="ak-extra-${p.id}-${ef.key}" placeholder="${ef.placeholder || ef.key}" style="flex:1" data-extra="${ef.key}">
                        </div>`
                    ).join('') : ''}
                </div>`;
        }).join('');

        const result = await XP.dialog('API Key Settings — ' + appId, `
            <div style="min-width:380px;max-height:400px;overflow-y:auto">
                <style>
                    .ak-row { margin-bottom:8px; padding-bottom:8px; border-bottom:1px solid #f0ece0; }
                    .ak-row:last-child { border-bottom:none; }
                    .ak-label { display:block; font-size:11px; font-weight:bold; color:#003c74; margin-bottom:3px; }
                    .ak-field { display:flex; gap:4px; align-items:center; }
                    .ak-status { font-size:9px; padding:1px 6px; border-radius:2px; font-weight:bold; }
                    .ak-on { background:#d4edda; color:#155724; }
                    .ak-off { background:#f8d7da; color:#721c24; }
                </style>
                <div style="font-size:10px;color:#888;margin-bottom:8px">Leave empty to keep current key. Enter new value to update.</div>
                ${rows}
            </div>
        `, [{ text: 'Save', primary: true }, { text: 'Cancel' }]);

        if (result === 0) {
            let saved = 0;
            for (const p of providers) {
                const input = document.getElementById(`ak-${p.id}`);
                const val = input?.value?.trim();
                if (!val) continue;

                const payload = { app: appId, provider: p.id, api_key: val };

                // Check for extra fields
                if (p.extraFields) {
                    const extra = {};
                    p.extraFields.forEach(ef => {
                        const exInput = document.getElementById(`ak-extra-${p.id}-${ef.key}`);
                        if (exInput?.value?.trim()) extra[ef.key] = exInput.value.trim();
                    });
                    if (Object.keys(extra).length) payload.extra = extra;
                }

                await XP.api('/api/keys', 'POST', payload);
                saved++;
            }
            if (saved > 0) {
                XP.notify('Saved', `${saved} API key(s) updated`);
                if (onSaved) onSaved();
            }
        }
    }
};
