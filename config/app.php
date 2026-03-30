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
        'workspace'    => ['name' => 'Workspace',      'icon' => 'my-documents.png'],
        'productivity' => ['name' => 'Productivity',    'icon' => 'briefcase.png'],
        'utilities'    => ['name' => 'Utilities',       'icon' => 'administrative-tools.png'],
        'media'        => ['name' => 'Media & Games',   'icon' => 'my-music.png'],
    ],

    // Modules (order = Start Menu order)
    'modules' => [
        // ── Workspace ──
        'dashboard'  => ['name' => 'Dashboard',        'icon' => 'my-documents.png',      'enabled' => true,  'category' => 'workspace'],
        'projects'   => ['name' => 'Project Manager',  'icon' => 'briefcase.png',          'enabled' => true,  'category' => 'workspace'],
        'tasks'      => ['name' => 'Task Board',       'icon' => 'checklist.png',          'enabled' => true,  'category' => 'workspace'],
        'wiki'       => ['name' => 'Knowledge Base',   'icon' => 'help-and-support.png',   'enabled' => true,  'category' => 'workspace'],
        'files'      => ['name' => 'File Manager',     'icon' => 'my-computer.png',        'enabled' => true,  'category' => 'workspace'],
        'notes'      => ['name' => 'Quick Notes',      'icon' => 'stickynotes.png',        'enabled' => true,  'category' => 'workspace'],
        'todolist'   => ['name' => 'Todo List',        'icon' => 'to-do-list.png',         'enabled' => true,  'category' => 'workspace'],
        // ── Productivity ──
        'notepad'    => ['name' => 'Notepad',          'icon' => 'notepad.png',            'enabled' => true,  'category' => 'productivity'],
        'codeplay'   => ['name' => 'Code Playground',  'icon' => 'code-playground.png',    'enabled' => true,  'category' => 'productivity'],
        'vscoder'    => ['name' => 'VSCoder',          'icon' => 'vscode.png',             'enabled' => true,  'category' => 'productivity'],
        'filegen'    => ['name' => 'File Generator',   'icon' => 'file-generator.png',     'enabled' => true,  'category' => 'productivity'],
        'csvviewer'  => ['name' => 'Data Viewer',      'icon' => 'detail-view.png',        'enabled' => true,  'category' => 'productivity'],
        'pdfflipbook'=> ['name' => 'PDF Flipbook',     'icon' => 'flipbook.png',           'enabled' => true,  'category' => 'productivity'],
        'dummygen'   => ['name' => 'Dummy Generator',  'icon' => 'dummygator.svg',         'enabled' => true,  'category' => 'productivity'],
        // ── Utilities ──
        'calculator' => ['name' => 'Calculator',       'icon' => 'calculator.png',         'enabled' => true,  'category' => 'utilities'],
        'hashgen'    => ['name' => 'Hash Generator',   'icon' => 'hash-generator.png',     'enabled' => true,  'category' => 'utilities'],
        'weather'    => ['name' => 'Weather',          'icon' => 'weather.png',            'enabled' => true,  'category' => 'utilities'],
        'currency'   => ['name' => 'Currency Converter','icon' => 'currency-converter.png','enabled' => true,  'category' => 'utilities'],
        'translator' => ['name' => 'Translator',       'icon' => 'translator.png',         'enabled' => true,  'category' => 'utilities'],
        'imagetools' => ['name' => 'Image Tools',      'icon' => 'images-tool.png',        'enabled' => true,  'category' => 'utilities'],
        // ── Media & Games ──
        'tvplayer'   => ['name' => 'TV Player',        'icon' => 'tv.png',                 'enabled' => true,  'category' => 'media'],
        'radio'      => ['name' => 'Radio',            'icon' => 'radio.png',              'enabled' => true,  'category' => 'media'],
        'piano'      => ['name' => 'Piano',            'icon' => 'piano.png',              'enabled' => true,  'category' => 'media'],
        'tetris'     => ['name' => 'Tetris',           'icon' => 'tetris.png',             'enabled' => true,  'category' => 'media'],
        // ── Productivity (extra) ──
        'invoice'    => ['name' => 'Invoice Sorter',   'icon' => 'invoice.png',            'enabled' => true,  'category' => 'productivity'],
        // ── Islamic ──
        'quran'      => ['name' => 'Quran',            'icon' => 'quran.png',              'enabled' => true,  'category' => 'workspace'],
        // ── Planned ──
        'calendar'   => ['name' => 'Calendar',         'icon' => 'date-and-time.png',      'enabled' => false, 'category' => 'utilities'],
        'contacts'   => ['name' => 'Contacts',         'icon' => 'address-book.png',       'enabled' => false, 'category' => 'workspace'],
    ],
];
