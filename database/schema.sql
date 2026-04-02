-- ═══════════════════════════════════════════════════════════
-- XP Workspace Database Schema (MySQL)
-- Project Management + Knowledge Base
-- ═══════════════════════════════════════════════════════════

-- ── User Preferences ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS preferences (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    `key`       VARCHAR(100) UNIQUE NOT NULL,
    value       TEXT,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO preferences (`key`, value) VALUES
    ('theme', 'luna-blue'),
    ('sounds', '1'),
    ('wallpaper', 'bliss.png'),
    ('username', 'User'),
    ('desktop_icons', '["dashboard","projects","tasks","wiki","files","notes","todolist","quran"]');

-- ── Projects ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    description TEXT DEFAULT (''),
    color       VARCHAR(20) DEFAULT '#3B79E7',
    icon        VARCHAR(50) DEFAULT 'folder',
    status      ENUM('active','archived','completed') DEFAULT 'active',
    sort_order  INT DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Task Columns (Kanban Lanes) ────────────────────────────
CREATE TABLE IF NOT EXISTS task_columns (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    project_id  INT NOT NULL,
    name        VARCHAR(100) NOT NULL,
    color       VARCHAR(20) DEFAULT '#E0E0E0',
    sort_order  INT DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Tasks ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    project_id  INT NOT NULL,
    column_id   INT DEFAULT NULL,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    priority    ENUM('low','medium','high','critical') DEFAULT 'medium',
    status      ENUM('open','in_progress','review','done','cancelled') DEFAULT 'open',
    due_date    DATE DEFAULT NULL,
    tags        JSON DEFAULT NULL,
    assignee    VARCHAR(100) DEFAULT '',
    sort_order  INT DEFAULT 0,
    completed_at DATETIME DEFAULT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (column_id) REFERENCES task_columns(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Task Comments ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS task_comments (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    task_id     INT NOT NULL,
    content     TEXT NOT NULL,
    author      VARCHAR(100) DEFAULT 'User',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Task Checklists ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS task_checklists (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    task_id     INT NOT NULL,
    text        VARCHAR(500) NOT NULL,
    is_done     TINYINT(1) DEFAULT 0,
    sort_order  INT DEFAULT 0,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Wiki Pages (Knowledge Base) ────────────────────────────
CREATE TABLE IF NOT EXISTS wiki_pages (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    parent_id   INT DEFAULT NULL,
    title       VARCHAR(255) NOT NULL,
    slug        VARCHAR(255) UNIQUE,
    content     LONGTEXT,
    icon        VARCHAR(20) DEFAULT '📄',
    is_pinned   TINYINT(1) DEFAULT 0,
    sort_order  INT DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES wiki_pages(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Wiki Tags ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wiki_tags (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) UNIQUE NOT NULL,
    color       VARCHAR(20) DEFAULT '#3B79E7'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS wiki_page_tags (
    page_id     INT NOT NULL,
    tag_id      INT NOT NULL,
    PRIMARY KEY (page_id, tag_id),
    FOREIGN KEY (page_id) REFERENCES wiki_pages(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES wiki_tags(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Files ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS files (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    path        VARCHAR(500) NOT NULL,
    mime_type   VARCHAR(100) DEFAULT '',
    size        BIGINT DEFAULT 0,
    folder      VARCHAR(255) DEFAULT '/',
    linked_type VARCHAR(50) DEFAULT NULL,
    linked_id   INT DEFAULT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Quick Notes (Sticky Notes) ─────────────────────────────
CREATE TABLE IF NOT EXISTS notes (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    content     TEXT,
    color       VARCHAR(20) DEFAULT '#FFF7AD',
    pos_x       INT DEFAULT 100,
    pos_y       INT DEFAULT 100,
    width       INT DEFAULT 250,
    height      INT DEFAULT 200,
    is_pinned   TINYINT(1) DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Todos (Simple Todo List) ───────────────────────────
CREATE TABLE IF NOT EXISTS todos (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    text        VARCHAR(500) NOT NULL,
    is_done     TINYINT(1) DEFAULT 0,
    sort_order  INT DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── API Keys ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS api_keys (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    app         VARCHAR(50) NOT NULL,
    provider    VARCHAR(50) NOT NULL,
    api_key     VARCHAR(500) NOT NULL,
    extra       JSON DEFAULT NULL,
    is_active   TINYINT(1) DEFAULT 1,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_app_provider (app, provider)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── TV Channels ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tv_channels (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    url         VARCHAR(500) NOT NULL,
    logo        VARCHAR(255) DEFAULT '',
    group_name  VARCHAR(100) DEFAULT '',
    is_active   TINYINT(1) DEFAULT 1,
    sort_order  INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Radio Stations ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS radio_stations (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    url         VARCHAR(500) NOT NULL,
    country     VARCHAR(100) DEFAULT 'Indonesia',
    category    VARCHAR(50) DEFAULT 'local',
    is_active   TINYINT(1) DEFAULT 1,
    sort_order  INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Activity Log ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_log (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    type        VARCHAR(50) NOT NULL,
    action      VARCHAR(50) NOT NULL,
    entity_id   INT DEFAULT NULL,
    entity_name VARCHAR(255) DEFAULT '',
    details     JSON DEFAULT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Indexes ────────────────────────────────────────────────
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_column ON tasks(column_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_wiki_parent ON wiki_pages(parent_id);
CREATE INDEX idx_wiki_slug ON wiki_pages(slug);
CREATE INDEX idx_files_folder ON files(folder);
CREATE INDEX idx_files_linked ON files(linked_type, linked_id);
CREATE INDEX idx_activity_type ON activity_log(type, created_at);

-- ── Seed Data: Default Project ─────────────────────────────
INSERT IGNORE INTO projects (id, name, description, color) VALUES
    (1, 'Getting Started', 'Your first project — explore XP Workspace!', '#3B79E7');

INSERT IGNORE INTO task_columns (id, project_id, name, color, sort_order) VALUES
    (1, 1, 'To Do',        '#E8E8E8', 0),
    (2, 1, 'In Progress',  '#BDE0FE', 1),
    (3, 1, 'Review',       '#FFF3BF', 2),
    (4, 1, 'Done',         '#D4EDDA', 3);

INSERT IGNORE INTO tasks (project_id, column_id, title, description, priority, sort_order) VALUES
    (1, 1, 'Explore the Desktop',     'Click around! Try the Start Menu, open apps, drag windows.', 'low', 0),
    (1, 1, 'Create your first Wiki page', 'Open Knowledge Base and write something useful.', 'medium', 1),
    (1, 2, 'Customize your theme',    'Try different XP themes from the Start Menu > Settings.', 'low', 0),
    (1, 4, 'Welcome to XP Workspace', 'You did it! This task is already done.', 'low', 0);

INSERT IGNORE INTO wiki_pages (id, title, slug, content, icon) VALUES
    (1, 'Welcome', 'welcome', '# Welcome to XP Workspace\r\n\r\nYour personal **Knowledge Base**, **Project Manager**, and **Productivity Suite** wrapped in Windows XP nostalgia.\r\n\r\n## Getting Started\r\n\r\n- Use the **Start Menu** to launch different apps\r\n- **Drag windows** around the desktop\r\n- **Right-click** desktop to add widgets or open apps\r\n- Everything saves automatically\r\n\r\n## Categories\r\n\r\n- **Workspace** - Dashboard, Projects, Tasks, Wiki, Files, Notes, Todo, Pomodoro, Kanban, Habits, Bookmarks\r\n- **Office** - Notepad, Data Viewer, PDF Flipbook, Invoice, Spreadsheet, Word Processor\r\n- **Graphic** - Paint, Image Editor, SVG Editor, Pixel Art, Wireframe Builder, Color Picker\r\n- **Development** - VSCoder, Code Playground, JSON Formatter, Regex Tester, API Tester, Diff Viewer, and more\r\n- **Utilities** - Calculator, Weather, Currency, Translator, Stopwatch\r\n- **Entertainment** - Music/Video Player, TV, Radio, Piano, Tetris, Chess, Flappy Bird, and more\r\n- **Islamic** - Quran, Hijri Calendar, Dzikir Counter, Qibla Compass\r\n- **System** - System Info, Startup Manager, Storage, Activity Log, Backup/Restore\r\n\r\n## Desktop Features\r\n\r\n- **Widgets** - Right-click desktop to add Clock, Weather, Calendar, Network Speed, System Monitor\r\n- **System Tray** - Volume, Network, Battery status\r\n- **Themes** - Luna Blue, Silver, Olive, Classic\r\n\r\nHappy organizing!', '🏠');

-- ═══════════════════════════════════════════════════════════
-- Seed Media Data (TV Channels & Radio Stations)
-- ═══════════════════════════════════════════════════════════

INSERT IGNORE INTO tv_channels (name, url, logo, group_name, sort_order) VALUES
('TVRI Nasional', 'https://ott-balancer.tvri.go.id/live/eds/Nasional/hls/Nasional.m3u8', 'logo_tv_tvri_nasional.png', 'TVRI', 1),
('TVRI Sport', 'https://ott-balancer.tvri.go.id/live/eds/SportHD/hls/SportHD.m3u8', 'logo_tv_tvri_sport.png', 'TVRI', 2),
('TVRI World', 'https://ott-balancer.tvri.go.id/live/eds/TVRIWorld/hls/TVRIWorld.m3u8', 'logo_tv_tvri_world.png', 'TVRI', 3),
('TransTV', 'https://video.detik.com/transtv/smil:transtv.smil/playlist.m3u8', 'logo_tv_transtv.png', '', 10),
('Trans7', 'https://video.detik.com/trans7/smil:trans7.smil/playlist.m3u8', 'logo_tv_trans7.png', '', 11),
('CNN Indonesia', 'https://live.cnnindonesia.com/livecnn/smil:cnntv.smil/playlist.m3u8', 'logo_tv_cnn.png', '', 12),
('CNBC Indonesia', 'https://live.cnbcindonesia.com/livecnbc/smil:cnbctv.smil/playlist.m3u8', 'logo_tv_cnbc.png', '', 13);

INSERT IGNORE INTO radio_stations (name, url, country, category) VALUES
('Ardan Radio','https://n13.rcs.revma.com/ugpyzu9n5k3vv','Indonesia','local'),
('Delta FM','https://s1.cloudmu.id/listen/delta_fm/stream','Indonesia','local'),
('Elshinta','https://stream-ssl.arenastreaming.com:8000/jakarta','Indonesia','local'),
('Gen FM 98.7 Jakarta','https://wz.mari.co.id:1936/web_genfm/genfm/playlist.m3u8','Indonesia','local'),
('Hard Rock','https://n08.radiojar.com/7csmg90fuqruv.mp3','Indonesia','local'),
('Prambors FM','https://s2.cloudmu.id/listen/prambors/stream','Indonesia','local'),
('RRI Pro 1 Jakarta','https://stream-node1.rri.co.id/streaming/25/9025/rrijakartapro1.mp3','Indonesia','local'),
('BBC Radio 1','http://stream.live.vc.bbcmedia.co.uk/bbc_radio_one','United Kingdom','international'),
('NPR News','https://npr-ice.streamguys1.com/live.mp3','United States','international');
