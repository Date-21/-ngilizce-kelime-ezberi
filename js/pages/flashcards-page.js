// VocabMaster Pro - Flashcards Page

const FlashcardsPage = {
    levels: [],
    currentLevel: null,
    allLevelWords: [],   // all words in the level (never mutated)
    words: [],           // current round's words to show
    currentWordIndex: 0,
    learnedWordIds: [],  // ids of words marked "learned" (persists across rounds)
    repeatWordIds: [],   // ids of words marked "repeat" in current round
    firstTimeLearnedCount: 0, // words learned on the very first pass
    mode: 'learn',
    studyStartTime: null,
    isFirstPass: true,

    async render(params = {}) {
        const container = document.createElement('div');
        container.className = 'flashcards-page page-enter';

        this.mode = params.mode || 'learn';

        if (this.mode === 'review') {
            return await this.renderReviewMode(container);
        }

        // Load levels
        try {
            this.levels = await DB.levels.getAll();
            const levelProgress = await DB.progress.getLevelProgress(Auth.user.id);

            // Load word counts per level
            const levelWordCounts = {};
            for (const level of this.levels) {
                try {
                    const words = await DB.levels.getWords(level.id);
                    levelWordCounts[level.id] = words.length;
                } catch (e) {
                    levelWordCounts[level.id] = 0;
                }
            }

            // Merge progress with levels
            this.levels = this.levels.map((level, idx) => {
                const progress = levelProgress.find(p => p.level_id === level.id);
                const wordCount = levelWordCounts[level.id] || 0;
                // First level is always unlocked; others need previous completed or explicit unlock
                const isFirstLevel = level.order_index === 1 || idx === 0;
                return {
                    ...level,
                    wordCount,
                    isUnlocked: progress?.is_unlocked || isFirstLevel,
                    isCompleted: progress?.is_completed || false,
                    currentWordIndex: progress?.current_word_index || 0,
                    learnedWords: progress?.learned_words || [],
                    repeatWords: progress?.repeat_words || []
                };
            });
        } catch (error) {
            console.error('Failed to load levels:', error);
            this.levels = [];
        }

        container.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">Kelime Kartlari</h1>
                <p class="page-subtitle">Seviye sec ve kelimeleri ogren</p>
            </div>

            <div class="word-search-section">
                <div class="search-input-wrapper">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="M21 21l-4.35-4.35"/>
                    </svg>
                    <input type="text" class="form-input" id="word-search" placeholder="Ogrenilen kelimeler icinde ara...">
                </div>
                <div id="search-results" class="search-results hidden"></div>
            </div>

            <div class="levels-grid" id="levels-grid">
                ${this.levels.length === 0 ? `
                    <div class="empty-state">
                        <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="2" y="4" width="20" height="16" rx="2"/>
                            <path d="M12 8v8M8 12h8"/>
                        </svg>
                        <h3 class="empty-state-title">Henuz seviye yok</h3>
                        <p class="empty-state-text">Admin tarafindan kelime eklenmesini bekleyin</p>
                    </div>
                ` : this.levels.map(level => this.renderLevelCard(level)).join('')}
            </div>
        `;

        this.setupEventListeners(container);
        return container;
    },

    renderLevelCard(level) {
        const statusClass = level.isCompleted ? 'completed' :
            (level.isUnlocked && (level.currentWordIndex > 0 || level.learnedWords.length > 0)) ? 'current' :
                !level.isUnlocked ? 'locked' : '';

        const statusIcon = level.isCompleted ?
            `<svg class="level-status-icon completed" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>` :
            !level.isUnlocked ?
                `<svg class="level-status-icon locked" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>` :
                `<svg class="level-status-icon current" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
            </svg>`;

        const wordCount = level.wordCount || 0;
        const learnedCount = level.isCompleted ? wordCount : (level.learnedWords?.length || 0);
        const progress = wordCount > 0 ? Math.round((learnedCount / wordCount) * 100) : 0;

        return `
            <div class="level-card ${statusClass}" data-level-id="${level.id}" ${!level.isUnlocked ? 'disabled' : ''}>
                <div class="level-header">
                    <span class="level-number">Seviye ${level.order_index}</span>
                    <div class="level-status">${statusIcon}</div>
                </div>
                <h3 class="level-name">${Helpers.escapeHtml(level.name)}</h3>
                <div class="level-stats">
                    <span class="level-stat">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="2" y="4" width="20" height="16" rx="2"/>
                        </svg>
                        ${wordCount} kelime
                    </span>
                </div>
                ${level.isUnlocked ? `
                    <div class="level-progress">
                        <div class="progress">
                            <div class="progress-bar" style="width: ${progress}%"></div>
                        </div>
                        <span class="level-progress-text">${learnedCount}/${wordCount} - ${progress}%</span>
                    </div>
                ` : ''}
            </div>
        `;
    },

    async renderReviewMode(container) {
        try {
            const reviewData = await DB.progress.getWordsForReview(Auth.user.id);
            this.allLevelWords = reviewData.map(r => r.words);
            this.words = [...this.allLevelWords];
        } catch (error) {
            this.allLevelWords = [];
            this.words = [];
        }

        if (this.words.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="min-height: 60vh;">
                    <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    <h3 class="empty-state-title">Harika!</h3>
                    <p class="empty-state-text">Bugun tekrar edilecek kelime yok</p>
                    <button class="btn btn-primary" id="back-to-levels">Seviyelere Don</button>
                </div>
            `;

            container.querySelector('#back-to-levels').addEventListener('click', () => {
                Router.navigate('flashcards');
            });

            return container;
        }

        this.currentWordIndex = 0;
        this.learnedWordIds = [];
        this.repeatWordIds = [];
        this.firstTimeLearnedCount = 0;
        this.isFirstPass = true;
        this.studyStartTime = Date.now();

        return this.renderStudyView(container, true);
    },

    async renderStudyView(container, isReview = false) {
        container.innerHTML = '';
        container.className = 'flashcard-study page-enter';

        const word = this.words[this.currentWordIndex];
        if (!word) {
            // Safety: shouldn't happen but handle gracefully
            Router.navigate('flashcards');
            return container;
        }

        const totalWords = this.allLevelWords.length;
        const progress = totalWords > 0 ? ((this.learnedWordIds.length) / totalWords) * 100 : 0;
        const remainingInRound = this.words.length - this.currentWordIndex;

        const header = document.createElement('div');
        header.className = 'flashcard-progress';
        header.innerHTML = `
            <div class="flashcard-progress-info">
                <span>${isReview ? 'Tekrar' : this.currentLevel?.name || 'Seviye'}</span>
                <span>${this.learnedWordIds.length}/${totalWords} ogrenildi${this.repeatWordIds.length > 0 || (!this.isFirstPass) ? ' | Bu turda: ' + remainingInRound + ' kaldi' : ''}</span>
            </div>
            <div class="progress">
                <div class="progress-bar" style="width: ${progress}%"></div>
            </div>
            <button class="btn btn-ghost btn-sm" id="exit-study" style="margin-top: var(--spacing-md);">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Cik
            </button>
        `;

        container.appendChild(header);

        // Create flashcard
        const card = Flashcard.create(word, {
            showActions: true,
            onLearn: () => this.handleLearn(word, isReview),
            onRepeat: () => this.handleRepeat(word, isReview)
        });

        container.appendChild(card);

        // Exit button
        header.querySelector('#exit-study').addEventListener('click', () => {
            this.exitStudy(isReview);
        });

        return container;
    },

    setupEventListeners(container) {
        // Level card click
        container.querySelectorAll('.level-card:not(.locked)').forEach(card => {
            card.addEventListener('click', () => {
                const levelId = parseInt(card.dataset.levelId);
                this.startLevel(levelId);
            });
        });

        // Word search
        const searchInput = container.querySelector('#word-search');
        const searchResults = container.querySelector('#search-results');

        if (searchInput) {
            searchInput.addEventListener('input', Helpers.debounce(async (e) => {
                const query = e.target.value.trim();
                if (query.length < 2) {
                    searchResults.classList.add('hidden');
                    return;
                }

                try {
                    const results = await DB.progress.searchLearnedWords(Auth.user.id, query);
                    this.showSearchResults(searchResults, results);
                } catch (error) {
                    searchResults.innerHTML = '<p style="padding: var(--spacing-md); color: var(--text-tertiary);">Arama yapilamadi</p>';
                    searchResults.classList.remove('hidden');
                }
            }, 300));
        }
    },

    showSearchResults(container, words) {
        if (words.length === 0) {
            container.innerHTML = '<p style="padding: var(--spacing-md); color: var(--text-tertiary);">Sonuc bulunamadi</p>';
        } else {
            container.innerHTML = words.slice(0, 20).map(word => `
                <div class="search-result-item" data-word-id="${word.id}">
                    <div>
                        <div class="search-result-word">${Helpers.escapeHtml(word.english_word)}</div>
                        <div class="search-result-meaning">${Helpers.escapeHtml(word.turkish_meaning)}</div>
                    </div>
                    <span class="search-result-level">Seviye ${word.level_id}</span>
                </div>
            `).join('');

            container.querySelectorAll('.search-result-item').forEach(item => {
                item.addEventListener('click', () => {
                    const word = words.find(w => w.id === parseInt(item.dataset.wordId));
                    if (word) this.showWordDetail(word);
                });
            });
        }

        container.classList.remove('hidden');
    },

    showWordDetail(word) {
        Modal.create({
            title: word.english_word,
            content: `
                <div style="text-align: center;">
                    <p style="color: var(--text-tertiary); font-style: italic; margin-bottom: var(--spacing-md);">
                        ${word.pronunciation || ''}
                    </p>
                    <p style="font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold); color: var(--accent-primary); margin-bottom: var(--spacing-lg);">
                        ${word.turkish_meaning}
                    </p>
                    ${word.memory_sentence ? `
                        <p style="padding: var(--spacing-md); background: var(--bg-secondary); border-radius: var(--radius-lg); color: var(--text-secondary);">
                            "${word.memory_sentence}"
                        </p>
                    ` : ''}
                    ${word.example_sentence ? `
                        <p style="margin-top: var(--spacing-md); font-size: var(--font-size-sm); color: var(--text-tertiary);">
                            <strong>Ornek:</strong> ${word.example_sentence}
                        </p>
                    ` : ''}
                </div>
            `,
            actions: [
                {
                    id: 'speak',
                    label: '🔊 Dinle',
                    class: 'btn-secondary',
                    handler: () => Flashcard.speak(word.english_word)
                },
                {
                    id: 'close',
                    label: 'Kapat',
                    class: 'btn-primary',
                    handler: (m) => Modal.close(m)
                }
            ]
        });
    },

    async startLevel(levelId) {
        this.currentLevel = this.levels.find(l => l.id === levelId);
        if (!this.currentLevel) return;

        // Load words for this level
        try {
            this.allLevelWords = await DB.levels.getWords(levelId);
        } catch (error) {
            Toast.error('Kelimeler yuklenemedi');
            return;
        }

        if (this.allLevelWords.length === 0) {
            Toast.warning('Bu seviyede kelime yok');
            return;
        }

        // Initialize progress if needed
        if (!this.currentLevel.isUnlocked) {
            await DB.progress.initializeLevelProgress(Auth.user.id, levelId);
        }

        // Restore saved progress
        const savedLearned = this.currentLevel.learnedWords || [];
        const savedRepeat = this.currentLevel.repeatWords || [];

        this.learnedWordIds = [...savedLearned];
        this.firstTimeLearnedCount = savedLearned.length;

        // Determine which words to show in this session
        if (savedRepeat.length > 0) {
            // There are words saved for repeat - show those
            this.words = this.allLevelWords.filter(w => savedRepeat.includes(w.id));
            this.isFirstPass = false;
        } else {
            // Filter out already learned words, show remaining
            const unlearnedWords = this.allLevelWords.filter(w => !savedLearned.includes(w.id));
            if (unlearnedWords.length === 0) {
                // All words already learned - level complete
                Toast.success('Bu seviyeyi zaten tamamladiniz!');
                return;
            }
            this.words = unlearnedWords;
            this.isFirstPass = savedLearned.length === 0;
        }

        this.currentWordIndex = 0;
        this.repeatWordIds = [];
        this.studyStartTime = Date.now();

        // Start study timer
        Storage.startStudySession();

        // Render study view
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = '';
        await this.renderStudyView(mainContent);
    },

    async handleLearn(word, isReview = false) {
        // Add to learned if not already there
        if (!this.learnedWordIds.includes(word.id)) {
            this.learnedWordIds.push(word.id);
            if (this.isFirstPass) {
                this.firstTimeLearnedCount++;
            }
        }

        // Award points
        try {
            await Auth.addPoints(CONFIG.POINTS.WORD_LEARNED);
        } catch (e) { console.warn('Points error:', e); }

        // Update word progress
        if (!isReview) {
            try {
                await DB.progress.markWordLearned(Auth.user.id, word.id);
                await DB.stats.update(Auth.user.id, { words: 1 });
            } catch (e) { console.warn('Progress update error:', e); }
        } else {
            try {
                await DB.progress.updateReview(Auth.user.id, word.id, true);
            } catch (e) { console.warn('Review update error:', e); }
        }

        // Show points animation
        Flashcard.showPoints(CONFIG.POINTS.WORD_LEARNED, true);

        // Next word
        await this.nextWord(isReview);
    },

    async handleRepeat(word, isReview = false) {
        // Add to repeat list for this round
        if (!this.repeatWordIds.includes(word.id)) {
            this.repeatWordIds.push(word.id);
        }

        if (isReview) {
            try {
                await DB.progress.updateReview(Auth.user.id, word.id, false);
            } catch (e) { console.warn('Review update error:', e); }
        }

        // Next word
        await this.nextWord(isReview);
    },

    async nextWord(isReview = false) {
        this.currentWordIndex++;

        // Check if we've gone through all words in this round
        if (this.currentWordIndex >= this.words.length) {
            if (this.repeatWordIds.length > 0) {
                // Still have words to repeat - start new round with only repeat words
                this.words = this.allLevelWords.filter(w => this.repeatWordIds.includes(w.id));
                this.repeatWordIds = [];
                this.currentWordIndex = 0;
                this.isFirstPass = false;
            } else {
                // All words learned - level/review complete!
                await this.completeLevel(isReview);
                return;
            }
        }

        // Save progress periodically (not on review mode)
        if (!isReview && this.currentLevel) {
            try {
                await DB.progress.updateLevelProgress(Auth.user.id, this.currentLevel.id, {
                    current_word_index: this.currentWordIndex,
                    learned_words: this.learnedWordIds,
                    repeat_words: this.repeatWordIds
                });
            } catch (e) { console.warn('Progress save error:', e); }
        }

        // Render next card
        const mainContent = document.getElementById('main-content');
        await this.renderStudyView(mainContent, isReview);
    },

    async completeLevel(isReview = false) {
        const studyTime = Math.floor((Date.now() - this.studyStartTime) / 60000);
        try { await Auth.updateStudyTime(studyTime); } catch (e) {}
        Storage.endStudySession();

        // Check and update streak
        try { await Auth.checkAndUpdateStreak(); } catch (e) {}

        // Check for badges
        try {
            const totalLearned = await DB.progress.getTotalLearnedWords(Auth.user.id);
            await DB.badges.checkAndAward(Auth.user.id, 'words', totalLearned);
        } catch (e) {}

        if (!isReview && this.currentLevel) {
            // Mark level complete
            try {
                await DB.progress.updateLevelProgress(Auth.user.id, this.currentLevel.id, {
                    is_completed: true,
                    completed_at: new Date().toISOString(),
                    current_word_index: this.allLevelWords.length,
                    learned_words: this.learnedWordIds,
                    repeat_words: []
                });
            } catch (e) { console.warn('Level complete save error:', e); }

            // Unlock next level
            const nextLevel = this.levels.find(l => l.order_index === this.currentLevel.order_index + 1);
            if (nextLevel) {
                try {
                    await DB.progress.initializeLevelProgress(Auth.user.id, nextLevel.id);
                } catch (e) {}
            }
        }

        // Show completion screen
        this.showLevelComplete(isReview, studyTime);
    },

    showLevelComplete(isReview, studyTime) {
        Flashcard.celebrate();

        const mainContent = document.getElementById('main-content');
        const totalWords = this.allLevelWords.length;
        const points = this.learnedWordIds.length * CONFIG.POINTS.WORD_LEARNED;
        const repeatNeeded = totalWords - this.firstTimeLearnedCount;

        mainContent.innerHTML = `
            <div class="level-complete animate-bounce-in">
                <div class="level-complete-icon">🎉</div>
                <h2>${isReview ? 'Tekrar Tamamlandi!' : 'Seviye Tamamlandi!'}</h2>
                <p style="color: var(--text-secondary); margin-bottom: var(--spacing-xl);">
                    ${isReview ? 'Tum kelimeleri tekrar ettiniz' : (this.currentLevel?.name || 'Seviye') + ' seviyesini tamamladiniz'}
                </p>
                <div class="level-complete-stats">
                    <div class="level-complete-stat">
                        <div class="level-complete-stat-value">${totalWords}</div>
                        <div class="level-complete-stat-label">Toplam Kelime</div>
                    </div>
                    <div class="level-complete-stat">
                        <div class="level-complete-stat-value">${this.firstTimeLearnedCount}</div>
                        <div class="level-complete-stat-label">Ilk Seferde Ogrenilenler</div>
                    </div>
                    <div class="level-complete-stat">
                        <div class="level-complete-stat-value">${repeatNeeded}</div>
                        <div class="level-complete-stat-label">Tekrar Gerektiren</div>
                    </div>
                    <div class="level-complete-stat">
                        <div class="level-complete-stat-value">+${points}</div>
                        <div class="level-complete-stat-label">Kazanilan Puan</div>
                    </div>
                    <div class="level-complete-stat">
                        <div class="level-complete-stat-value">${studyTime} dk</div>
                        <div class="level-complete-stat-label">Calisma Suresi</div>
                    </div>
                </div>
                <div class="level-complete-actions">
                    ${!isReview ? `
                        <button class="btn btn-primary btn-block" id="next-level">Sonraki Seviyeye Gec</button>
                    ` : ''}
                    <button class="btn btn-secondary btn-block" id="back-to-levels">Seviyelere Don</button>
                </div>
            </div>
        `;

        const nextLevelBtn = mainContent.querySelector('#next-level');
        if (nextLevelBtn) {
            nextLevelBtn.addEventListener('click', async () => {
                const nextLevel = this.levels.find(l => l.order_index === this.currentLevel.order_index + 1);
                if (nextLevel) {
                    await this.startLevel(nextLevel.id);
                } else {
                    Toast.info('Tum seviyeleri tamamladiniz!');
                    Router.navigate('flashcards');
                }
            });
        }

        mainContent.querySelector('#back-to-levels').addEventListener('click', () => {
            Router.navigate('flashcards');
        });
    },

    async exitStudy(isReview = false) {
        const confirmed = await Modal.confirm(
            'Cikarsaniz ilerlemeniz kaydedilecek. Cikmak istediginize emin misiniz?',
            'Cikis',
            'Cik',
            'Devam Et'
        );

        if (confirmed) {
            const studyTime = Math.floor((Date.now() - this.studyStartTime) / 60000);
            try { await Auth.updateStudyTime(studyTime); } catch (e) {}
            Storage.endStudySession();

            if (!isReview && this.currentLevel) {
                // Save current progress including learned words and remaining repeat words
                const currentRepeatIds = [...this.repeatWordIds];
                // Also add remaining unprocessed words in current round as repeat
                for (let i = this.currentWordIndex; i < this.words.length; i++) {
                    const wid = this.words[i].id;
                    if (!this.learnedWordIds.includes(wid) && !currentRepeatIds.includes(wid)) {
                        currentRepeatIds.push(wid);
                    }
                }

                try {
                    await DB.progress.updateLevelProgress(Auth.user.id, this.currentLevel.id, {
                        current_word_index: this.currentWordIndex,
                        learned_words: this.learnedWordIds,
                        repeat_words: currentRepeatIds
                    });
                } catch (e) { console.warn('Exit save error:', e); }
            }

            Router.navigate('flashcards');
        }
    },

    cleanup() {
        Flashcard.reset();
        this.currentLevel = null;
        this.allLevelWords = [];
        this.words = [];
        this.currentWordIndex = 0;
        this.learnedWordIds = [];
        this.repeatWordIds = [];
        this.firstTimeLearnedCount = 0;
        this.isFirstPass = true;
    }
};

window.FlashcardsPage = FlashcardsPage;
