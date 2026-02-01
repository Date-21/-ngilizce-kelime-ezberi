// VocabMaster Pro - Router

const Router = {
    currentPage: null,
    currentParams: null,
    pageInstances: {},
    navElement: null,
    mainContent: null,
    headerElement: null,
    idleTimer: null,
    studyTimer: null,

    init() {
        this.navElement = document.getElementById('bottom-nav');
        this.mainContent = document.getElementById('main-content');
        this.headerElement = document.getElementById('app-header');

        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            if (e.state?.page) {
                this.navigate(e.state.page, e.state.params, false);
            }
        });

        // Setup idle detection
        this.setupIdleDetection();
    },

    async navigate(page, params = {}, pushState = true) {
        // Clean up current page
        if (this.currentPage && this.pageInstances[this.currentPage]?.cleanup) {
            this.pageInstances[this.currentPage].cleanup();
        }

        this.currentPage = page;
        this.currentParams = params;

        // Update browser history
        if (pushState) {
            history.pushState({ page, params }, '', `#${page}`);
        }

        // Update navigation
        this.updateNav(page);

        // Show/hide header and nav based on page
        if (page === CONFIG.ROUTES.AUTH) {
            this.headerElement.classList.add('hidden');
            this.navElement.classList.add('hidden');
            this.mainContent.style.paddingTop = '0';
            this.mainContent.style.paddingBottom = '0';
        } else {
            this.headerElement.classList.remove('hidden');
            this.navElement.classList.remove('hidden');
            this.mainContent.style.paddingTop = '';
            this.mainContent.style.paddingBottom = '';
        }

        // Render page
        this.mainContent.innerHTML = '';

        let pageElement;
        try {
            switch (page) {
                case CONFIG.ROUTES.AUTH:
                    pageElement = AuthPage.render();
                    break;
                case CONFIG.ROUTES.HOME:
                    pageElement = await HomePage.render();
                    break;
                case CONFIG.ROUTES.FLASHCARDS:
                    pageElement = await FlashcardsPage.render(params);
                    break;
                case CONFIG.ROUTES.STUDY:
                    pageElement = await StudyPage.render();
                    break;
                case CONFIG.ROUTES.COMPETITION:
                    pageElement = await CompetitionPage.render();
                    break;
                case CONFIG.ROUTES.REPORTS:
                    pageElement = await ReportsPage.render(params);
                    break;
                case CONFIG.ROUTES.FORUM:
                    pageElement = await ForumPage.render();
                    break;
                case CONFIG.ROUTES.PROFILE:
                    pageElement = await ProfilePage.render();
                    break;
                case CONFIG.ROUTES.ADMIN:
                    pageElement = await AdminPage.render();
                    break;
                default:
                    pageElement = await HomePage.render();
                    break;
            }
        } catch (error) {
            console.error('Page render error:', error);
            pageElement = document.createElement('div');
            pageElement.className = 'empty-state';
            pageElement.style.minHeight = '60vh';
            pageElement.innerHTML = `
                <h3 class="empty-state-title">Bir hata olustu</h3>
                <p class="empty-state-text">${Helpers.escapeHtml(error.message || 'Sayfa yuklenemedi')}</p>
                <button class="btn btn-primary" onclick="Router.navigate('home')">Ana Sayfaya Don</button>
            `;
        }

        if (pageElement) {
            this.mainContent.appendChild(pageElement);
        }

        // Scroll to top
        window.scrollTo(0, 0);
    },

    updateNav(page) {
        if (!this.navElement) return;

        const navItems = this.navElement.querySelectorAll('.nav-item');
        const indicator = this.navElement.querySelector('.nav-indicator');

        navItems.forEach((item, index) => {
            const itemPage = item.dataset.page;
            const isActive = itemPage === page;
            item.classList.toggle('active', isActive);

            if (isActive && indicator) {
                indicator.style.transform = `translateX(${index * 100}%)`;
            }
        });
    },

    setupIdleDetection() {
        const resetIdle = () => {
            if (this.idleTimer) {
                clearTimeout(this.idleTimer);
            }

            // Resume study timer if it was paused
            if (this.studyTimerPaused) {
                this.studyTimerPaused = false;
            }

            this.idleTimer = setTimeout(() => {
                // Pause study time tracking
                this.studyTimerPaused = true;
            }, CONFIG.IDLE_TIMEOUT);
        };

        // Track activity
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, resetIdle, { passive: true });
        });

        resetIdle();
    },

    // Get current page name
    getCurrentPage() {
        return this.currentPage;
    },

    // Navigate back
    back() {
        history.back();
    }
};

// Setup nav click handlers
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const page = item.dataset.page;
            if (page) {
                Router.navigate(page);
            }
        });
    });
});

// Make globally available
window.Router = Router;
