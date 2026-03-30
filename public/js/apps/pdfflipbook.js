/**
 * PDF Flipbook App — PDF viewer with page flip animation
 * Based on pdf-flipbook project
 */
Apps.PDFFlipbook = {
    _libsLoaded: false,
    pdfDoc: null,
    flipbook: null,
    currentPage: 0,
    totalPages: 0,
    zoom: 1,

    open() {
        this._loadLibs().then(() => this._createWindow());
    },

    _js(u){return new Promise(r=>{if(document.querySelector(`script[src="${u}"]`))return r();const s=document.createElement('script');s.src=u;s.onload=r;document.head.appendChild(s);});},

    _loadLibs() {
        if (this._libsLoaded) return Promise.resolve();
        return this._js('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js')
            .then(() => {
                pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
                return this._js('https://cdn.jsdelivr.net/npm/page-flip/dist/js/page-flip.browser.min.js');
            })
            .then(() => { this._libsLoaded = true; });
    },

    _createWindow() {
        XP.createWindow('pdfflipbook', {
            title: 'PDF Flipbook',
            icon: 'flipbook.png',
            width: 800, height: 560,
            toolbar: `
                <button class="toolbar-btn" onclick="Apps.PDFFlipbook.openFile()"><img src="${ICON_PATH}/folder-opened.png" style="width:16px;height:16px" alt=""> Open PDF</button>
                <div class="toolbar-separator"></div>
                <button class="toolbar-btn" onclick="Apps.PDFFlipbook.prev()">◀ Prev</button>
                <button class="toolbar-btn" onclick="Apps.PDFFlipbook.next()">Next ▶</button>
                <div class="toolbar-separator"></div>
                <span style="font-size:11px" id="pdf-page-info">-</span>
                <div class="toolbar-separator"></div>
                <button class="toolbar-btn" onclick="Apps.PDFFlipbook.zoomIn()">+</button>
                <button class="toolbar-btn" onclick="Apps.PDFFlipbook.zoomOut()">−</button>
            `,
            statusbar: '<span class="statusbar-section" id="pdf-status">Open a PDF file</span>',
            content: `
                <style>
                    .pdf-container { display:flex; justify-content:center; align-items:center; height:100%; margin:-8px; background:#555; overflow:hidden; }
                    .pdf-empty { text-align:center; color:#ccc; }
                    .pdf-empty img { width:48px; height:48px; opacity:0.3; margin-bottom:8px; }
                    #pdf-flipbook { transform-origin:center center; }
                    .pdf-page canvas { display:block; }
                </style>
                <div class="pdf-container" id="pdf-container">
                    <div class="pdf-empty"><img src="${ICON_PATH}/generic-document.png" alt=""><div>Open a PDF file to view</div></div>
                </div>
                <input type="file" id="pdf-file-input" accept=".pdf" style="display:none" onchange="Apps.PDFFlipbook.handleFile(this)">
            `,
        });
    },

    openFile() { document.getElementById('pdf-file-input')?.click(); },

    async handleFile(input) {
        const file = input.files?.[0]; if (!file) return;
        const buffer = await file.arrayBuffer();
        this.pdfDoc = await pdfjsLib.getDocument({ data: buffer }).promise;
        this.totalPages = this.pdfDoc.numPages;
        this.zoom = 1;
        await this._renderFlipbook();
        input.value = '';
        const s = document.getElementById('pdf-status');
        if (s) s.textContent = `${file.name} — ${this.totalPages} pages`;
    },

    async _renderFlipbook() {
        const container = document.getElementById('pdf-container');
        if (!container || !this.pdfDoc) return;

        // Render all pages to canvases
        const pages = [];
        const firstPage = await this.pdfDoc.getPage(1);
        const vp = firstPage.getViewport({ scale: 1.2 });
        const pageW = Math.floor(vp.width);
        const pageH = Math.floor(vp.height);

        container.innerHTML = '<div id="pdf-flipbook"></div>';
        const fbEl = document.getElementById('pdf-flipbook');

        for (let i = 1; i <= this.totalPages; i++) {
            const page = await this.pdfDoc.getPage(i);
            const viewport = page.getViewport({ scale: 1.2 });
            const div = document.createElement('div');
            div.className = 'pdf-page';
            const canvas = document.createElement('canvas');
            canvas.width = pageW;
            canvas.height = pageH;
            const ctx = canvas.getContext('2d');
            await page.render({ canvasContext: ctx, viewport }).promise;
            div.appendChild(canvas);
            fbEl.appendChild(div);
        }

        // Init flipbook
        if (typeof St !== 'undefined' && St.PageFlip) {
            this.flipbook = new St.PageFlip(fbEl, {
                width: pageW, height: pageH,
                showCover: true, maxShadowOpacity: 0.5,
            });
            this.flipbook.loadFromHTML(fbEl.querySelectorAll('.pdf-page'));
            this.flipbook.on('flip', (e) => this._updatePageInfo(e.data));
        }
        this._updatePageInfo(0);
    },

    _updatePageInfo(page) {
        this.currentPage = page;
        const el = document.getElementById('pdf-page-info');
        if (el) el.textContent = `Page ${page + 1} / ${this.totalPages}`;
    },

    prev() { this.flipbook?.flipPrev(); },
    next() { this.flipbook?.flipNext(); },

    zoomIn() {
        this.zoom = Math.min(2, this.zoom + 0.15);
        const el = document.getElementById('pdf-flipbook');
        if (el) el.style.transform = `scale(${this.zoom})`;
    },
    zoomOut() {
        this.zoom = Math.max(0.4, this.zoom - 0.15);
        const el = document.getElementById('pdf-flipbook');
        if (el) el.style.transform = `scale(${this.zoom})`;
    },
};
