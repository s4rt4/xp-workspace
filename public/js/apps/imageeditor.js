/**
 * Image Editor — Toast UI Image Editor wrapper
 * Full image editing: crop, rotate, flip, draw, text, shapes, filters
 * Lazy-loads Toast UI library on first open
 */
Apps.ImageEditor = {
    editor: null,
    currentFileName: 'untitled.png',
    _libLoaded: false,
    _libLoading: false,

    open() {
        if (XP.windows['imageeditor']) { XP.focusWindow('imageeditor'); return; }

        XP.createWindow('imageeditor', {
            title: 'Image Editor',
            icon: 'paint.png',
            width: 950, height: 680,
            toolbar: `
                <button class="toolbar-btn" onclick="Apps.ImageEditor.openFile()">
                    <img src="${ICON_PATH}/open.png" style="width:16px;height:16px" alt=""> Open
                </button>
                <div class="toolbar-separator"></div>
                <button class="toolbar-btn" onclick="Apps.ImageEditor.saveToWorkspace()">
                    <img src="${ICON_PATH}/save.png" style="width:16px;height:16px" alt=""> Save to Workspace
                </button>
                <button class="toolbar-btn" onclick="Apps.ImageEditor.downloadImage()">
                    <img src="${ICON_PATH}/copy-to-disc.png" style="width:16px;height:16px" alt=""> Download
                </button>
            `,
            statusbar: '<span id="ie-status">Loading editor library...</span>',
            content: `
                <style>
                    #ie-editor-wrap {
                        width: 100%; height: 100%;
                    }
                    /* Hide built-in header entirely */
                    #imageeditor .tui-image-editor-header { display: none !important; }
                    /* Make canvas area fill space */
                    #imageeditor .tui-image-editor-wrap { overflow: hidden; }
                    /* Fix z-index for color pickers */
                    #imageeditor .tui-colorpicker-container,
                    #imageeditor .color-picker-value { z-index: 10; }
                    #imageeditor .tui-image-editor { font-family: 'Tahoma', sans-serif; }
                    /* Adjust main area to fill since header is hidden */
                    #imageeditor .tui-image-editor-main-container { top: 0 !important; }
                    #imageeditor .tui-image-editor-main { top: 0 !important; }
                </style>
                <div id="ie-editor-wrap"></div>
                <input type="file" id="ie-file-input" accept="image/*" style="display:none">
            `,
            onReady: (win, content) => {
                // Bind file input handler
                document.getElementById('ie-file-input').addEventListener('change', (e) => {
                    Apps.ImageEditor._onFileSelected(e.target);
                });
                this._loadLibAndInit(content.querySelector('#ie-editor-wrap'));
            },
        });
    },

    _loadLibAndInit(container) {
        if (this._libLoaded && typeof tui !== 'undefined' && tui.ImageEditor) {
            this._initEditor(container);
            return;
        }

        const status = document.getElementById('ie-status');
        status.textContent = 'Loading editor library...';

        // Load CSS
        if (!document.querySelector('link[href*="tui-image-editor"]')) {
            const css = document.createElement('link');
            css.rel = 'stylesheet';
            css.href = 'https://uicdn.toast.com/tui-image-editor/latest/tui-image-editor.css';
            document.head.appendChild(css);
        }

        if (this._libLoading) return;
        this._libLoading = true;

        const script = document.createElement('script');
        script.src = 'https://uicdn.toast.com/tui-image-editor/latest/tui-image-editor.js';
        script.onload = () => {
            this._libLoaded = true;
            this._libLoading = false;
            this._initEditor(container);
        };
        script.onerror = () => {
            this._libLoading = false;
            status.textContent = 'Failed to load editor library. Check your internet connection.';
        };
        document.head.appendChild(script);
    },

    _initEditor(container) {
        if (typeof tui === 'undefined' || !tui.ImageEditor) {
            document.getElementById('ie-status').textContent = 'Error: Toast UI library not loaded';
            return;
        }

        const rect = container.getBoundingClientRect();

        this.editor = new tui.ImageEditor(container, {
            includeUI: {
                loadImage: { path: '', name: 'Blank' },
                menuBarPosition: 'left',
                initMenu: 'filter',
            },
            cssMaxWidth: Math.floor(rect.width) || 800,
            cssMaxHeight: Math.floor(rect.height) || 550,
            usageStatistics: false,
        });

        document.getElementById('ie-status').textContent = 'Ready — Open an image to begin editing';
    },

    openFile() {
        document.getElementById('ie-file-input').click();
    },

    _onFileSelected(input) {
        const file = input.files[0];
        if (!file) return;

        this.currentFileName = file.name;
        const status = document.getElementById('ie-status');
        status.textContent = 'Loading ' + file.name + '...';

        const reader = new FileReader();
        reader.onload = (e) => {
            if (!this.editor) {
                status.textContent = 'Editor not ready';
                return;
            }
            // loadImageFromURL needs a fresh URL — use the data URL from reader
            this.editor.loadImageFromURL(e.target.result, file.name)
                .then(() => {
                    this.editor.clearUndoStack();
                    status.textContent = file.name;
                })
                .catch((err) => {
                    // Toast UI sometimes rejects but still loads — check if it worked
                    if (err && err.message === 'The image is already loaded.') {
                        status.textContent = file.name;
                    } else {
                        status.textContent = 'Failed to load image';
                        console.error('Image load error:', err);
                    }
                });
        };
        reader.readAsDataURL(file);
        input.value = '';
    },

    downloadImage() {
        if (!this.editor) return;

        try {
            const dataURL = this.editor.toDataURL({ format: 'png' });
            if (!dataURL || dataURL === 'data:,') {
                document.getElementById('ie-status').textContent = 'No image to download';
                return;
            }
            const a = document.createElement('a');
            a.href = dataURL;
            a.download = this.currentFileName.replace(/\.[^.]+$/, '') + '_edited.png';
            a.click();
            document.getElementById('ie-status').textContent = 'Image downloaded';
        } catch (err) {
            document.getElementById('ie-status').textContent = 'Download failed — no image loaded';
        }
    },

    saveToWorkspace() {
        if (!this.editor) return;

        const status = document.getElementById('ie-status');

        try {
            const dataURL = this.editor.toDataURL({ format: 'png' });
            if (!dataURL || dataURL === 'data:,') {
                status.textContent = 'No image to save';
                return;
            }
            status.textContent = 'Uploading to workspace...';

            fetch(dataURL)
                .then(r => r.blob())
                .then(blob => {
                    const formData = new FormData();
                    const fileName = this.currentFileName.replace(/\.[^.]+$/, '') + '_edited.png';
                    formData.append('file', blob, fileName);
                    formData.append('folder', '/');

                    return fetch(BASE_URL + '/api/files/upload', {
                        method: 'POST',
                        body: formData,
                    });
                })
                .then(r => r.json())
                .then(res => {
                    if (res.success) {
                        status.textContent = 'Saved: ' + (res.data?.original_name || 'image');
                        XP.notify('Image Editor', 'Image saved to workspace');
                    } else {
                        status.textContent = 'Upload failed: ' + (res.message || 'Unknown error');
                    }
                })
                .catch(() => {
                    status.textContent = 'Upload error';
                });
        } catch (err) {
            status.textContent = 'Save failed — no image loaded';
        }
    },
};
