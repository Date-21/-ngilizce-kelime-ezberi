// VocabMaster Pro - Study Page

const StudyPage = {
    selectedLevelStart: 0,
    selectedLevelEnd: 50,
    maxLevel: 50,

    async render() {
        const container = document.createElement('div');
        container.className = 'study-page page-enter';

        // Get user's max unlocked level
        try {
            const levelProgress = await DB.progress.getLevelProgress(Auth.user.id);
            const completedLevels = levelProgress.filter(p => p.is_completed).length;
            this.maxLevel = (completedLevels + 1) * CONFIG.WORDS_PER_LEVEL;
        } catch (e) {
            this.maxLevel = CONFIG.WORDS_PER_LEVEL;
        }

        container.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">Calisma Alani</h1>
                <p class="page-subtitle">Bilgini test et ve pratik yap</p>
            </div>

            <div class="study-options" id="study-options">
                <div class="study-option-card" data-type="multiple-choice">
                    <div class="study-option-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 11l3 3L22 4"/>
                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                        </svg>
                    </div>
                    <h3 class="study-option-title">Coktan Secmeli Test</h3>
                    <p class="study-option-desc">Ogrendigin kelimeleri 4 secenekli sorularla test et</p>
                </div>

                <div class="study-option-card" data-type="translation">
                    <div class="study-option-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M5 8l6 6"/>
                            <path d="M4 14l6-6 2-3"/>
                            <path d="M2 5h12"/>
                            <path d="M7 2h1"/>
                            <path d="M22 22l-5-10-5 10"/>
                            <path d="M14 18h6"/>
                        </svg>
                    </div>
                    <h3 class="study-option-title">Cumle Cevirisi</h3>
                    <p class="study-option-desc">Cumleleri cevirererek yazma pratigi yap</p>
                </div>
            </div>

            <!-- Test Setup (Hidden by default) -->
            <div id="test-setup" class="test-setup hidden">
                <button class="btn btn-ghost" id="back-to-options" style="margin-bottom: var(--spacing-lg);">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                    Geri
                </button>

                <div id="setup-content"></div>
            </div>

            <!-- Test Container (Hidden by default) -->
            <div id="test-container" class="hidden"></div>
        `;

        this.setupEventListeners(container);
        return container;
    },

    setupEventListeners(container) {
        // Study option cards
        container.querySelectorAll('.study-option-card').forEach(card => {
            card.addEventListener('click', () => {
                const type = card.dataset.type;
                this.showSetup(container, type);
            });
        });

        // Back to options
        container.querySelector('#back-to-options').addEventListener('click', () => {
            this.hideSetup(container);
        });
    },

    showSetup(container, type) {
        const optionsEl = container.querySelector('#study-options');
        const setupEl = container.querySelector('#test-setup');
        const setupContent = container.querySelector('#setup-content');

        optionsEl.classList.add('hidden');
        setupEl.classList.remove('hidden');

        if (type === 'multiple-choice') {
            setupContent.innerHTML = this.renderMultipleChoiceSetup();
            this.setupMultipleChoiceEvents(container);
        } else if (type === 'translation') {
            setupContent.innerHTML = this.renderTranslationSetup();
            this.setupTranslationEvents(container);
        }
    },

    hideSetup(container) {
        const optionsEl = container.querySelector('#study-options');
        const setupEl = container.querySelector('#test-setup');
        const testContainer = container.querySelector('#test-container');

        optionsEl.classList.remove('hidden');
        setupEl.classList.add('hidden');
        testContainer.classList.add('hidden');
        testContainer.innerHTML = '';
    },

    renderMultipleChoiceSetup() {
        return `
            <h2 style="margin-bottom: var(--spacing-xl);">Coktan Secmeli Test Ayarlari</h2>

            <div class="test-setup-section">
                <h3 class="test-setup-title">Seviye Araligi</h3>
                <div class="level-selector">
                    <div class="number-picker">
                        <div class="number-picker-wheel">
                            <button class="number-picker-btn up" data-picker="start" data-dir="up">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="18 15 12 9 6 15"/>
                                </svg>
                            </button>
                            <div class="number-picker-highlight"></div>
                            <div class="number-picker-value" id="level-start">0</div>
                            <button class="number-picker-btn down" data-picker="start" data-dir="down">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="6 9 12 15 18 9"/>
                                </svg>
                            </button>
                        </div>
                        <span class="number-picker-separator">-</span>
                        <div class="number-picker-wheel">
                            <button class="number-picker-btn up" data-picker="end" data-dir="up">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="18 15 12 9 6 15"/>
                                </svg>
                            </button>
                            <div class="number-picker-highlight"></div>
                            <div class="number-picker-value" id="level-end">${Math.min(50, this.maxLevel)}</div>
                            <button class="number-picker-btn down" data-picker="end" data-dir="down">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="6 9 12 15 18 9"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="test-setup-section">
                <h3 class="test-setup-title">Soru Kategorileri</h3>
                <div class="category-options">
                    <label class="checkbox-custom">
                        <input type="checkbox" name="category" value="word_to_meaning" checked>
                        <span class="checkmark"></span>
                        <span>Kelimeden Anlama</span>
                    </label>
                    <label class="checkbox-custom">
                        <input type="checkbox" name="category" value="meaning_to_word" checked>
                        <span class="checkmark"></span>
                        <span>Anlamdan Kelimeye</span>
                    </label>
                    <label class="checkbox-custom">
                        <input type="checkbox" name="category" value="memory_to_word">
                        <span class="checkmark"></span>
                        <span>Hafiza Metninden Kelimeye</span>
                    </label>
                </div>
            </div>

            <div class="test-setup-section">
                <h3 class="test-setup-title">Soru Sayisi</h3>
                <div class="option-row">
                    <label class="radio-custom">
                        <input type="radio" name="question-count" value="5">
                        <span class="radiomark"></span>
                        <span>5</span>
                    </label>
                    <label class="radio-custom">
                        <input type="radio" name="question-count" value="10" checked>
                        <span class="radiomark"></span>
                        <span>10</span>
                    </label>
                    <label class="radio-custom">
                        <input type="radio" name="question-count" value="20">
                        <span class="radiomark"></span>
                        <span>20</span>
                    </label>
                </div>
            </div>

            <button class="btn btn-primary btn-block btn-lg" id="start-mc-test" style="margin-top: var(--spacing-xl);">
                Teste Basla
            </button>
        `;
    },

    setupMultipleChoiceEvents(container) {
        this.selectedLevelStart = 0;
        this.selectedLevelEnd = Math.min(50, this.maxLevel);

        // Number picker controls
        container.querySelectorAll('.number-picker-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const picker = btn.dataset.picker;
                const dir = btn.dataset.dir;
                this.adjustLevel(container, picker, dir);
            });
        });

        // Start test button
        container.querySelector('#start-mc-test').addEventListener('click', () => {
            this.startMultipleChoiceTest(container);
        });
    },

    adjustLevel(container, picker, direction) {
        const step = CONFIG.WORDS_PER_LEVEL;
        const el = container.querySelector(picker === 'start' ? '#level-start' : '#level-end');

        if (picker === 'start') {
            if (direction === 'up' && this.selectedLevelStart + step < this.selectedLevelEnd) {
                this.selectedLevelStart += step;
            } else if (direction === 'down' && this.selectedLevelStart - step >= 0) {
                this.selectedLevelStart -= step;
            }
            el.textContent = this.selectedLevelStart;
        } else {
            if (direction === 'up' && this.selectedLevelEnd + step <= this.maxLevel) {
                this.selectedLevelEnd += step;
            } else if (direction === 'down' && this.selectedLevelEnd - step > this.selectedLevelStart) {
                this.selectedLevelEnd -= step;
            }
            el.textContent = this.selectedLevelEnd;
        }
    },

    async startMultipleChoiceTest(container) {
        // Get selected options
        const categories = Array.from(container.querySelectorAll('input[name="category"]:checked'))
            .map(c => c.value);

        if (categories.length === 0) {
            Toast.warning('En az bir kategori secin');
            return;
        }

        const questionCount = parseInt(container.querySelector('input[name="question-count"]:checked').value);

        // Get words from selected levels
        const startLevel = Math.floor(this.selectedLevelStart / CONFIG.WORDS_PER_LEVEL) + 1;
        const endLevel = Math.floor(this.selectedLevelEnd / CONFIG.WORDS_PER_LEVEL);

        let words;
        try {
            words = await DB.levels.getWordsInRange(startLevel, endLevel);
        } catch (error) {
            Toast.error('Kelimeler yuklenemedi');
            return;
        }

        if (words.length < 4) {
            Toast.warning('Yeterli kelime yok. Daha genis bir aralik secin.');
            return;
        }

        // Generate questions
        const questions = Test.generateQuestions(words, categories, Math.min(questionCount, words.length));

        // Hide setup, show test
        container.querySelector('#test-setup').classList.add('hidden');
        const testContainer = container.querySelector('#test-container');
        testContainer.classList.remove('hidden');

        // Start test
        const settings = {
            categories,
            questionCount,
            levelRange: [this.selectedLevelStart, this.selectedLevelEnd],
            timed: false
        };

        const testElement = Test.start(questions, settings, (event) => {
            this.handleTestEvent(container, event);
        });

        testContainer.innerHTML = '';
        testContainer.appendChild(testElement);

        // Track study time
        Storage.startStudySession();
    },

    handleTestEvent(container, event) {
        const testContainer = container.querySelector('#test-container');

        if (event.type === 'next') {
            testContainer.innerHTML = '';
            testContainer.appendChild(event.element);
        } else if (event.type === 'complete') {
            this.showTestResults(container, event.results);
        }
    },

    async showTestResults(container, results) {
        const testContainer = container.querySelector('#test-container');

        // Save results and update points
        try {
            await DB.tests.saveResult(Auth.user.id, {
                type: 'multiple_choice',
                category: results.settings.categories.join(','),
                totalQuestions: results.totalQuestions,
                correctAnswers: results.correctAnswers,
                points: results.netPoints
            });

            await Auth.addPoints(results.netPoints);
            await DB.stats.update(Auth.user.id, { tests: 1 });

            // End study session
            const studyTime = Storage.endStudySession();
            await Auth.updateStudyTime(studyTime);
        } catch (error) {
            console.error('Failed to save results:', error);
        }

        // Render results
        const resultsElement = Test.renderResults(results);
        testContainer.innerHTML = '';
        testContainer.appendChild(resultsElement);

        // Setup result buttons
        resultsElement.querySelector('#retry-test').addEventListener('click', () => {
            testContainer.classList.add('hidden');
            container.querySelector('#test-setup').classList.remove('hidden');
        });

        resultsElement.querySelector('#back-to-study').addEventListener('click', () => {
            this.hideSetup(container);
        });
    },

    renderTranslationSetup() {
        return `
            <h2 style="margin-bottom: var(--spacing-xl);">Cumle Cevirisi Ayarlari</h2>

            <div class="test-setup-section">
                <h3 class="test-setup-title">Ceviri Yonu</h3>
                <div class="option-row">
                    <label class="radio-custom">
                        <input type="radio" name="direction" value="tr_to_en" checked>
                        <span class="radiomark"></span>
                        <span>Turkce → Ingilizce</span>
                    </label>
                    <label class="radio-custom">
                        <input type="radio" name="direction" value="en_to_tr">
                        <span class="radiomark"></span>
                        <span>Ingilizce → Turkce</span>
                    </label>
                </div>
            </div>

            <div class="test-setup-section">
                <h3 class="test-setup-title">Zorluk</h3>
                <div class="option-row">
                    <label class="radio-custom">
                        <input type="radio" name="difficulty" value="easy">
                        <span class="radiomark"></span>
                        <span>Kolay (+10)</span>
                    </label>
                    <label class="radio-custom">
                        <input type="radio" name="difficulty" value="medium" checked>
                        <span class="radiomark"></span>
                        <span>Orta (+15)</span>
                    </label>
                    <label class="radio-custom">
                        <input type="radio" name="difficulty" value="hard">
                        <span class="radiomark"></span>
                        <span>Zor (+20)</span>
                    </label>
                </div>
            </div>

            <div class="test-setup-section">
                <h3 class="test-setup-title">Soru Sayisi</h3>
                <div class="option-row">
                    <label class="radio-custom">
                        <input type="radio" name="tr-count" value="5">
                        <span class="radiomark"></span>
                        <span>5</span>
                    </label>
                    <label class="radio-custom">
                        <input type="radio" name="tr-count" value="10" checked>
                        <span class="radiomark"></span>
                        <span>10</span>
                    </label>
                    <label class="radio-custom">
                        <input type="radio" name="tr-count" value="20">
                        <span class="radiomark"></span>
                        <span>20</span>
                    </label>
                </div>
            </div>

            <button class="btn btn-primary btn-block btn-lg" id="start-translation" style="margin-top: var(--spacing-xl);">
                Baslat
            </button>
        `;
    },

    setupTranslationEvents(container) {
        container.querySelector('#start-translation').addEventListener('click', () => {
            this.startTranslationTest(container);
        });
    },

    async startTranslationTest(container) {
        const direction = container.querySelector('input[name="direction"]:checked').value;
        const difficulty = container.querySelector('input[name="difficulty"]:checked').value;
        const count = parseInt(container.querySelector('input[name="tr-count"]:checked').value);

        // Get sentences
        let sentences;
        try {
            sentences = await DB.sentences.getRandom(difficulty, count);
        } catch (error) {
            Toast.error('Cumleler yuklenemedi');
            return;
        }

        if (sentences.length === 0) {
            Toast.warning('Bu zorlukta cumle bulunamadi');
            return;
        }

        // Hide setup, show test
        container.querySelector('#test-setup').classList.add('hidden');
        const testContainer = container.querySelector('#test-container');
        testContainer.classList.remove('hidden');

        // Start test
        const settings = { direction, difficulty, count };
        const testElement = TranslationTest.start(sentences, settings, (event) => {
            this.handleTranslationEvent(container, event);
        });

        testContainer.innerHTML = '';
        testContainer.appendChild(testElement);

        Storage.startStudySession();
    },

    handleTranslationEvent(container, event) {
        const testContainer = container.querySelector('#test-container');

        if (event.type === 'next') {
            testContainer.innerHTML = '';
            testContainer.appendChild(event.element);
        } else if (event.type === 'complete') {
            this.showTranslationResults(container, event.results);
        }
    },

    async showTranslationResults(container, results) {
        const testContainer = container.querySelector('#test-container');

        try {
            await DB.tests.saveResult(Auth.user.id, {
                type: 'translation',
                difficulty: results.settings.difficulty,
                totalQuestions: results.totalQuestions,
                correctAnswers: results.correctAnswers,
                points: results.netPoints
            });

            await Auth.addPoints(results.netPoints);
            await DB.stats.update(Auth.user.id, { tests: 1 });

            const studyTime = Storage.endStudySession();
            await Auth.updateStudyTime(studyTime);
        } catch (error) {
            console.error('Failed to save results:', error);
        }

        const resultsElement = TranslationTest.renderResults(results);
        testContainer.innerHTML = '';
        testContainer.appendChild(resultsElement);

        resultsElement.querySelector('#retry-translation').addEventListener('click', () => {
            testContainer.classList.add('hidden');
            container.querySelector('#test-setup').classList.remove('hidden');
        });

        resultsElement.querySelector('#back-to-study').addEventListener('click', () => {
            this.hideSetup(container);
        });
    },

    cleanup() {
        Test.reset();
        TranslationTest.reset();
    }
};

window.StudyPage = StudyPage;
