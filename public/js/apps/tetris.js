/**
 * Tetris Game — Classic Tetris in XP Window
 */
Apps.Tetris = {
    game: null,

    open() {
        XP.createWindow('tetris', {
            title: 'Tetris',
            icon: 'tetris.png',
            width: 480, height: 520,
            resizable: false,
            content: `
                <style>
                    .tetris-wrap { display:flex; gap:12px; background:#212529; padding:12px; margin:-8px; height:calc(100% + 16px); font-family:'Segoe UI',sans-serif; }
                    .tetris-board { border:3px solid #555; }
                    .tetris-side { display:flex; flex-direction:column; gap:10px; color:#fff; min-width:130px; }
                    .tetris-side h4 { margin:0; font-size:11px; color:#aaa; border-bottom:1px solid #444; padding-bottom:4px; }
                    .tetris-stat { display:flex; justify-content:space-between; font-size:12px; padding:2px 0; }
                    .tetris-stat .val { color:#f7d51d; font-weight:bold; font-size:14px; }
                    .tetris-next { border:2px solid #555; margin:4px auto; }
                    .tetris-controls { display:grid; grid-template-columns:1fr 1fr 1fr; gap:4px; margin-top:auto; }
                    .tetris-controls button { background:#444; color:#fff; border:1px solid #666; padding:8px; font-size:14px; cursor:pointer; min-width:0; min-height:0; box-shadow:none; border-radius:2px; }
                    .tetris-controls button:hover { background:#555; }
                    .t-start { grid-column:span 3; background:#27ae60 !important; font-size:12px !important; }
                    .t-rotate { grid-column: 3; grid-row: 1; }
                </style>
                <div class="tetris-wrap">
                    <canvas id="tetris-canvas" class="tetris-board" width="240" height="480"></canvas>
                    <div class="tetris-side">
                        <div><h4>Next</h4><canvas id="tetris-next" class="tetris-next" width="96" height="96"></canvas></div>
                        <div>
                            <h4>Stats</h4>
                            <div class="tetris-stat"><span>Score</span><span class="val" id="t-score">0</span></div>
                            <div class="tetris-stat"><span>Lines</span><span class="val" id="t-lines">0</span></div>
                            <div class="tetris-stat"><span>Level</span><span class="val" id="t-level">0</span></div>
                        </div>
                        <div class="tetris-controls">
                            <button class="t-start" id="t-start" onclick="Apps.Tetris.start()">Start Game</button>
                            <button onclick="Apps.Tetris.move(-1)">◀</button>
                            <button onclick="Apps.Tetris.drop()">▼</button>
                            <button onclick="Apps.Tetris.move(1)">▶</button>
                            <button class="t-rotate" onclick="Apps.Tetris.rotate()">↻</button>
                        </div>
                    </div>
                </div>
            `,
            onReady: () => this._init(),
            onClose: () => this._stop(),
        });
    },

    _init() {
        const c = document.getElementById('tetris-canvas');
        const nc = document.getElementById('tetris-next');
        if (!c || !nc) return;
        this.game = {
            ctx: c.getContext('2d'), nctx: nc.getContext('2d'),
            COLS: 10, ROWS: 20, BS: 24, NBS: 24,
            board: null, player: null, next: null,
            score: 0, lines: 0, level: 0,
            dropInterval: 1000, dropCounter: 0, lastTime: 0,
            running: false, animId: null,
            COLORS: [null,'#e76e55','#209cee','#f7d51d','#92cc41','#6f42c1','#f2811c','#00c4c4'],
        };
        const g = this.game;
        c.width = g.COLS * g.BS; c.height = g.ROWS * g.BS;
        nc.width = 4 * g.NBS; nc.height = 4 * g.NBS;
        g.board = Array.from({length:g.ROWS}, ()=>new Array(g.COLS).fill(0));
        this._draw();

        this._keyHandler = (e) => {
            if (!this.game?.running) return;
            if (!document.getElementById('window-tetris')) { document.removeEventListener('keydown', this._keyHandler); return; }
            switch(e.key) {
                case 'ArrowLeft': e.preventDefault(); this.move(-1); break;
                case 'ArrowRight': e.preventDefault(); this.move(1); break;
                case 'ArrowDown': e.preventDefault(); this.drop(); break;
                case 'ArrowUp': e.preventDefault(); this.rotate(); break;
            }
        };
        document.addEventListener('keydown', this._keyHandler);
    },

    _stop() {
        if (this.game?.animId) cancelAnimationFrame(this.game.animId);
        if (this._keyHandler) document.removeEventListener('keydown', this._keyHandler);
        this.game = null;
    },

    _piece() {
        const types = 'TJOSLIZ';
        const t = types[Math.floor(Math.random()*types.length)];
        let m;
        switch(t) {
            case 'T': m=[[0,1,0],[1,1,1],[0,0,0]]; break;
            case 'O': m=[[2,2],[2,2]]; break;
            case 'L': m=[[0,3,0],[0,3,0],[0,3,3]]; break;
            case 'J': m=[[0,4,0],[0,4,0],[4,4,0]]; break;
            case 'I': m=[[0,5,0,0],[0,5,0,0],[0,5,0,0],[0,5,0,0]]; break;
            case 'S': m=[[0,6,6],[6,6,0],[0,0,0]]; break;
            case 'Z': m=[[7,7,0],[0,7,7],[0,0,0]]; break;
        }
        return {matrix:m, pos:{x:0,y:0}};
    },

    _reset() {
        const g = this.game;
        g.player = g.next; g.next = this._piece();
        g.player.pos = {x:Math.floor(g.COLS/2)-Math.floor(g.player.matrix[0].length/2), y:0};
        this._drawNext();
        if (this._collide()) { g.running = false; cancelAnimationFrame(g.animId); XP.dialog('Game Over',`<div style="text-align:center"><div style="font-size:18px;font-weight:bold;margin-bottom:8px">Score: ${g.score}</div><div style="font-size:11px;color:#666">Lines: ${g.lines} | Level: ${g.level}</div></div>`); }
    },

    _collide() {
        const g=this.game, m=g.player.matrix, o=g.player.pos;
        for(let y=0;y<m.length;y++) for(let x=0;x<m[y].length;x++) {
            if(m[y][x]!==0) { const ny=y+o.y, nx=x+o.x; if(nx<0||nx>=g.COLS||ny>=g.ROWS||(ny>=0&&g.board[ny][nx]!==0)) return true; }
        } return false;
    },

    _merge() { const g=this.game; g.player.matrix.forEach((r,y)=>r.forEach((v,x)=>{ if(v) g.board[y+g.player.pos.y][x+g.player.pos.x]=v; })); },

    _checkLines() {
        const g=this.game; let cleared=0;
        for(let y=g.board.length-1;y>0;y--) {
            if(g.board[y].every(v=>v!==0)) { g.board.splice(y,1); g.board.unshift(new Array(g.COLS).fill(0)); y++; cleared++; }
        }
        if(cleared) { g.score+=[0,40,100,300,1200][cleared]*(g.level+1); g.lines+=cleared; if(g.lines>(g.level+1)*10){g.level++;g.dropInterval*=0.9;} this._updateUI(); }
    },

    _rotateMatrix(m) { return m.map((_,i)=>m.map(c=>c[i])).map(r=>r.reverse()); },

    _drawBlock(ctx, x, y, color, bs) {
        ctx.fillStyle=color; ctx.fillRect(x*bs,y*bs,bs,bs);
        ctx.fillStyle='rgba(255,255,255,0.4)'; ctx.fillRect(x*bs,y*bs,bs,bs*0.08); ctx.fillRect(x*bs,y*bs,bs*0.08,bs);
        ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.fillRect(x*bs+bs*0.92,y*bs,bs*0.08,bs); ctx.fillRect(x*bs,y*bs+bs*0.92,bs,bs*0.08);
    },

    _draw() {
        const g=this.game; if(!g) return;
        g.ctx.fillStyle='#212529'; g.ctx.fillRect(0,0,g.COLS*g.BS,g.ROWS*g.BS);
        g.board.forEach((r,y)=>r.forEach((v,x)=>{ if(v) this._drawBlock(g.ctx,x,y,g.COLORS[v],g.BS); }));
        if(g.player) g.player.matrix.forEach((r,y)=>r.forEach((v,x)=>{ if(v) this._drawBlock(g.ctx,x+g.player.pos.x,y+g.player.pos.y,g.COLORS[v],g.BS); }));
    },

    _drawNext() {
        const g=this.game; g.nctx.fillStyle='#212529'; g.nctx.fillRect(0,0,4*g.NBS,4*g.NBS);
        const m=g.next.matrix, ox=(4-m[0].length)/2, oy=(4-m.length)/2;
        m.forEach((r,y)=>r.forEach((v,x)=>{ if(v) this._drawBlock(g.nctx,x+ox,y+oy,g.COLORS[v],g.NBS); }));
    },

    _updateUI() {
        const g=this.game;
        const s=document.getElementById('t-score'),l=document.getElementById('t-lines'),lv=document.getElementById('t-level');
        if(s) s.textContent=g.score; if(l) l.textContent=g.lines; if(lv) lv.textContent=g.level;
    },

    _loop(time=0) {
        const g=this.game; if(!g||!g.running) return;
        g.dropCounter+=time-g.lastTime; g.lastTime=time;
        if(g.dropCounter>g.dropInterval) this.drop();
        this._draw(); g.animId=requestAnimationFrame((t)=>this._loop(t));
    },

    start() {
        const g=this.game; if(!g) return;
        if(g.animId) cancelAnimationFrame(g.animId);
        g.board=Array.from({length:g.ROWS},()=>new Array(g.COLS).fill(0));
        g.next=this._piece(); this._reset();
        g.score=0; g.lines=0; g.level=0; g.dropInterval=1000; g.running=true; g.lastTime=0; g.dropCounter=0;
        this._updateUI(); this._loop();
        document.getElementById('t-start').textContent='Restart';
    },

    move(dir) { const g=this.game; if(!g?.running) return; g.player.pos.x+=dir; if(this._collide()) g.player.pos.x-=dir; this._draw(); },
    drop() { const g=this.game; if(!g?.running) return; g.player.pos.y++; if(this._collide()){g.player.pos.y--;this._merge();this._checkLines();this._reset();} g.dropCounter=0; this._draw(); },
    rotate() { const g=this.game; if(!g?.running) return; const old=g.player.matrix; g.player.matrix=this._rotateMatrix(old); let off=1; while(this._collide()){g.player.pos.x+=off;off=-(off+(off>0?1:-1));if(Math.abs(off)>g.player.matrix[0].length){g.player.matrix=old;return;}} this._draw(); },
};
