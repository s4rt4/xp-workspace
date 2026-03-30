/**
 * Piano App — Virtual Piano with Tone.js
 */
Apps.Piano = {
    activeLibrary: null,
    playNote: () => {},

    noteFileMap: {
        'C4':'C4.mp3','C#4':'Db4.mp3','D4':'D4.mp3','D#4':'Eb4.mp3',
        'E4':'E4.mp3','F4':'F4.mp3','F#4':'Gb4.mp3','G4':'G4.mp3',
        'G#4':'Ab4.mp3','A4':'A4.mp3','A#4':'Bb4.mp3','B4':'B4.mp3','C5':'C5.mp3'
    },
    audioBaseUrl: 'https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/acoustic_grand_piano-mp3/',

    open() {
        // Load Tone.js if not loaded
        if (typeof Tone === 'undefined') {
            const s = document.createElement('script');
            s.src = 'https://unpkg.com/tone@14.7.77/build/Tone.js';
            s.onload = () => this._createWindow();
            document.head.appendChild(s);
        } else {
            this._createWindow();
        }
    },

    _createWindow() {
        XP.createWindow('piano', {
            title: 'Virtual Piano',
            icon: 'piano.png',
            width: 760, height: 370,
            resizable: false,
            content: `
                <style>
                    .piano-container { display:flex; flex-direction:column; align-items:center; background:#111; padding:20px; height:100%; margin:-8px; }
                    .piano-header { display:flex; align-items:center; gap:12px; margin-bottom:16px; width:100%; justify-content:space-between; }
                    .piano-header h3 { color:#fff; font-size:14px; margin:0; }
                    .piano-lib { color:#ccc; font-size:11px; display:flex; align-items:center; gap:6px; }
                    .piano-lib select { font-size:11px; padding:3px 8px; background:#333; color:#fff; border:1px solid #555; border-radius:4px; cursor:pointer; min-width:0; min-height:0; box-shadow:none; }
                    .piano-lib select:focus { outline:none; border-color:#4d4dff; }
                    .piano-keys { display:flex; position:relative; justify-content:center; }
                    .p-key { display:flex; justify-content:center; cursor:pointer; font-weight:bold; transition:all 0.1s; }
                    .p-white { width:80px; height:250px; background:#fff; color:#000; margin:0 3px; border-radius:0 0 10px 10px; border:1px solid #ccc; box-shadow:0 4px 6px rgba(0,0,0,0.5); align-items:flex-end; padding-bottom:12px; font-size:16px; }
                    .p-black { width:50px; height:150px; background:#000; color:transparent; position:absolute; z-index:2; border-radius:0 0 5px 5px; box-shadow:0 4px 6px rgba(0,0,0,0.8); font-size:0; }
                    .p-key.active { transform:scale(0.95) translateY(4px); }
                    .p-key.active[data-note="C4"] { box-shadow:0 0 20px #ff4d4d; }
                    .p-key.active[data-note="D4"] { box-shadow:0 0 20px #ff944d; }
                    .p-key.active[data-note="E4"] { box-shadow:0 0 20px #fff14d; }
                    .p-key.active[data-note="F4"] { box-shadow:0 0 20px #4dff4d; }
                    .p-key.active[data-note="G4"] { box-shadow:0 0 20px #4dffff; }
                    .p-key.active[data-note="A4"] { box-shadow:0 0 20px #4d4dff; }
                    .p-key.active[data-note="B4"] { box-shadow:0 0 20px #b84dff; }
                    .p-key.active[data-note="C5"] { box-shadow:0 0 20px #ff4db8; }
                    .p-key.active.p-black { box-shadow:0 0 14px #ff6; }
                    .piano-hint { color:#555; font-size:10px; margin-top:10px; }
                </style>
                <div class="piano-container">
                    <div class="piano-header">
                        <h3>Virtual Piano</h3>
                        <div class="piano-lib">
                            <label>Audio Library:</label>
                            <select id="piano-library" onchange="Apps.Piano._switchLib(this.value)">
                                <option value="tone" selected>Tone.js</option>
                                <option value="howler">Howler.js</option>
                                <option value="pizzicato">Pizzicato.js</option>
                            </select>
                        </div>
                    </div>
                    <div class="piano-keys" id="piano-keys">
                        <div class="p-key p-white" data-note="C4" data-key="A">Do</div>
                        <div class="p-key p-white" data-note="D4" data-key="S">Re</div>
                        <div class="p-key p-white" data-note="E4" data-key="D">Mi</div>
                        <div class="p-key p-white" data-note="F4" data-key="F">Fa</div>
                        <div class="p-key p-white" data-note="G4" data-key="G">Sol</div>
                        <div class="p-key p-white" data-note="A4" data-key="H">La</div>
                        <div class="p-key p-white" data-note="B4" data-key="J">Si</div>
                        <div class="p-key p-white" data-note="C5" data-key="K">Do</div>
                        <div class="p-key p-black" data-note="C#4" data-key="W" style="left:64px"></div>
                        <div class="p-key p-black" data-note="D#4" data-key="E" style="left:150px"></div>
                        <div class="p-key p-black" data-note="F#4" data-key="T" style="left:322px"></div>
                        <div class="p-key p-black" data-note="G#4" data-key="Y" style="left:408px"></div>
                        <div class="p-key p-black" data-note="A#4" data-key="U" style="left:494px"></div>
                    </div>
                    <div class="piano-hint">Keyboard: A S D F G H J K (white) | W E T Y U (black)</div>
                </div>
            `,
            onReady: () => this._init(),
        });
    },

    _init() {
        this._setupTone();
        document.getElementById('piano-keys')?.addEventListener('click', (e) => {
            const key = e.target.closest('.p-key');
            if (key) this._press(key);
        });
        this._keyHandler = (e) => {
            if (e.repeat) return;
            if (!document.getElementById('window-piano')) { document.removeEventListener('keydown', this._keyHandler); return; }
            const key = document.querySelector(`.p-key[data-key="${e.key.toUpperCase()}"]`);
            if (key) this._press(key);
        };
        document.addEventListener('keydown', this._keyHandler);
    },

    _loadScript(url) {
        return new Promise((resolve) => {
            if (document.querySelector(`script[src="${url}"]`)) { resolve(); return; }
            const s = document.createElement('script');
            s.src = url; s.onload = resolve; document.head.appendChild(s);
        });
    },

    _setupTone() {
        const urls = {};
        Object.entries(this.noteFileMap).forEach(([note, file]) => { urls[note] = file; });
        const reverb = new Tone.Reverb({ decay: 1.5, wet: 0.3 }).toDestination();
        const piano = new Tone.Sampler({ urls, baseUrl: this.audioBaseUrl,
            onload: () => console.log('Piano ready (Tone.js + Reverb)')
        }).connect(reverb);
        this.activeLibrary = piano;
        this.playNote = (note) => { Tone.start(); piano.triggerAttackRelease(note, '1n'); };
    },

    _setupHowler() {
        const sounds = {};
        Object.entries(this.noteFileMap).forEach(([note, file]) => {
            sounds[note] = new Howl({ src: [this.audioBaseUrl + file] });
        });
        this.activeLibrary = sounds;
        this.playNote = (note) => { if (sounds[note]) sounds[note].play(); };
        console.log('Piano ready (Howler.js)');
    },

    _setupPizzicato() {
        const sounds = {};
        const echo = new Pizzicato.Effects.Delay({ feedback: 0.4, time: 0.3, mix: 0.5 });
        Object.entries(this.noteFileMap).forEach(([note, file]) => {
            const s = new Pizzicato.Sound(this.audioBaseUrl + file);
            s.addEffect(echo);
            sounds[note] = s;
        });
        this.activeLibrary = sounds;
        this.playNote = (note) => { if (sounds[note]) sounds[note].clone().play(); };
        console.log('Piano ready (Pizzicato.js + Delay)');
    },

    async _switchLib(choice) {
        if (choice === 'howler') {
            await this._loadScript('https://cdnjs.cloudflare.com/ajax/libs/howler/2.2.3/howler.core.min.js');
            this._setupHowler();
        } else if (choice === 'pizzicato') {
            await this._loadScript('https://cdnjs.cloudflare.com/ajax/libs/pizzicato/0.6.4/Pizzicato.min.js');
            this._setupPizzicato();
        } else {
            this._setupTone();
        }
    },

    _press(keyEl) {
        if (!keyEl) return;
        this.playNote(keyEl.dataset.note);
        keyEl.classList.add('active');
        setTimeout(() => keyEl.classList.remove('active'), 300);
    },
};
