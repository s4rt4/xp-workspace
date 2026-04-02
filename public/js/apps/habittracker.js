/**
 * Habit Tracker — Track daily habits with streaks
 */
Apps.HabitTracker = {
    _habits: [],

    open() {
        if (XP.windows['habittracker']) { XP.focusWindow('habittracker'); return; }
        try { this._habits = JSON.parse(localStorage.getItem('xp_habits')) || []; } catch { this._habits = []; }

        XP.createWindow('habittracker', {
            title: 'Habit Tracker',
            icon: 'checklist.png', width: 550, height: 420,
            toolbar: `<button class="toolbar-btn" onclick="Apps.HabitTracker.addHabit()"><img src="${ICON_PATH}/add.png" style="width:16px;height:16px" alt=""> Add Habit</button>`,
            content: `
                <style>
                    .ht-wrap{padding:8px;font-size:11px;height:100%;overflow-y:auto}
                    .ht-habit{background:#fff;border:1px solid #d4d0c8;border-radius:4px;padding:8px 10px;margin-bottom:6px}
                    .ht-header{display:flex;align-items:center;gap:8px;margin-bottom:6px}
                    .ht-name{font-weight:bold;font-size:12px;color:#003c74;flex:1}
                    .ht-streak{font-size:10px;color:#f39c12;font-weight:bold}
                    .ht-del{color:#ccc;cursor:pointer}
                    .ht-del:hover{color:#c00}
                    .ht-days{display:flex;gap:3px}
                    .ht-day{width:22px;height:22px;border:1px solid #d4d0c8;border-radius:3px;display:flex;align-items:center;justify-content:center;font-size:9px;cursor:pointer;color:#888}
                    .ht-day:hover{border-color:#316ac5}
                    .ht-day.done{background:#27ae60;color:#fff;border-color:#27ae60}
                    .ht-day.today{border:2px solid #003c74}
                    .ht-empty{text-align:center;padding:40px;color:#888}
                </style>
                <div class="ht-wrap" id="ht-list"></div>
            `,
            onReady: () => this._render(),
        });
    },

    _save() { localStorage.setItem('xp_habits', JSON.stringify(this._habits)); },

    addHabit() {
        const name = prompt('Habit name:');
        if (!name) return;
        this._habits.push({ id: 'h' + Date.now(), name, completedDates: [] });
        this._save(); this._render();
    },

    deleteHabit(id) {
        if (!confirm('Delete habit?')) return;
        this._habits = this._habits.filter(h => h.id !== id);
        this._save(); this._render();
    },

    toggleDay(id, dateStr) {
        const h = this._habits.find(h => h.id === id);
        if (!h) return;
        const idx = h.completedDates.indexOf(dateStr);
        if (idx >= 0) h.completedDates.splice(idx, 1);
        else h.completedDates.push(dateStr);
        this._save(); this._render();
    },

    _getStreak(habit) {
        let streak = 0;
        const today = new Date();
        for (let i = 0; i < 365; i++) {
            const d = new Date(today); d.setDate(d.getDate() - i);
            const ds = d.toISOString().slice(0, 10);
            if (habit.completedDates.includes(ds)) streak++;
            else if (i > 0) break;
        }
        return streak;
    },

    _render() {
        const el = document.getElementById('ht-list');
        if (!el) return;
        if (this._habits.length === 0) { el.innerHTML = '<div class="ht-empty">Click "Add Habit" to start tracking</div>'; return; }

        const today = new Date();
        const days = [];
        for (let i = 13; i >= 0; i--) {
            const d = new Date(today); d.setDate(d.getDate() - i);
            days.push({ date: d, str: d.toISOString().slice(0, 10), label: d.getDate(), isToday: i === 0 });
        }

        el.innerHTML = this._habits.map(h => {
            const streak = this._getStreak(h);
            return `<div class="ht-habit">
                <div class="ht-header">
                    <span class="ht-name">${h.name}</span>
                    <span class="ht-streak">${streak > 0 ? '🔥 ' + streak + ' day streak' : ''}</span>
                    <span class="ht-del" onclick="Apps.HabitTracker.deleteHabit('${h.id}')">✕</span>
                </div>
                <div class="ht-days">
                    ${days.map(d => {
                        const done = h.completedDates.includes(d.str);
                        return `<div class="ht-day ${done ? 'done' : ''} ${d.isToday ? 'today' : ''}" onclick="Apps.HabitTracker.toggleDay('${h.id}','${d.str}')" title="${d.str}">${done ? '✓' : d.label}</div>`;
                    }).join('')}
                </div>
            </div>`;
        }).join('');
    },
};
