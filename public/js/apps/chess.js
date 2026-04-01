/**
 * Chess — Chess game vs simple AI
 */
Apps.Chess = {
    _board: [], _selected: null, _turn: 'w', _history: [], _gameOver: false,

    open() {
        if (XP.windows['chess']) { XP.focusWindow('chess'); return; }
        XP.createWindow('chess', {
            title: 'Chess', icon: 'tetris.png', width: 460, height: 500,
            toolbar: `<button class="toolbar-btn" onclick="Apps.Chess.newGame()"><img src="${ICON_PATH}/forward.png" style="width:16px;height:16px" alt=""> New Game</button>`,
            statusbar: '<span id="ch-status">White to move</span>',
            content: `
                <style>
                    .ch-wrap{display:flex;justify-content:center;padding:8px;height:100%}
                    .ch-board{display:grid;grid-template-columns:repeat(8,48px);grid-template-rows:repeat(8,48px);border:2px solid #333}
                    .ch-cell{width:48px;height:48px;display:flex;align-items:center;justify-content:center;font-size:32px;cursor:pointer;user-select:none}
                    .ch-cell.light{background:#f0d9b5}
                    .ch-cell.dark{background:#b58863}
                    .ch-cell.selected{background:#7fc97f!important}
                    .ch-cell.valid{background:radial-gradient(circle,rgba(0,0,0,0.2) 20%,transparent 20%),var(--bg)}
                    .ch-cell.last-move{background:#cdd26a!important}
                </style>
                <div class="ch-wrap"><div class="ch-board" id="ch-board"></div></div>
            `,
            onReady: () => this.newGame(),
        });
    },

    newGame() {
        this._turn = 'w'; this._selected = null; this._gameOver = false; this._history = [];
        this._board = [
            ['bR','bN','bB','bQ','bK','bB','bN','bR'],
            ['bP','bP','bP','bP','bP','bP','bP','bP'],
            ['','','','','','','',''],['','','','','','','',''],
            ['','','','','','','',''],['','','','','','','',''],
            ['wP','wP','wP','wP','wP','wP','wP','wP'],
            ['wR','wN','wB','wQ','wK','wB','wN','wR'],
        ];
        this._render();
        document.getElementById('ch-status').textContent = 'White to move';
    },

    _pieceUnicode: { wK:'♔',wQ:'♕',wR:'♖',wB:'♗',wN:'♘',wP:'♙',bK:'♚',bQ:'♛',bR:'♜',bB:'♝',bN:'♞',bP:'♟' },

    _render() {
        const board = document.getElementById('ch-board');
        if (!board) return;
        let html = '';
        for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
            const isLight = (r + c) % 2 === 0;
            const piece = this._board[r][c];
            const sel = this._selected && this._selected[0] === r && this._selected[1] === c;
            const valid = this._selected && this._getValidMoves(this._selected[0], this._selected[1]).some(m => m[0] === r && m[1] === c);
            html += `<div class="ch-cell ${isLight ? 'light' : 'dark'} ${sel ? 'selected' : ''}" style="${valid ? '--bg:' + (isLight ? '#f0d9b5' : '#b58863') + ';background:radial-gradient(circle,rgba(0,0,0,0.2) 25%,transparent 25%) ' + (isLight ? '#f0d9b5' : '#b58863') : ''}" onclick="Apps.Chess._onClick(${r},${c})">${piece ? this._pieceUnicode[piece] : ''}</div>`;
        }
        board.innerHTML = html;
    },

    _onClick(r, c) {
        if (this._gameOver) return;
        if (this._turn !== 'w') return; // Player is white

        const piece = this._board[r][c];
        if (this._selected) {
            const [sr, sc] = this._selected;
            const moves = this._getValidMoves(sr, sc);
            if (moves.some(m => m[0] === r && m[1] === c)) {
                this._makeMove(sr, sc, r, c);
                this._selected = null;
                this._render();
                if (this._isCheckmate('b')) { document.getElementById('ch-status').textContent = 'Checkmate! White wins!'; this._gameOver = true; return; }
                this._turn = 'b';
                document.getElementById('ch-status').textContent = 'Black thinking...';
                setTimeout(() => this._aiMove(), 300);
                return;
            }
            this._selected = null;
        }
        if (piece && piece[0] === 'w') this._selected = [r, c];
        else this._selected = null;
        this._render();
    },

    _makeMove(r1, c1, r2, c2) {
        const captured = this._board[r2][c2];
        this._board[r2][c2] = this._board[r1][c1];
        this._board[r1][c1] = '';
        // Pawn promotion
        if (this._board[r2][c2] === 'wP' && r2 === 0) this._board[r2][c2] = 'wQ';
        if (this._board[r2][c2] === 'bP' && r2 === 7) this._board[r2][c2] = 'bQ';
    },

    _getValidMoves(r, c) {
        const piece = this._board[r][c];
        if (!piece) return [];
        const color = piece[0], type = piece[1];
        const moves = [];
        const add = (nr, nc) => { if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) { const t = this._board[nr][nc]; if (!t || t[0] !== color) moves.push([nr, nc]); return !t; } return false; };

        if (type === 'P') {
            const dir = color === 'w' ? -1 : 1;
            const start = color === 'w' ? 6 : 1;
            if (!this._board[r + dir]?.[c]) { moves.push([r + dir, c]); if (r === start && !this._board[r + dir * 2]?.[c]) moves.push([r + dir * 2, c]); }
            [-1, 1].forEach(dc => { const t = this._board[r + dir]?.[c + dc]; if (t && t[0] !== color) moves.push([r + dir, c + dc]); });
        } else if (type === 'N') {
            [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr, dc]) => add(r + dr, c + dc));
        } else if (type === 'B' || type === 'Q') {
            [[-1,-1],[-1,1],[1,-1],[1,1]].forEach(([dr, dc]) => { for (let i = 1; i < 8; i++) if (!add(r + dr * i, c + dc * i)) break; });
        }
        if (type === 'R' || type === 'Q') {
            [[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr, dc]) => { for (let i = 1; i < 8; i++) if (!add(r + dr * i, c + dc * i)) break; });
        }
        if (type === 'K') {
            [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].forEach(([dr, dc]) => add(r + dr, c + dc));
        }
        return moves;
    },

    _aiMove() {
        // Simple AI: try captures first, then random moves, prefer center
        let allMoves = [];
        for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
            if (this._board[r][c] && this._board[r][c][0] === 'b') {
                this._getValidMoves(r, c).forEach(([tr, tc]) => {
                    const captured = this._board[tr][tc];
                    const score = captured ? { P: 1, N: 3, B: 3, R: 5, Q: 9, K: 100 }[captured[1]] || 0 : 0;
                    const center = 4 - Math.abs(3.5 - tr) - Math.abs(3.5 - tc);
                    allMoves.push({ fr: r, fc: c, tr, tc, score: score * 10 + center + Math.random() * 2 });
                });
            }
        }
        if (allMoves.length === 0) {
            document.getElementById('ch-status').textContent = 'Stalemate!';
            this._gameOver = true; return;
        }
        allMoves.sort((a, b) => b.score - a.score);
        const best = allMoves[0];
        this._makeMove(best.fr, best.fc, best.tr, best.tc);

        if (this._isCheckmate('w')) { document.getElementById('ch-status').textContent = 'Checkmate! Black wins!'; this._gameOver = true; this._render(); return; }
        this._turn = 'w';
        document.getElementById('ch-status').textContent = 'White to move';
        this._render();
    },

    _isCheckmate(color) {
        for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
            if (this._board[r][c] && this._board[r][c][0] === color && this._getValidMoves(r, c).length > 0) return false;
        }
        return true;
    },
};
