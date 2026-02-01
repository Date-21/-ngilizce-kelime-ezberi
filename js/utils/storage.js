// VocabMaster Pro - Local Storage Utilities

const Storage = {
    // Get item with optional default value
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            if (item === null) return defaultValue;
            return JSON.parse(item);
        } catch {
            return defaultValue;
        }
    },

    // Set item
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch {
            console.error('Failed to save to localStorage');
            return false;
        }
    },

    // Remove item
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch {
            return false;
        }
    },

    // Clear all app-related items
    clear() {
        Object.values(CONFIG.STORAGE_KEYS).forEach(key => {
            this.remove(key);
        });
    },

    // Theme
    getTheme() {
        const saved = this.get(CONFIG.STORAGE_KEYS.THEME);
        if (saved) return saved;

        // Check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    },

    setTheme(theme) {
        this.set(CONFIG.STORAGE_KEYS.THEME, theme);
        document.documentElement.setAttribute('data-theme', theme);

        // Update meta theme-color
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) {
            metaTheme.setAttribute('content', theme === 'dark' ? '#1A1A1A' : '#F5F5DC');
        }
    },

    // Card size
    getCardSize() {
        return this.get(CONFIG.STORAGE_KEYS.CARD_SIZE, 'normal');
    },

    setCardSize(size) {
        this.set(CONFIG.STORAGE_KEYS.CARD_SIZE, size);
        document.documentElement.setAttribute('data-card-size', size);
    },

    // Sound effects
    getSoundEnabled() {
        return this.get(CONFIG.STORAGE_KEYS.SOUND_EFFECTS, true);
    },

    setSoundEnabled(enabled) {
        this.set(CONFIG.STORAGE_KEYS.SOUND_EFFECTS, enabled);
    },

    // Study time tracking
    startStudySession() {
        this.set(CONFIG.STORAGE_KEYS.STUDY_START_TIME, Date.now());
    },

    getStudyDuration() {
        const startTime = this.get(CONFIG.STORAGE_KEYS.STUDY_START_TIME);
        if (!startTime) return 0;
        return Math.floor((Date.now() - startTime) / 60000); // Return minutes
    },

    endStudySession() {
        const duration = this.getStudyDuration();
        this.remove(CONFIG.STORAGE_KEYS.STUDY_START_TIME);
        return duration;
    },

    // Session ID for single device policy
    getSessionId() {
        return this.get(CONFIG.STORAGE_KEYS.SESSION_ID);
    },

    setSessionId(id) {
        this.set(CONFIG.STORAGE_KEYS.SESSION_ID, id);
    }
};

// Initialize theme and card size on load
document.addEventListener('DOMContentLoaded', () => {
    const theme = Storage.getTheme();
    document.documentElement.setAttribute('data-theme', theme);

    const cardSize = Storage.getCardSize();
    document.documentElement.setAttribute('data-card-size', cardSize);
});

// Listen for system theme changes
if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        const savedTheme = Storage.get(CONFIG.STORAGE_KEYS.THEME);
        if (!savedTheme || savedTheme === 'system') {
            Storage.setTheme(e.matches ? 'dark' : 'light');
        }
    });
}

// Make globally available
window.Storage = Storage;
