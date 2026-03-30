/**
 * Translator App — Multi-provider text translation
 */
Apps.Translator = {
    languages: [
        ['id','Indonesian'],['en','English'],['es','Spanish'],['fr','French'],['de','German'],
        ['ja','Japanese'],['ko','Korean'],['zh','Chinese'],['ar','Arabic'],['ru','Russian'],
        ['pt','Portuguese'],['hi','Hindi'],['it','Italian'],['tr','Turkish'],['vi','Vietnamese'],
        ['th','Thai'],['nl','Dutch'],['sv','Swedish'],['pl','Polish'],['el','Greek'],
    ],
    providers: [
        ['google','Google Translate'],['deepl','DeepL'],['microsoft','Microsoft'],['mymemory','MyMemory'],
    ],

    open() {
        const langOpts = this.languages.map(([c,n]) => `<option value="${c}">${n}</option>`).join('');
        const provOpts = this.providers.map(([v,n]) => `<option value="${v}">${n}</option>`).join('');
        XP.createWindow('translator', {
            title: 'Translator',
            icon: 'translator.png',
            width: 600, height: 420,
            toolbar: `
                <select class="xp-select" id="tr-provider" style="width:140px">${provOpts}</select>
                <div class="toolbar-separator"></div>
                <button class="toolbar-btn" onclick="Apps.Translator.translate()"><img src="${ICON_PATH}/forward.png" style="width:16px;height:16px" alt=""> Translate</button>
                <div class="toolbar-separator"></div>
                <button class="toolbar-btn" onclick="Apps.Translator.settings()"><img src="${ICON_PATH}/properties.png" style="width:16px;height:16px" alt="" onerror="this.style.display='none'"> API Keys</button>
            `,
            statusbar: '<span class="statusbar-section" id="tr-status">Ready</span>',
            content: `
                <style>
                    .tr-layout { display:flex; flex-direction:column; height:100%; margin:-8px; }
                    .tr-lang-row { display:flex; align-items:center; gap:8px; padding:6px 8px; background:#ece9d8; border-bottom:1px solid #d4d0c8; }
                    .tr-lang-row select { flex:1; }
                    .tr-swap { min-width:0; min-height:0; box-shadow:none; background:var(--xp-btn-face); border:1px solid #999; padding:2px 8px; cursor:pointer; font-size:14px; }
                    .tr-panels { display:flex; flex:1; min-height:0; }
                    .tr-panel { flex:1; display:flex; flex-direction:column; }
                    .tr-panel:first-child { border-right:1px solid #d4d0c8; }
                    .tr-panel label { font-size:10px; color:#666; padding:4px 8px; background:#f5f3e8; border-bottom:1px solid #e0dcd0; }
                    .tr-panel textarea { flex:1; border:none; padding:8px; font-family:var(--xp-font); font-size:12px; resize:none; outline:none; }
                </style>
                <div class="tr-layout">
                    <div class="tr-lang-row">
                        <select class="xp-select" id="tr-from"><option value="auto">Auto Detect</option>${langOpts}</select>
                        <button class="tr-swap" onclick="Apps.Translator.swap()">⇄</button>
                        <select class="xp-select" id="tr-to">${langOpts.replace('value="en"','value="en" selected')}</select>
                    </div>
                    <div class="tr-panels">
                        <div class="tr-panel">
                            <label>Source Text</label>
                            <textarea id="tr-input" placeholder="Type or paste text here..." onkeydown="if(event.ctrlKey&&event.key==='Enter')Apps.Translator.translate()"></textarea>
                        </div>
                        <div class="tr-panel">
                            <label>Translation</label>
                            <textarea id="tr-output" readonly placeholder="Translation will appear here..." style="background:#f9f9f9"></textarea>
                        </div>
                    </div>
                </div>
            `,
        });
    },

    swap() {
        const f = document.getElementById('tr-from'), t = document.getElementById('tr-to');
        const fi = document.getElementById('tr-input'), fo = document.getElementById('tr-output');
        if (f && t) {
            const fromVal = f.value === 'auto' ? 'id' : f.value;
            const tmp = fromVal; f.value = t.value; t.value = tmp;
        }
        if (fi && fo && fo.value) { fi.value = fo.value; fo.value = ''; }
    },

    async translate() {
        const text = document.getElementById('tr-input')?.value?.trim();
        if (!text) return;
        const from = document.getElementById('tr-from')?.value || 'auto';
        const to = document.getElementById('tr-to')?.value || 'en';
        const provider = document.getElementById('tr-provider')?.value || 'google';

        const s = document.getElementById('tr-status');
        if (s) s.textContent = 'Translating...';
        document.getElementById('tr-output').value = '';

        const start = Date.now();
        const res = await XP.api('/api/translator/translate', 'POST', { text, from, to, provider });
        const ms = Date.now() - start;

        if (res.success && res.data) {
            document.getElementById('tr-output').value = res.data.translated;
            if (s) s.textContent = `via ${res.data.provider} (${ms}ms)`;
        } else {
            document.getElementById('tr-output').value = '';
            if (s) s.textContent = res.message || 'Translation failed';
            XP.notify('Error', res.message || 'Translation failed');
        }
    },

    settings() {
        ApiKeys.showSettings('translator', [
            { id: 'google', name: 'Google Cloud Translation' },
            { id: 'deepl', name: 'DeepL API' },
            { id: 'microsoft', name: 'Microsoft Azure Translator', extraFields: [{ key: 'region', placeholder: 'Region (e.g. southeastasia)' }] },
            { id: 'mymemory', name: 'MyMemory (email)' },
        ]);
    },
};
