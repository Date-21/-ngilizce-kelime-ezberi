// VocabMaster Pro - App Initialization

const App = {
    async init() {
        try {
            // Initialize router
            Router.init();

            // Initialize auth (loads session + profile)
            await Auth.init();

            if (Auth.isLoggedIn()) {
                // User is logged in
                await this.onAuthenticated();
            } else {
                // No session, show auth page
                Router.navigate(CONFIG.ROUTES.AUTH, {}, false);
            }

            // Hide loading screen
            this.hideLoadingScreen();

            // Listen for auth state changes
            this.setupAuthListener();

            // Setup theme toggle
            this.setupThemeToggle();

        } catch (error) {
            console.error('App initialization failed:', error);
            this.hideLoadingScreen();
            Router.navigate(CONFIG.ROUTES.AUTH, {}, false);
        }
    },

    async onAuthenticated() {
        // Check streak
        try {
            await Auth.checkAndUpdateStreak();
        } catch (e) {
            console.error('Streak check failed:', e);
        }

        // Start study time tracking
        Storage.startStudySession();

        // Navigate to home or hash route
        const hash = window.location.hash.replace('#', '');
        const validRoutes = Object.values(CONFIG.ROUTES);

        if (hash && validRoutes.includes(hash) && hash !== CONFIG.ROUTES.AUTH) {
            Router.navigate(hash, {}, false);
        } else {
            Router.navigate(CONFIG.ROUTES.HOME, {}, false);
        }
    },

    setupAuthListener() {
        // Listen for sign out from other tabs
        window.addEventListener('storage', (e) => {
            if (e.key === 'sb-auth-token' && !e.newValue) {
                Router.navigate(CONFIG.ROUTES.AUTH, {}, false);
            }
        });

        // Save study time before unload
        window.addEventListener('beforeunload', async () => {
            const duration = Storage.endStudySession();
            if (duration > 0 && Auth.user) {
                try {
                    await Auth.updateStudyTime(duration);
                } catch (e) {
                    // Best effort
                }
            }
        });

        // Periodic study time save (every 5 minutes)
        setInterval(async () => {
            if (Auth.user && !Router.studyTimerPaused) {
                const duration = Storage.endStudySession();
                if (duration > 0) {
                    try {
                        await Auth.updateStudyTime(duration);
                    } catch (e) {}
                    Storage.startStudySession();
                }
            }
        }, 5 * 60 * 1000);
    },

    onAuthChange(isLoggedIn) {
        if (isLoggedIn) {
            this.onAuthenticated();
        } else {
            Router.navigate(CONFIG.ROUTES.AUTH, {}, false);
        }
    },

    setupThemeToggle() {
        const themeBtn = document.getElementById('theme-toggle');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => {
                const current = Storage.getTheme();
                const newTheme = current === 'dark' ? 'light' : 'dark';
                Storage.setTheme(newTheme);
            });
        }
    },

    hideLoadingScreen() {
        const loading = document.getElementById('loading-screen');
        if (loading) {
            loading.classList.add('fade-out');
            setTimeout(() => {
                loading.style.display = 'none';
            }, 300);
        }
    }
};

// Start app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

window.App = App;
