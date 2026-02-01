// VocabMaster Pro - Configuration

const CONFIG = {
    // Supabase Configuration
    SUPABASE_URL: 'https://qcirfsxvdotvylvsphpj.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjaXJmc3h2ZG90dnlsdnNwaHBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MDIxMjgsImV4cCI6MjA4NTE3ODEyOH0.EtvN0mEvA9-Rcu11PuqcsGuPtikUi60jD5Cu4wIUzj4',

    // App Settings
    APP_NAME: 'VocabMaster Pro',
    APP_VERSION: '1.0.0',

    // Flashcard Settings
    WORDS_PER_LEVEL: 50,
    CARD_FLIP_DURATION: 400,
    SWIPE_THRESHOLD: 100,

    // Test Settings
    TEST_QUESTION_TIME: 15, // seconds
    COMPETITION_QUESTION_TIME: 15, // seconds

    // Points System
    POINTS: {
        WORD_LEARNED: 10,
        TEST_CORRECT: 10,
        TEST_INCORRECT: -5,
        TRANSLATION_EASY: 10,
        TRANSLATION_MEDIUM: 15,
        TRANSLATION_HARD: 20,
        COMPETITION_1ST: 10,
        COMPETITION_2ND: 8,
        COMPETITION_3RD: 6,
        COMPETITION_4TH: 4,
        COMPETITION_OTHER: 2
    },

    // Spaced Repetition Intervals (days)
    SPACED_REPETITION: [1, 3, 7, 14, 30, 60],

    // Session Settings
    IDLE_TIMEOUT: 5 * 60 * 1000, // 5 minutes in ms
    ROOM_TIMEOUT: 60 * 1000, // 1 minute in ms
    ROOM_TIMEOUT_WARNING: 10 * 1000, // 10 seconds in ms

    // Validation
    USERNAME_MIN: 3,
    USERNAME_MAX: 20,
    PASSWORD_MIN: 8,
    USERNAME_CHANGE_DAYS: 30,

    // File Upload
    MAX_IMAGE_SIZE: 2 * 1024 * 1024, // 2MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png'],

    // Room Settings
    MIN_PARTICIPANTS: 2,
    MAX_PARTICIPANTS: 10,
    ROOM_CODE_LENGTH: 5,

    // Leaderboard
    LEADERBOARD_LIMIT: 10,

    // Forum
    COMMENTS_PER_PAGE: 20,

    // Toast Settings
    TOAST_DURATION: 4000, // ms

    // Local Storage Keys
    STORAGE_KEYS: {
        THEME: 'vocabmaster_theme',
        CARD_SIZE: 'vocabmaster_card_size',
        SOUND_EFFECTS: 'vocabmaster_sound',
        SESSION_ID: 'vocabmaster_session',
        STUDY_START_TIME: 'vocabmaster_study_start'
    },

    // Routes
    ROUTES: {
        HOME: 'home',
        FLASHCARDS: 'flashcards',
        STUDY: 'study',
        COMPETITION: 'competition',
        REPORTS: 'reports',
        FORUM: 'forum',
        PROFILE: 'profile',
        ADMIN: 'admin',
        AUTH: 'auth'
    },

    // Badges
    BADGES: {
        // Word Badges
        BEGINNER: { id: 'beginner', name: 'Caylak', icon: '🌱', condition: 'words', value: 1 },
        STUDENT: { id: 'student', name: 'Ogrenci', icon: '📚', condition: 'words', value: 100 },
        EXPERT: { id: 'expert', name: 'Uzman', icon: '🎓', condition: 'words', value: 500 },
        MASTER: { id: 'master', name: 'Ustat', icon: '🏆', condition: 'words', value: 1000 },

        // Streak Badges
        WARMING_UP: { id: 'warming_up', name: 'Isindim', icon: '🔥', condition: 'streak', value: 3 },
        ON_FIRE: { id: 'on_fire', name: 'Yaniyorum', icon: '🔥🔥', condition: 'streak', value: 7 },
        BLAZING: { id: 'blazing', name: 'Alev Alev', icon: '🔥🔥🔥', condition: 'streak', value: 30 },
        SUN: { id: 'sun', name: 'Gunes', icon: '☀️', condition: 'streak', value: 100 },

        // Test Badges
        ACCURATE: { id: 'accurate', name: 'Dogrucu', icon: '✅', condition: 'perfect_test', value: 1 },
        SHARPSHOOTER: { id: 'sharpshooter', name: 'Keskin Nisanci', icon: '🎯', condition: 'correct_streak', value: 10 },
        PERFECTIONIST: { id: 'perfectionist', name: 'Mukemmelci', icon: '💯', condition: 'perfect_tests', value: 10 },

        // Competition Badges
        PARTICIPANT: { id: 'participant', name: 'Katilimci', icon: '🤝', condition: 'competitions', value: 1 },
        CHAMPION: { id: 'champion', name: 'Sampiyon', icon: '🥇', condition: 'competition_wins', value: 1 },
        KING: { id: 'king', name: 'Kral', icon: '👑', condition: 'competition_wins', value: 10 }
    }
};

// Freeze config to prevent accidental modifications
Object.freeze(CONFIG);
Object.freeze(CONFIG.POINTS);
Object.freeze(CONFIG.SPACED_REPETITION);
Object.freeze(CONFIG.STORAGE_KEYS);
Object.freeze(CONFIG.ROUTES);
Object.freeze(CONFIG.BADGES);
