// VocabMaster Pro - Test Component

const Test = {
    currentQuestion: 0,
    questions: [],
    answers: [],
    correctCount: 0,
    timer: null,
    timeRemaining: 0,
    onComplete: null,
    settings: null,

    // Generate multiple choice questions
    generateQuestions(words, categories, count) {
        const questions = [];
        const shuffledWords = Helpers.shuffleArray(words);
        const selectedWords = shuffledWords.slice(0, count);

        selectedWords.forEach(word => {
            // Pick random category from selected categories
            const category = categories[Math.floor(Math.random() * categories.length)];

            const question = this.createQuestion(word, words, category);
            questions.push(question);
        });

        return Helpers.shuffleArray(questions);
    },

    createQuestion(word, allWords, category) {
        let questionText, correctAnswer, options;

        // Get 3 wrong answers from other words
        const otherWords = allWords.filter(w => w.id !== word.id);
        const wrongAnswers = Helpers.getRandomItems(otherWords, 3);

        switch (category) {
            case 'word_to_meaning':
                questionText = word.english_word;
                correctAnswer = word.turkish_meaning;
                options = [
                    word.turkish_meaning,
                    ...wrongAnswers.map(w => w.turkish_meaning)
                ];
                break;

            case 'meaning_to_word':
                questionText = word.turkish_meaning;
                correctAnswer = word.english_word;
                options = [
                    word.english_word,
                    ...wrongAnswers.map(w => w.english_word)
                ];
                break;

            case 'memory_to_word':
                questionText = word.memory_sentence || word.turkish_meaning;
                correctAnswer = word.english_word;
                options = [
                    word.english_word,
                    ...wrongAnswers.map(w => w.english_word)
                ];
                break;

            default:
                questionText = word.english_word;
                correctAnswer = word.turkish_meaning;
                options = [
                    word.turkish_meaning,
                    ...wrongAnswers.map(w => w.turkish_meaning)
                ];
        }

        return {
            id: word.id,
            word: word,
            category,
            question: questionText,
            correct: correctAnswer,
            options: Helpers.shuffleArray(options)
        };
    },

    // Start a test
    start(questions, settings, onComplete) {
        this.questions = questions;
        this.settings = settings;
        this.onComplete = onComplete;
        this.currentQuestion = 0;
        this.answers = [];
        this.correctCount = 0;

        return this.renderQuestion();
    },

    renderQuestion() {
        const q = this.questions[this.currentQuestion];
        if (!q) return this.finish();

        const categoryLabels = {
            'word_to_meaning': 'Bu kelimenin anlami nedir?',
            'meaning_to_word': 'Bu anlamin Ingilizcesi nedir?',
            'memory_to_word': 'Bu cumledeki kelime hangisi?'
        };

        const container = document.createElement('div');
        container.className = 'test-container animate-fade-in';
        container.innerHTML = `
            <div class="test-header">
                <span class="test-progress-text">Soru ${this.currentQuestion + 1}/${this.questions.length}</span>
                ${this.settings.timed ? `
                    <div class="test-timer" id="test-timer">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                        </svg>
                        <span id="timer-value">${this.settings.timePerQuestion || CONFIG.TEST_QUESTION_TIME}s</span>
                    </div>
                ` : ''}
            </div>
            <div class="progress">
                <div class="progress-bar" style="width: ${((this.currentQuestion) / this.questions.length) * 100}%"></div>
            </div>
            <div class="test-question">
                <div class="test-question-label">${categoryLabels[q.category]}</div>
                <div class="test-question-text">${Helpers.escapeHtml(q.question)}</div>
            </div>
            <div class="test-options" id="test-options">
                ${q.options.map((option, i) => `
                    <button class="test-option" data-index="${i}" data-value="${Helpers.escapeHtml(option)}">
                        ${String.fromCharCode(65 + i)}) ${Helpers.escapeHtml(option)}
                    </button>
                `).join('')}
            </div>
            <div id="test-feedback" class="test-feedback hidden"></div>
        `;

        // Setup option click handlers
        const optionsContainer = container.querySelector('#test-options');
        optionsContainer.querySelectorAll('.test-option').forEach(btn => {
            btn.addEventListener('click', () => this.selectAnswer(btn, q));
        });

        // Start timer if timed
        if (this.settings.timed) {
            this.startTimer(container);
        }

        return container;
    },

    startTimer(container) {
        this.timeRemaining = this.settings.timePerQuestion || CONFIG.TEST_QUESTION_TIME;
        const timerEl = container.querySelector('#timer-value');
        const timerContainer = container.querySelector('#test-timer');

        if (this.timer) clearInterval(this.timer);

        this.timer = setInterval(() => {
            this.timeRemaining--;
            timerEl.textContent = `${this.timeRemaining}s`;

            if (this.timeRemaining <= 5) {
                timerContainer.classList.add('warning');
            }

            if (this.timeRemaining <= 0) {
                clearInterval(this.timer);
                this.timeout();
            }
        }, 1000);
    },

    timeout() {
        const q = this.questions[this.currentQuestion];
        this.answers.push({
            questionId: q.id,
            selected: null,
            correct: q.correct,
            isCorrect: false,
            timedOut: true
        });

        this.showFeedback(false, q.correct, true);
    },

    selectAnswer(btn, question) {
        if (this.timer) clearInterval(this.timer);

        // Disable all options
        document.querySelectorAll('.test-option').forEach(opt => {
            opt.disabled = true;
        });

        const selected = btn.getAttribute('data-value');
        const isCorrect = selected === question.correct;

        // Mark selected answer
        btn.classList.add(isCorrect ? 'correct' : 'incorrect');

        // Show correct answer if wrong
        if (!isCorrect) {
            document.querySelectorAll('.test-option').forEach(opt => {
                if (opt.getAttribute('data-value') === question.correct) {
                    opt.classList.add('correct');
                }
            });
        }

        // Record answer
        this.answers.push({
            questionId: question.id,
            selected,
            correct: question.correct,
            isCorrect
        });

        if (isCorrect) {
            this.correctCount++;
        }

        this.showFeedback(isCorrect, question.correct);
    },

    showFeedback(isCorrect, correctAnswer, timedOut = false) {
        const feedback = document.getElementById('test-feedback');
        feedback.classList.remove('hidden');
        feedback.classList.add(isCorrect ? 'correct' : 'incorrect');

        if (timedOut) {
            feedback.innerHTML = `
                <div class="test-feedback-icon">⏰</div>
                <div>Sure doldu! Dogru cevap: <strong>${Helpers.escapeHtml(correctAnswer)}</strong></div>
            `;
        } else if (isCorrect) {
            feedback.innerHTML = `
                <div class="test-feedback-icon">✓</div>
                <div>Dogru!</div>
            `;
            Flashcard.showPoints(CONFIG.POINTS.TEST_CORRECT, true);
        } else {
            feedback.innerHTML = `
                <div class="test-feedback-icon">✗</div>
                <div>Yanlis! Dogru cevap: <strong>${Helpers.escapeHtml(correctAnswer)}</strong></div>
            `;
            Flashcard.showPoints(CONFIG.POINTS.TEST_INCORRECT, false);
        }

        // Auto advance after delay
        setTimeout(() => {
            this.nextQuestion();
        }, 1500);
    },

    nextQuestion() {
        this.currentQuestion++;

        if (this.currentQuestion >= this.questions.length) {
            this.finish();
        } else {
            // Trigger re-render through callback
            if (this.onComplete) {
                const container = this.renderQuestion();
                this.onComplete({ type: 'next', element: container });
            }
        }
    },

    finish() {
        if (this.timer) clearInterval(this.timer);

        const results = this.calculateResults();

        if (this.onComplete) {
            this.onComplete({ type: 'complete', results });
        }

        return results;
    },

    calculateResults() {
        const totalQuestions = this.questions.length;
        const correctAnswers = this.correctCount;
        const incorrectAnswers = totalQuestions - correctAnswers;
        const successRate = Helpers.percentage(correctAnswers, totalQuestions);

        // Calculate points
        const pointsEarned = correctAnswers * CONFIG.POINTS.TEST_CORRECT;
        const pointsLost = incorrectAnswers * Math.abs(CONFIG.POINTS.TEST_INCORRECT);
        const netPoints = pointsEarned + (incorrectAnswers * CONFIG.POINTS.TEST_INCORRECT);

        return {
            totalQuestions,
            correctAnswers,
            incorrectAnswers,
            successRate,
            pointsEarned,
            pointsLost,
            netPoints,
            answers: this.answers,
            settings: this.settings
        };
    },

    // Render results page
    renderResults(results) {
        const container = document.createElement('div');
        container.className = 'test-results animate-bounce-in';

        const emoji = results.successRate >= 80 ? '🎉' :
            results.successRate >= 60 ? '👍' :
                results.successRate >= 40 ? '💪' : '📚';

        container.innerHTML = `
            <div class="test-results-icon">${emoji}</div>
            <h2>Test Tamamlandi!</h2>
            <div class="test-results-score">%${results.successRate}</div>
            <div class="test-results-stats">
                <div class="stat-card">
                    <div class="stat-value" style="color: var(--success)">${results.correctAnswers}</div>
                    <div class="stat-label">Dogru</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" style="color: var(--error)">${results.incorrectAnswers}</div>
                    <div class="stat-label">Yanlis</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" style="color: var(--success)">+${results.pointsEarned}</div>
                    <div class="stat-label">Kazanilan</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" style="color: var(--error)">-${results.pointsLost}</div>
                    <div class="stat-label">Kaybedilen</div>
                </div>
            </div>
            <div style="font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); margin-bottom: var(--spacing-xl);">
                Net Puan: <span style="color: ${results.netPoints >= 0 ? 'var(--success)' : 'var(--error)'}">
                    ${results.netPoints >= 0 ? '+' : ''}${results.netPoints}
                </span>
            </div>
            <div class="test-results-actions">
                <button class="btn btn-primary btn-block" id="retry-test">Tekrar Dene</button>
                <button class="btn btn-secondary btn-block" id="back-to-study">Calisma Alanina Don</button>
            </div>
        `;

        // Celebrate if good score
        if (results.successRate >= 80) {
            Flashcard.celebrate();
        }

        return container;
    },

    reset() {
        if (this.timer) clearInterval(this.timer);
        this.currentQuestion = 0;
        this.questions = [];
        this.answers = [];
        this.correctCount = 0;
        this.timeRemaining = 0;
        this.onComplete = null;
        this.settings = null;
    }
};

// Translation Test Component
const TranslationTest = {
    currentQuestion: 0,
    sentences: [],
    answers: [],
    correctCount: 0,
    settings: null,
    onComplete: null,

    start(sentences, settings, onComplete) {
        this.sentences = sentences;
        this.settings = settings;
        this.onComplete = onComplete;
        this.currentQuestion = 0;
        this.answers = [];
        this.correctCount = 0;

        return this.renderQuestion();
    },

    renderQuestion() {
        const s = this.sentences[this.currentQuestion];
        if (!s) return this.finish();

        const isToEnglish = this.settings.direction === 'tr_to_en';
        const sourceText = isToEnglish ? s.turkish_sentence : s.english_sentence;
        const targetLang = isToEnglish ? 'Ingilizce' : 'Turkce';

        const container = document.createElement('div');
        container.className = 'translation-container animate-fade-in';
        container.innerHTML = `
            <div class="test-header">
                <span class="test-progress-text">Soru ${this.currentQuestion + 1}/${this.sentences.length}</span>
            </div>
            <div class="progress">
                <div class="progress-bar" style="width: ${((this.currentQuestion) / this.sentences.length) * 100}%"></div>
            </div>
            <div class="translation-source">
                <div class="translation-label">${isToEnglish ? 'Turkce' : 'Ingilizce'}</div>
                <div class="translation-text">${Helpers.escapeHtml(sourceText)}</div>
            </div>
            <div class="translation-input-wrapper">
                <textarea
                    class="translation-input form-input"
                    placeholder="${targetLang} cevirisini yazin..."
                    id="translation-input"
                ></textarea>
            </div>
            <div id="translation-result" class="translation-result hidden"></div>
            <button class="btn btn-primary btn-block" id="check-translation">Kontrol Et</button>
        `;

        // Setup check button
        container.querySelector('#check-translation').addEventListener('click', () => {
            this.checkAnswer(s);
        });

        // Enter key to submit (with Shift for new line)
        container.querySelector('#translation-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.checkAnswer(s);
            }
        });

        return container;
    },

    checkAnswer(sentence) {
        const input = document.getElementById('translation-input');
        const checkBtn = document.getElementById('check-translation');
        const resultDiv = document.getElementById('translation-result');

        const userAnswer = input.value.trim();
        if (!userAnswer) {
            Toast.warning('Lutfen bir ceviri yazin');
            return;
        }

        // Disable input and button
        input.disabled = true;
        checkBtn.disabled = true;

        const isToEnglish = this.settings.direction === 'tr_to_en';
        const correctAnswer = isToEnglish ? sentence.english_sentence : sentence.turkish_sentence;

        // Compare words
        const comparison = Helpers.compareWords(userAnswer, correctAnswer);
        const isCorrect = comparison.every(w => w.correct);

        // Record answer
        this.answers.push({
            sentenceId: sentence.id,
            userAnswer,
            correctAnswer,
            isCorrect,
            comparison
        });

        if (isCorrect) {
            this.correctCount++;
        }

        // Show result
        resultDiv.classList.remove('hidden');
        resultDiv.classList.add(isCorrect ? 'correct' : 'incorrect');

        if (isCorrect) {
            resultDiv.innerHTML = `
                <div style="color: var(--success); font-weight: var(--font-weight-semibold);">
                    ✓ Dogru!
                </div>
            `;

            // Points based on difficulty
            const points = this.settings.difficulty === 'easy' ? CONFIG.POINTS.TRANSLATION_EASY :
                this.settings.difficulty === 'hard' ? CONFIG.POINTS.TRANSLATION_HARD :
                    CONFIG.POINTS.TRANSLATION_MEDIUM;

            Flashcard.showPoints(points, true);
        } else {
            // Show word-by-word comparison
            const comparisonHtml = comparison.map(w => {
                if (w.correct) {
                    return `<span class="word-correct">${Helpers.escapeHtml(w.word)}</span>`;
                } else if (w.missing) {
                    return `<span class="word-incorrect" style="text-decoration: line-through; opacity: 0.5">[eksik: ${Helpers.escapeHtml(w.word)}]</span>`;
                } else if (w.extra) {
                    return `<span class="word-incorrect" style="text-decoration: line-through">${Helpers.escapeHtml(w.word)}</span>`;
                } else {
                    return `<span class="word-incorrect" data-correct="${Helpers.escapeHtml(w.expected)}">${Helpers.escapeHtml(w.word)}</span>`;
                }
            }).join(' ');

            resultDiv.innerHTML = `
                <div style="margin-bottom: var(--spacing-md);">
                    <strong>Sizin ceviriniz:</strong>
                    <div class="word-comparison" style="margin-top: var(--spacing-sm);">${comparisonHtml}</div>
                </div>
                <div>
                    <strong>Dogru cevap:</strong>
                    <div style="color: var(--success); margin-top: var(--spacing-sm);">${Helpers.escapeHtml(correctAnswer)}</div>
                </div>
            `;
        }

        // Change button to next
        checkBtn.textContent = this.currentQuestion < this.sentences.length - 1 ? 'Sonraki Soru' : 'Bitir';
        checkBtn.disabled = false;
        checkBtn.onclick = () => this.nextQuestion();
    },

    nextQuestion() {
        this.currentQuestion++;

        if (this.currentQuestion >= this.sentences.length) {
            this.finish();
        } else {
            if (this.onComplete) {
                const container = this.renderQuestion();
                this.onComplete({ type: 'next', element: container });
            }
        }
    },

    finish() {
        const results = this.calculateResults();

        if (this.onComplete) {
            this.onComplete({ type: 'complete', results });
        }

        return results;
    },

    calculateResults() {
        const totalQuestions = this.sentences.length;
        const correctAnswers = this.correctCount;
        const successRate = Helpers.percentage(correctAnswers, totalQuestions);

        // Calculate points based on difficulty
        const pointsPerCorrect = this.settings.difficulty === 'easy' ? CONFIG.POINTS.TRANSLATION_EASY :
            this.settings.difficulty === 'hard' ? CONFIG.POINTS.TRANSLATION_HARD :
                CONFIG.POINTS.TRANSLATION_MEDIUM;

        const pointsEarned = correctAnswers * pointsPerCorrect;

        return {
            totalQuestions,
            correctAnswers,
            incorrectAnswers: totalQuestions - correctAnswers,
            successRate,
            pointsEarned,
            netPoints: pointsEarned, // No penalty for wrong answers
            answers: this.answers,
            settings: this.settings
        };
    },

    renderResults(results) {
        const container = document.createElement('div');
        container.className = 'test-results animate-bounce-in';

        const emoji = results.successRate >= 80 ? '🎉' :
            results.successRate >= 60 ? '👍' :
                results.successRate >= 40 ? '💪' : '📚';

        container.innerHTML = `
            <div class="test-results-icon">${emoji}</div>
            <h2>Ceviri Tamamlandi!</h2>
            <div class="test-results-score">%${results.successRate}</div>
            <div class="test-results-stats">
                <div class="stat-card">
                    <div class="stat-value" style="color: var(--success)">${results.correctAnswers}</div>
                    <div class="stat-label">Dogru</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" style="color: var(--error)">${results.incorrectAnswers}</div>
                    <div class="stat-label">Yanlis</div>
                </div>
            </div>
            <div style="font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); margin-bottom: var(--spacing-xl);">
                Kazanilan Puan: <span style="color: var(--success)">+${results.pointsEarned}</span>
            </div>
            <div class="test-results-actions">
                <button class="btn btn-primary btn-block" id="retry-translation">Tekrar Dene</button>
                <button class="btn btn-secondary btn-block" id="back-to-study">Calisma Alanina Don</button>
            </div>
        `;

        if (results.successRate >= 80) {
            Flashcard.celebrate();
        }

        return container;
    },

    reset() {
        this.currentQuestion = 0;
        this.sentences = [];
        this.answers = [];
        this.correctCount = 0;
        this.settings = null;
        this.onComplete = null;
    }
};

// Make globally available
window.Test = Test;
window.TranslationTest = TranslationTest;
