/**
 * Word Processor — Rich text editor with formatting toolbar
 */
Apps.WordProcessor = {
    open() {
        if (XP.windows['wordprocessor']) { XP.focusWindow('wordprocessor'); return; }
        XP.createWindow('wordprocessor', {
            title: 'Word Processor',
            icon: 'notepad.png', width: 750, height: 520,
            toolbar: `
                <button class="toolbar-btn" onclick="Apps.WordProcessor.openFile()"><img src="${ICON_PATH}/open.png" style="width:16px;height:16px" alt=""> Open</button>
                <button class="toolbar-btn" onclick="Apps.WordProcessor.saveHTML()"><img src="${ICON_PATH}/save.png" style="width:16px;height:16px" alt=""> Save</button>
                <button class="toolbar-btn" onclick="Apps.WordProcessor.print()">🖨 Print</button>
            `,
            content: `
                <style>
                    .wp-wrap{display:flex;flex-direction:column;height:100%}
                    .wp-format{display:flex;align-items:center;gap:2px;padding:3px 6px;background:#ece9d8;border-bottom:1px solid #d4d0c8;flex-wrap:wrap}
                    .wp-fbtn{padding:2px 6px;cursor:pointer;border:1px solid transparent;border-radius:2px;font-size:12px;min-width:22px;text-align:center;background:none;min-height:0;box-shadow:none;color:#333}
                    .wp-fbtn:hover{background:#e0ecff;border-color:#bbb}
                    .wp-sep{width:1px;height:18px;background:#bbb;margin:0 2px}
                    .wp-editor{flex:1;padding:16px 24px;overflow-y:auto;outline:none;font-family:'Times New Roman',serif;font-size:14px;line-height:1.6;background:#fff;min-height:0}
                    .wp-editor:focus{outline:none}
                </style>
                <div class="wp-wrap">
                    <div class="wp-format">
                        <select class="xp-select" style="font-size:10px;width:100px" onchange="document.execCommand('fontName',false,this.value)">
                            <option>Arial</option><option>Times New Roman</option><option>Courier New</option><option>Georgia</option><option>Verdana</option><option>Tahoma</option><option>Consolas</option>
                        </select>
                        <select class="xp-select" style="font-size:10px;width:45px" onchange="document.execCommand('fontSize',false,this.value)">
                            <option value="1">8</option><option value="2">10</option><option value="3" selected>12</option><option value="4">14</option><option value="5">18</option><option value="6">24</option><option value="7">36</option>
                        </select>
                        <div class="wp-sep"></div>
                        <button class="wp-fbtn" onclick="document.execCommand('bold')" title="Bold"><b>B</b></button>
                        <button class="wp-fbtn" onclick="document.execCommand('italic')" title="Italic"><i>I</i></button>
                        <button class="wp-fbtn" onclick="document.execCommand('underline')" title="Underline"><u>U</u></button>
                        <button class="wp-fbtn" onclick="document.execCommand('strikeThrough')" title="Strikethrough"><s>S</s></button>
                        <div class="wp-sep"></div>
                        <input type="color" value="#000000" style="width:22px;height:20px;padding:0;border:1px solid #bbb;cursor:pointer" onchange="document.execCommand('foreColor',false,this.value)" title="Text color">
                        <input type="color" value="#ffff00" style="width:22px;height:20px;padding:0;border:1px solid #bbb;cursor:pointer" onchange="document.execCommand('hiliteColor',false,this.value)" title="Highlight">
                        <div class="wp-sep"></div>
                        <button class="wp-fbtn" onclick="document.execCommand('justifyLeft')" title="Align Left">⫷</button>
                        <button class="wp-fbtn" onclick="document.execCommand('justifyCenter')" title="Center">⫿</button>
                        <button class="wp-fbtn" onclick="document.execCommand('justifyRight')" title="Align Right">⫸</button>
                        <div class="wp-sep"></div>
                        <button class="wp-fbtn" onclick="document.execCommand('insertUnorderedList')" title="Bullet List">☰</button>
                        <button class="wp-fbtn" onclick="document.execCommand('insertOrderedList')" title="Numbered List">☷</button>
                        <div class="wp-sep"></div>
                        <button class="wp-fbtn" onclick="document.execCommand('indent')" title="Indent">→</button>
                        <button class="wp-fbtn" onclick="document.execCommand('outdent')" title="Outdent">←</button>
                        <div class="wp-sep"></div>
                        <button class="wp-fbtn" onclick="Apps.WordProcessor.insertTable()" title="Table">⊞</button>
                        <button class="wp-fbtn" onclick="document.execCommand('insertHorizontalRule')" title="Line">―</button>
                        <button class="wp-fbtn" onclick="Apps.WordProcessor.insertLink()" title="Link">🔗</button>
                        <button class="wp-fbtn" onclick="document.execCommand('removeFormat')" title="Clear format">✕</button>
                    </div>
                    <div class="wp-editor" id="wp-editor" contenteditable="true">
                        <h1>Welcome to Word Processor</h1>
                        <p>Start typing your document here. Use the toolbar above to format text.</p>
                    </div>
                </div>
            `,
            onReady: () => document.getElementById('wp-editor')?.focus(),
        });
    },

    insertLink() {
        const url = prompt('URL:', 'https://');
        if (url) document.execCommand('createLink', false, url);
    },

    insertTable() {
        const rows = parseInt(prompt('Rows:', '3')) || 3;
        const cols = parseInt(prompt('Columns:', '3')) || 3;
        let html = '<table border="1" cellpadding="4" cellspacing="0" style="border-collapse:collapse;width:100%;margin:8px 0">';
        for (let r = 0; r < rows; r++) {
            html += '<tr>';
            for (let c = 0; c < cols; c++) html += r === 0 ? '<th style="background:#ece9d8;padding:4px 8px">Header</th>' : '<td style="padding:4px 8px">&nbsp;</td>';
            html += '</tr>';
        }
        html += '</table>';
        document.execCommand('insertHTML', false, html);
    },

    openFile() {
        const input = document.createElement('input');
        input.type = 'file'; input.accept = '.html,.htm,.txt';
        input.onchange = async () => {
            const file = input.files?.[0]; if (!file) return;
            const text = await file.text();
            document.getElementById('wp-editor').innerHTML = text;
        };
        input.click();
    },

    saveHTML() {
        const content = document.getElementById('wp-editor')?.innerHTML || '';
        const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Document</title><style>body{font-family:'Times New Roman',serif;font-size:14px;line-height:1.6;max-width:800px;margin:20px auto;padding:0 20px}</style></head><body>${content}</body></html>`;
        const blob = new Blob([html], { type: 'text/html' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'document.html'; a.click();
    },

    print() { const content = document.getElementById('wp-editor')?.innerHTML; const w = window.open('', '_blank'); w.document.write(`<html><head><style>body{font-family:'Times New Roman',serif;font-size:14px;line-height:1.6;max-width:800px;margin:20px auto}</style></head><body>${content}</body></html>`); w.document.close(); w.print(); },
};
