// VocabMaster Pro - Home Page

const HomePage = {
    reviewWords: [],

    async render() {
        const container = document.createElement('div');
        container.className = 'home-page page-enter';

        const profile = Auth.getProfile();
        const username = profile?.username || 'Kullanici';

        // Get review words count
        try {
            this.reviewWords = await DB.progress.getWordsForReview(Auth.user.id);
        } catch (e) {
            this.reviewWords = [];
        }

        // Get daily stats
        let dailyStats = { words_learned: 0, study_time: 0, points_earned: 0 };
        try {
            dailyStats = await DB.stats.getOrCreate(Auth.user.id);
        } catch (e) {}

        // Goals (could be from user settings)
        const goals = profile?.settings?.goals || {
            words: 20,
            time: 30,
            points: 100
        };

        container.innerHTML = `
            <div class="welcome-section">
                <p class="welcome-greeting">Hos geldin,</p>
                <h1 class="welcome-name">${Helpers.escapeHtml(username)} 👋</h1>
                ${profile?.current_streak > 0 ? `
                    <div class="streak-badge animate-streak">
                        🔥 ${profile.current_streak} gunluk seri!
                    </div>
                ` : ''}
            </div>

            ${this.reviewWords.length > 0 ? `
                <div class="review-reminder" id="review-reminder">
                    <div class="review-reminder-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                        </svg>
                    </div>
                    <div class="review-reminder-content">
                        <div class="review-reminder-title">Tekrar zamani!</div>
                        <div class="review-reminder-text">${this.reviewWords.length} kelime tekrar edilmeyi bekliyor</div>
                    </div>
                    <button class="btn btn-sm btn-primary" id="start-review">Tekrar Et</button>
                </div>
            ` : ''}

            <div class="daily-goals">
                <div class="daily-goals-header">
                    <h2 class="daily-goals-title">Gunluk Hedefler</h2>
                    <button class="icon-btn" id="edit-goals" aria-label="Hedefleri duzenle">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                </div>

                <div class="goal-item">
                    <div class="goal-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="2" y="4" width="20" height="16" rx="2"/>
                            <path d="M12 8v8M8 12h8"/>
                        </svg>
                    </div>
                    <div class="goal-content">
                        <div class="goal-label">Kelime</div>
                        <div class="goal-progress-text">${dailyStats.words_learned || 0} / ${goals.words}</div>
                        <div class="progress goal-progress">
                            <div class="progress-bar" style="width: ${Math.min(100, ((dailyStats.words_learned || 0) / goals.words) * 100)}%"></div>
                        </div>
                    </div>
                </div>

                <div class="goal-item">
                    <div class="goal-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                        </svg>
                    </div>
                    <div class="goal-content">
                        <div class="goal-label">Calisma Suresi</div>
                        <div class="goal-progress-text">${dailyStats.study_time || 0} / ${goals.time} dk</div>
                        <div class="progress goal-progress">
                            <div class="progress-bar" style="width: ${Math.min(100, ((dailyStats.study_time || 0) / goals.time) * 100)}%"></div>
                        </div>
                    </div>
                </div>

                <div class="goal-item">
                    <div class="goal-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                    </div>
                    <div class="goal-content">
                        <div class="goal-label">Puan</div>
                        <div class="goal-progress-text">${dailyStats.points_earned || 0} / ${goals.points}</div>
                        <div class="progress goal-progress">
                            <div class="progress-bar" style="width: ${Math.min(100, ((dailyStats.points_earned || 0) / goals.points) * 100)}%"></div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="quick-actions">
                <div class="quick-action" data-action="flashcards">
                    <div class="quick-action-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="2" y="4" width="20" height="16" rx="2"/>
                            <path d="M12 8v8M8 12h8"/>
                        </svg>
                    </div>
                    <span class="quick-action-label">Kelime Kartlari</span>
                </div>

                <div class="quick-action" data-action="study">
                    <div class="quick-action-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                        </svg>
                    </div>
                    <span class="quick-action-label">Calisma Alani</span>
                </div>

                <div class="quick-action" data-action="competition">
                    <div class="quick-action-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                            <path d="M4 22h16"/>
                            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
                            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
                            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
                        </svg>
                    </div>
                    <span class="quick-action-label">Yarisma</span>
                </div>

                <div class="quick-action" data-action="reports">
                    <div class="quick-action-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 3v18h18"/>
                            <path d="M18 17V9"/>
                            <path d="M13 17V5"/>
                            <path d="M8 17v-3"/>
                        </svg>
                    </div>
                    <span class="quick-action-label">Istatistikler</span>
                </div>
            </div>

            <div class="leaderboard-section">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Liderlik Tablosu</h3>
                        <button class="btn btn-sm btn-ghost" id="view-full-leaderboard">Tumu</button>
                    </div>
                    <div id="mini-leaderboard" class="leaderboard-list">
                        <div class="skeleton skeleton-text lg"></div>
                        <div class="skeleton skeleton-text"></div>
                        <div class="skeleton skeleton-text"></div>
                    </div>
                </div>
            </div>
        `;

        this.setupEventListeners(container);
        this.loadLeaderboard(container);

        return container;
    },

    setupEventListeners(container) {
        // Quick actions
        container.querySelectorAll('.quick-action').forEach(action => {
            action.addEventListener('click', () => {
                const page = action.dataset.action;
                if (page) {
                    Router.navigate(page);
                }
            });
        });

        // Start review
        const reviewBtn = container.querySelector('#start-review');
        if (reviewBtn) {
            reviewBtn.addEventListener('click', () => {
                // Navigate to flashcards with review mode
                Router.navigate('flashcards', { mode: 'review' });
            });
        }

        // Edit goals
        container.querySelector('#edit-goals').addEventListener('click', () => {
            this.showGoalsEditor();
        });

        // View full leaderboard
        container.querySelector('#view-full-leaderboard').addEventListener('click', () => {
            Router.navigate('reports', { tab: 'leaderboard' });
        });
    },

    async loadLeaderboard(container) {
        const leaderboardEl = container.querySelector('#mini-leaderboard');

        try {
            const leaderboard = await DB.users.getLeaderboard('points', 'all', 5);
            const currentUserId = Auth.user.id;
            const userRank = await DB.users.getUserRank(currentUserId, 'points');

            leaderboardEl.innerHTML = leaderboard.map((user, index) => `
                <div class="leaderboard-item ${user.id === currentUserId ? 'current-user' : ''}">
                    <div class="leaderboard-rank ${index < 3 ? `top-${index + 1}` : ''}">
                        ${index + 1}
                    </div>
                    <div class="leaderboard-user">
                        <span class="leaderboard-username">${Helpers.escapeHtml(user.username)}</span>
                    </div>
                    <span class="leaderboard-value">${Helpers.formatNumber(user.total_points)}</span>
                </div>
            `).join('');

            // Add current user's rank if not in top 5
            if (userRank > 5) {
                const profile = Auth.getProfile();
                leaderboardEl.innerHTML += `
                    <div style="text-align: center; padding: var(--spacing-sm); color: var(--text-tertiary);">...</div>
                    <div class="leaderboard-item current-user">
                        <div class="leaderboard-rank">${userRank}</div>
                        <div class="leaderboard-user">
                            <span class="leaderboard-username">${Helpers.escapeHtml(profile.username)}</span>
                        </div>
                        <span class="leaderboard-value">${Helpers.formatNumber(profile.total_points)}</span>
                    </div>
                `;
            }
        } catch (error) {
            leaderboardEl.innerHTML = '<p style="text-align: center; color: var(--text-tertiary);">Yuklenemedi</p>';
        }
    },

    async showGoalsEditor() {
        const profile = Auth.getProfile();
        const currentGoals = profile?.settings?.goals || {
            words: 20,
            time: 30,
            points: 100
        };

        const modal = Modal.create({
            title: 'Gunluk Hedefler',
            content: `
                <div class="form-group">
                    <label class="form-label">Kelime Hedefi</label>
                    <input type="number" class="form-input" id="goal-words" value="${currentGoals.words}" min="1" max="100">
                </div>
                <div class="form-group">
                    <label class="form-label">Calisma Suresi (dakika)</label>
                    <input type="number" class="form-input" id="goal-time" value="${currentGoals.time}" min="5" max="180">
                </div>
                <div class="form-group">
                    <label class="form-label">Puan Hedefi</label>
                    <input type="number" class="form-input" id="goal-points" value="${currentGoals.points}" min="10" max="1000">
                </div>
            `,
            actions: [
                {
                    id: 'cancel',
                    label: 'Iptal',
                    class: 'btn-secondary',
                    handler: (m) => Modal.close(m)
                },
                {
                    id: 'save',
                    label: 'Kaydet',
                    class: 'btn-primary',
                    handler: async (m) => {
                        const goals = {
                            words: parseInt(m.querySelector('#goal-words').value) || 20,
                            time: parseInt(m.querySelector('#goal-time').value) || 30,
                            points: parseInt(m.querySelector('#goal-points').value) || 100
                        };

                        try {
                            const settings = { ...profile?.settings, goals };
                            await DB.users.updateSettings(Auth.user.id, settings);
                            Auth.profile.settings = settings;
                            Toast.success('Hedefler kaydedildi');
                            Modal.close(m);
                            Router.navigate('home'); // Refresh page
                        } catch (error) {
                            Toast.error('Hedefler kaydedilemedi');
                        }
                    }
                }
            ]
        });
    },

    cleanup() {
        // Cleanup if needed
    }
};

window.HomePage = HomePage;
