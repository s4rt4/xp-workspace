<?php

return [
    'name'     => 'XP Workspace',
    'version'  => '1.0.0',
    'debug'    => true,
    'timezone' => 'Asia/Jakarta',
    'base_url' => '/', // Change if in subdirectory, e.g. '/xp-workspace/'

    // Default theme: 'luna-blue', 'luna-silver', 'luna-olive', 'classic'
    'default_theme' => 'luna-blue',

    // Default wallpaper
    'wallpaper' => 'bliss.png',

    // Enable XP sounds
    'sounds_enabled' => true,

    // App categories for Start Menu
    'categories' => [
        'workspace'     => ['name' => 'Workspace',      'icon' => 'my-documents.png'],
        'office'        => ['name' => 'Office',          'icon' => 'briefcase.png'],
        'graphic'       => ['name' => 'Graphic',         'icon' => 'paint.png'],
        'development'   => ['name' => 'Development',     'icon' => 'code-playground.png'],
        'utilities'     => ['name' => 'Utilities',       'icon' => 'administrative-tools.png'],
        'entertainment' => ['name' => 'Entertainment',   'icon' => 'my-music.png'],
        'islamic'       => ['name' => 'Islamic',         'icon' => 'quran.png'],
        'system'        => ['name' => 'System',          'icon' => 'administrative-tools.png'],
    ],

    // Modules (order = Start Menu order)
    'modules' => [

        // ── Workspace ──
        'dashboard'   => ['name' => 'Dashboard',         'icon' => 'my-documents.png',        'enabled' => true,  'category' => 'workspace'],
        'projects'    => ['name' => 'Project Manager',    'icon' => 'briefcase.png',           'enabled' => true,  'category' => 'workspace'],
        'tasks'       => ['name' => 'Task Board',         'icon' => 'checklist.png',           'enabled' => true,  'category' => 'workspace'],
        'wiki'        => ['name' => 'Knowledge Base',     'icon' => 'help-and-support.png',    'enabled' => true,  'category' => 'workspace'],
        'files'       => ['name' => 'File Manager',       'icon' => 'my-computer.png',         'enabled' => true,  'category' => 'workspace'],
        'notes'       => ['name' => 'Quick Notes',        'icon' => 'stickynotes.png',         'enabled' => true,  'category' => 'workspace'],
        'todolist'    => ['name' => 'Todo List',          'icon' => 'to-do-list.png',          'enabled' => true,  'category' => 'workspace'],
        'pomodoro'    => ['name' => 'Pomodoro Timer',     'icon' => 'scheduled-tasks.png',     'enabled' => true,  'category' => 'workspace'],
        'contacts'    => ['name' => 'Contacts',           'icon' => 'address-book.png',        'enabled' => false, 'category' => 'workspace'],

        // ── Office ──
        'notepad'     => ['name' => 'Notepad',            'icon' => 'notepad.png',             'enabled' => true,  'category' => 'office'],
        'csvviewer'   => ['name' => 'Data Viewer',        'icon' => 'detail-view.png',         'enabled' => true,  'category' => 'office'],
        'pdfflipbook' => ['name' => 'PDF Flipbook',       'icon' => 'flipbook.png',            'enabled' => true,  'category' => 'office'],
        'invoice'     => ['name' => 'Invoice Sorter',     'icon' => 'invoice.png',             'enabled' => true,  'category' => 'office'],

        // ── Graphic ──
        'paint'       => ['name' => 'Paint',              'icon' => 'paint.png',               'enabled' => true,  'category' => 'graphic'],
        'imageeditor' => ['name' => 'Image Editor',       'icon' => 'paint.png',               'enabled' => true,  'category' => 'graphic'],
        'imagetools'  => ['name' => 'Image Tools',        'icon' => 'images-tool.png',         'enabled' => true,  'category' => 'graphic'],
        'svgeditor'   => ['name' => 'SVG Editor',         'icon' => 'paint.png',               'enabled' => true,  'category' => 'graphic'],
        'pixelart'    => ['name' => 'Pixel Art Editor',   'icon' => 'bitmap.png',              'enabled' => true,  'category' => 'graphic'],
        'wireframe'   => ['name' => 'Wireframe Builder',  'icon' => 'display-properties.png',  'enabled' => true,  'category' => 'graphic'],
        'colorpicker' => ['name' => 'Color Picker',       'icon' => 'color-profile.png',       'enabled' => true,  'category' => 'graphic'],

        // ── Development ──
        'vscoder'     => ['name' => 'VSCoder',            'icon' => 'vscode.png',              'enabled' => true,  'category' => 'development'],
        'codeplay'    => ['name' => 'Code Playground',    'icon' => 'code-playground.png',     'enabled' => true,  'category' => 'development'],
        'jsonformat'  => ['name' => 'JSON Formatter',     'icon' => 'java-script.png',         'enabled' => true,  'category' => 'development'],
        'regextester' => ['name' => 'Regex Tester',       'icon' => 'graph-view.png',          'enabled' => true,  'category' => 'development'],
        'base64tool'  => ['name' => 'Base64 Encoder',     'icon' => 'key.png',                 'enabled' => true,  'category' => 'development'],
        'diffviewer'  => ['name' => 'Diff Viewer',        'icon' => 'detail-view.png',         'enabled' => true,  'category' => 'development'],
        'timestamp'   => ['name' => 'Unix Timestamp',     'icon' => 'date-and-time.png',       'enabled' => true,  'category' => 'development'],
        'hashgen'     => ['name' => 'Hash Generator',     'icon' => 'hash-generator.png',      'enabled' => true,  'category' => 'development'],
        'filegen'     => ['name' => 'File Generator',     'icon' => 'file-generator.png',      'enabled' => true,  'category' => 'development'],
        'dummygen'    => ['name' => 'Dummy Generator',    'icon' => 'dummygator.svg',          'enabled' => true,  'category' => 'development'],

        // ── Utilities ──
        'calculator'  => ['name' => 'Calculator',         'icon' => 'calculator.png',          'enabled' => true,  'category' => 'utilities'],
        'weather'     => ['name' => 'Weather',            'icon' => 'weather.png',             'enabled' => true,  'category' => 'utilities'],
        'currency'    => ['name' => 'Currency Converter',  'icon' => 'currency-converter.png', 'enabled' => true,  'category' => 'utilities'],
        'translator'  => ['name' => 'Translator',         'icon' => 'translator.png',          'enabled' => true,  'category' => 'utilities'],
        'calendar'    => ['name' => 'Calendar',           'icon' => 'date-and-time.png',       'enabled' => false, 'category' => 'utilities'],

        // ── Entertainment ──
        'tvplayer'    => ['name' => 'TV Player',          'icon' => 'tv.png',                  'enabled' => true,  'category' => 'entertainment'],
        'radio'       => ['name' => 'Radio',              'icon' => 'radio.png',               'enabled' => true,  'category' => 'entertainment'],
        'musicplayer' => ['name' => 'Music Player',       'icon' => 'windows-media-player-9.png', 'enabled' => true, 'category' => 'entertainment'],
        'videoplayer' => ['name' => 'Video Player',       'icon' => 'windows-movie-maker.png', 'enabled' => true,  'category' => 'entertainment'],
        'piano'       => ['name' => 'Piano',              'icon' => 'piano.png',               'enabled' => true,  'category' => 'entertainment'],
        'tetris'      => ['name' => 'Tetris',             'icon' => 'tetris.png',              'enabled' => true,  'category' => 'entertainment'],
        'minesweeper' => ['name' => 'Minesweeper',        'icon' => 'minesweeper.png',         'enabled' => true,  'category' => 'entertainment'],
        'snake'       => ['name' => 'Snake',              'icon' => 'snake.png',               'enabled' => true,  'category' => 'entertainment'],
        'game2048'    => ['name' => '2048',               'icon' => '2048.png',                'enabled' => true,  'category' => 'entertainment'],
        'tictactoe'   => ['name' => 'Tic Tac Toe',       'icon' => 'tictactoe.png',           'enabled' => true,  'category' => 'entertainment'],
        'memorycard'  => ['name' => 'Memory Card',        'icon' => 'memorycard.png',          'enabled' => true,  'category' => 'entertainment'],
        'solitaire'   => ['name' => 'Solitaire',         'icon' => 'solitaire.png',           'enabled' => true,  'category' => 'entertainment'],
        'breakout'    => ['name' => 'Breakout',           'icon' => 'breakout.png',            'enabled' => true,  'category' => 'entertainment'],
        'sudoku'      => ['name' => 'Sudoku',             'icon' => 'sudoku.png',              'enabled' => true,  'category' => 'entertainment'],
        'wordle'      => ['name' => 'Wordle',             'icon' => 'wordle.png',              'enabled' => true,  'category' => 'entertainment'],
        'pong'        => ['name' => 'Pong',               'icon' => 'pong.png',                'enabled' => true,  'category' => 'entertainment'],

        // ── Islamic ──
        'quran'       => ['name' => 'Quran',              'icon' => 'quran.png',               'enabled' => true,  'category' => 'islamic'],

        // ── System ──
        'display'     => ['name' => 'Display',            'icon' => 'appearance.png',          'enabled' => true,  'category' => 'system'],
        'systeminfo'  => ['name' => 'System Info',        'icon' => 'my-computer.png',         'enabled' => true,  'category' => 'system'],
        'startup'     => ['name' => 'Startup Manager',    'icon' => 'scheduled-tasks.png',     'enabled' => true,  'category' => 'system'],
        'storage'     => ['name' => 'Storage Manager',    'icon' => 'defragment.png',          'enabled' => true,  'category' => 'system'],
        'activitylog' => ['name' => 'Activity Log',       'icon' => 'event-viewer.png',        'enabled' => true,  'category' => 'system'],
        'backup'      => ['name' => 'Backup & Restore',   'icon' => 'backup.png',              'enabled' => true,  'category' => 'system'],
        'apikeys'     => ['name' => 'API Keys',           'icon' => 'key.png',                 'enabled' => true,  'category' => 'system'],
        'about'       => ['name' => 'About XP Workspace', 'icon' => 'information.png',         'enabled' => true,  'category' => 'system'],
    ],
];
