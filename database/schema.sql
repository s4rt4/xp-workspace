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
    ('desktop_icons', '["projects","tasks","wiki","files","notes"]');

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
    (1, 'Welcome', 'welcome', '# Welcome to XP Workspace\r\n\r\nYour personal **Knowledge Base** and **Project Manager** wrapped in Windows XP nostalgia.\r\n\r\n## Getting Started\r\n\r\n- Use the **Start Menu** to launch different apps\r\n- **Drag windows** around the desktop\r\n- **Right-click** for context menus\r\n- Everything saves automatically\r\n\r\n## Modules\r\n\r\n- **Project Manager** - Manage projects with Kanban boards\r\n- **Task Board** - Track tasks with priorities and statuses\r\n- **Knowledge Base** - Write and organize notes like a wiki\r\n- **File Manager** - Upload and organize files\r\n- **Quick Notes** - Sticky notes on your desktop\r\n\r\nHappy organizing!', '🏠');
