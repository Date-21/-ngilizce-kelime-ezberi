// VocabMaster Pro - Reports Page

const ReportsPage = {
    currentPeriod: 'weekly',

    async render(params = {}) {
        const container = document.createElement('div');
        container.className = 'reports-page page-enter';

        container.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">Raporlar & Istatistikler</h1>
                <p class="page-subtitle">Ilerlemenizi takip edin</p>
            </div>

            <div class="tabs reports-tabs">
                <button class="tab" data-period="daily">Gunluk</button>
                <button class="tab active" data-period="weekly">Haftalik</button>
                <button class="tab" data-period="monthly">Aylik</button>
            </div>

            <div id="stats-overview" class="stats-grid">
                <div class="stat-card skeleton" style="height: 100px;"></div>
                <div class="stat-card skeleton" style="height: 100px;"></div>
                <div class="stat-card skeleton" style="height: 100px;"></div>
                <div class="stat-card skeleton" style="height: 100px;"></div>
                <div class="stat-card skeleton" style="height: 100px;"></div>
                <div class="stat-card skeleton" style="height: 100px;"></div>
            </div>

            <div class="chart-container">
                <h3 class="chart-title">Puan Trendi</h3>
                <div class="chart-wrapper" id="points-chart"></div>
            </div>

            <div class="chart-container">
                <h3 class="chart-title">Calisma Suresi</h3>
                <div class="chart-wrapper" id="time-chart"></div>
            </div>

            <div class="chart-container">
                <h3 class="chart-title">Calisma Dagilimi</h3>
                <div class="chart-wrapper" id="distribution-chart"></div>
            </div>

            <div class="weak-words-section">
                <div class="weak-words-header">
                    <h3 class="card-title">Zayif Kelimeler</h3>
                    <button class="btn btn-sm btn-primary" id="practice-weak">Bu kelimelerle calis</button>
                </div>
                <div id="weak-words-list">
                    <div class="skeleton skeleton-text"></div>
                    <div class="skeleton skeleton-text"></div>
                    <div class="skeleton skeleton-text"></div>
                </div>
            </div>

            <div class="leaderboard-section">
                <h3 class="page-title" style="font-size: var(--font-size-xl); margin-bottom: var(--spacing-lg);">Liderlik Tablosu</h3>
                <div class="tabs leaderboard-tabs">
                    <button class="tab active" data-lb="points">Puan</button>
                    <button class="tab" data-lb="time">Calisma Suresi</button>
                </div>
                <div class="tabs" style="margin-bottom: var(--spacing-lg);">
                    <button class="tab active" data-lb-period="all">Tum Zamanlar</button>
                    <button class="tab" data-lb-period="weekly">Haftalik</button>
                    <button class="tab" data-lb-period="monthly">Aylik</button>
                </div>
                <div id="leaderboard-content" class="leaderboard-list">
                    <div class="skeleton skeleton-text lg"></div>
                    <div class="skeleton skeleton-text"></div>
                    <div class="skeleton skeleton-text"></div>
                </div>
            </div>
        `;

        this.setupEventListeners(container);
        await this.loadData(container);

        return container;
    },

    setupEventListeners(container) {
        // Period tabs
        container.querySelectorAll('.reports-tabs .tab').forEach(tab => {
            tab.addEventListener('click', () => {
                container.querySelectorAll('.reports-tabs .tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.currentPeriod = tab.dataset.period;
                this.loadData(container);
            });
        });

        // Leaderboard tabs
        container.querySelectorAll('[data-lb]').forEach(tab => {
            tab.addEventListener('click', () => {
                container.querySelectorAll('[data-lb]').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.loadLeaderboard(container);
            });
        });

        container.querySelectorAll('[data-lb-period]').forEach(tab => {
            tab.addEventListener('click', () => {
                container.querySelectorAll('[data-lb-period]').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.loadLeaderboard(container);
            });
        });

        // Practice weak words
        container.querySelector('#practice-weak')?.addEventListener('click', () => {
            Router.navigate('study');
        });
    },

    async loadData(container) {
        const userId = Auth.user.id;

        try {
            let stats = [];
            const endDate = new Date();
            const startDate = new Date();

            if (this.currentPeriod === 'daily') {
                startDate.setDate(startDate.getDate() - 1);
                stats = await DB.stats.getRange(userId, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]);
            } else if (this.currentPeriod === 'weekly') {
                startDate.setDate(startDate.getDate() - 7);
                stats = await DB.stats.getWeekly(userId);
            } else {
                startDate.setDate(startDate.getDate() - 30);
                stats = await DB.stats.getMonthly(userId);
            }

            // Calculate totals
            const totals = stats.reduce((acc, day) => ({
                points: acc.points + (day.points_earned || 0),
                words: acc.words + (day.words_learned || 0),
                time: acc.time + (day.study_time || 0),
                tests: acc.tests + (day.tests_completed || 0)
            }), { points: 0, words: 0, time: 0, tests: 0 });

            // Get test results for success rate
            const testHistory = await DB.tests.getHistory(userId, 50);
            const totalCorrect = testHistory.reduce((sum, t) => sum + t.correct_answers, 0);
            const totalQuestions = testHistory.reduce((sum, t) => sum + t.total_questions, 0);
            const successRate = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

            // Render stats overview
            this.renderStatsOverview(container, totals, successRate, totalCorrect, totalQuestions - totalCorrect);

            // Render charts
            this.renderCharts(container, stats);

            // Load leaderboard
            this.loadLeaderboard(container);

            // Load weak words
            this.loadWeakWords(container);

        } catch (error) {
            console.error('Failed to load stats:', error);
            Toast.error('Istatistikler yuklenemedi');
        }
    },

    renderStatsOverview(container, totals, successRate, correctCount, incorrectCount) {
        const statsEl = container.querySelector('#stats-overview');
        statsEl.innerHTML = `
            <div class="stat-card">
                <div class="stat-label">Toplam Puan</div>
                <div class="stat-value">${Helpers.formatNumber(totals.points)}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Calisma Suresi</div>
                <div class="stat-value">${Helpers.formatDuration(totals.time)}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Ogrenilen Kelime</div>
                <div class="stat-value">${totals.words}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Dogru Cevap</div>
                <div class="stat-value" style="color: var(--success)">${correctCount}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Yanlis Cevap</div>
                <div class="stat-value" style="color: var(--error)">${incorrectCount}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Basari Orani</div>
                <div class="stat-value">%${successRate}</div>
            </div>
        `;
    },

    renderCharts(container, stats) {
        // Points chart
        const pointsChartEl = container.querySelector('#points-chart');
        if (stats.length > 0) {
            Charts.line(pointsChartEl, {
                labels: stats.map(s => {
                    const d = new Date(s.date);
                    return `${d.getDate()}/${d.getMonth() + 1}`;
                }),
                values: stats.map(s => s.points_earned || 0),
                color: 'var(--accent-primary)'
            });
        } else {
            pointsChartEl.innerHTML = '<p style="text-align: center; color: var(--text-tertiary); padding: var(--spacing-xl);">Veri yok</p>';
        }

        // Time chart
        const timeChartEl = container.querySelector('#time-chart');
        if (stats.length > 0) {
            Charts.bar(timeChartEl, {
                labels: stats.map(s => {
                    const d = new Date(s.date);
                    return `${d.getDate()}/${d.getMonth() + 1}`;
                }),
                values: stats.map(s => s.study_time || 0)
            });
        } else {
            timeChartEl.innerHTML = '<p style="text-align: center; color: var(--text-tertiary); padding: var(--spacing-xl);">Veri yok</p>';
        }

        // Distribution chart
        const distChartEl = container.querySelector('#distribution-chart');
        const totalWords = stats.reduce((sum, s) => sum + (s.words_learned || 0), 0);
        const totalTests = stats.reduce((sum, s) => sum + (s.tests_completed || 0), 0);

        Charts.pie(distChartEl, {
            labels: ['Kelime Kartlari', 'Testler'],
            values: [totalWords, totalTests],
            colors: ['var(--accent-primary)', 'var(--info)']
        });
    },

    async loadLeaderboard(container) {
        const lbContent = container.querySelector('#leaderboard-content');
        const activeType = container.querySelector('[data-lb].active')?.dataset.lb || 'points';
        const activePeriod = container.querySelector('[data-lb-period].active')?.dataset.lbPeriod || 'all';

        try {
            const leaderboard = await DB.users.getLeaderboard(activeType, activePeriod, CONFIG.LEADERBOARD_LIMIT);
            const userRank = await DB.users.getUserRank(Auth.user.id, activeType);
            const currentUserId = Auth.user.id;

            if (leaderboard.length === 0) {
                lbContent.innerHTML = '<p style="text-align: center; color: var(--text-tertiary); padding: var(--spacing-lg);">Henuz veri yok</p>';
                return;
            }

            lbContent.innerHTML = leaderboard.map((user, index) => {
                const value = activeType === 'points'
                    ? Helpers.formatNumber(user.total_points) + ' puan'
                    : Helpers.formatDuration(user.total_study_time);

                return `
                    <div class="leaderboard-item ${user.id === currentUserId ? 'current-user' : ''}">
                        <div class="leaderboard-rank ${index < 3 ? `top-${index + 1}` : ''}">
                            ${index + 1}
                        </div>
                        <div class="leaderboard-user">
                            <span class="leaderboard-username">${Helpers.escapeHtml(user.username)}</span>
                        </div>
                        <span class="leaderboard-value">${value}</span>
                    </div>
                `;
            }).join('');

            // Show current user position if not in top N
            if (userRank > CONFIG.LEADERBOARD_LIMIT) {
                const profile = Auth.getProfile();
                const value = activeType === 'points'
                    ? Helpers.formatNumber(profile.total_points) + ' puan'
                    : Helpers.formatDuration(profile.total_study_time);

                lbContent.innerHTML += `
                    <div style="text-align: center; padding: var(--spacing-sm); color: var(--text-tertiary);">...</div>
                    <div class="leaderboard-item current-user">
                        <div class="leaderboard-rank">${userRank}</div>
                        <div class="leaderboard-user">
                            <span class="leaderboard-username">${Helpers.escapeHtml(profile.username)}</span>
                        </div>
                        <span class="leaderboard-value">${value}</span>
                    </div>
                `;
            }
        } catch (error) {
            lbContent.innerHTML = '<p style="text-align: center; color: var(--text-tertiary);">Yuklenemedi</p>';
        }
    },

    async loadWeakWords(container) {
        const weakWordsEl = container.querySelector('#weak-words-list');

        try {
            // Get test history to analyze weak words
            const testHistory = await DB.tests.getHistory(Auth.user.id, 100);

            // For now show a simple message if no data
            if (testHistory.length === 0) {
                weakWordsEl.innerHTML = '<p style="text-align: center; color: var(--text-tertiary); padding: var(--spacing-lg);">Henuz yeterli test verisi yok</p>';
                return;
            }

            // Show placeholder weak words
            weakWordsEl.innerHTML = `
                <p style="text-align: center; color: var(--text-tertiary); padding: var(--spacing-lg);">
                    Zayif kelimelerinizi gormek icin daha fazla test cozun
                </p>
            `;
        } catch (error) {
            weakWordsEl.innerHTML = '<p style="text-align: center; color: var(--text-tertiary);">Yuklenemedi</p>';
        }
    },

    cleanup() {}
};

window.ReportsPage = ReportsPage;
