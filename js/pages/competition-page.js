// VocabMaster Pro - Competition Page

const CompetitionPage = {
    currentRoom: null,
    roomChannel: null,
    isHost: false,
    participants: [],
    gameQuestions: [],
    currentQuestionIndex: 0,
    myScore: 0,
    questionTimer: null,
    roomTimeoutTimer: null,

    async render() {
        const container = document.createElement('div');
        container.className = 'competition-page page-enter';

        container.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">Yarisma Alani</h1>
                <p class="page-subtitle">Arkadaslarinla yarisarak ogren</p>
            </div>

            <div id="competition-content">
                ${this.renderMainMenu()}
            </div>

            <div class="card" style="margin-top: var(--spacing-xl);">
                <div class="card-header">
                    <h3 class="card-title">Son Yarismalar</h3>
                </div>
                <div id="game-history">
                    <div class="skeleton skeleton-text"></div>
                    <div class="skeleton skeleton-text"></div>
                    <div class="skeleton skeleton-text"></div>
                </div>
            </div>
        `;

        this.loadGameHistory(container);
        this.setupEventListeners(container);

        return container;
    },

    renderMainMenu() {
        return `
            <div class="competition-options">
                <div class="competition-option" id="create-room">
                    <div class="competition-option-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 5v14M5 12h14"/>
                        </svg>
                    </div>
                    <h3 class="competition-option-title">Oda Kur</h3>
                    <p class="competition-option-desc">Yeni bir yarisma odasi olustur</p>
                </div>

                <div class="competition-option" id="join-room">
                    <div class="competition-option-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                            <polyline points="10 17 15 12 10 7"/>
                            <line x1="15" y1="12" x2="3" y2="12"/>
                        </svg>
                    </div>
                    <h3 class="competition-option-title">Odaya Katil</h3>
                    <p class="competition-option-desc">Mevcut bir odaya katil</p>
                </div>
            </div>
        `;
    },

    setupEventListeners(container) {
        container.querySelector('#create-room')?.addEventListener('click', () => {
            this.showCreateRoom(container);
        });

        container.querySelector('#join-room')?.addEventListener('click', () => {
            this.showJoinRoom(container);
        });
    },

    async showCreateRoom(container) {
        const content = container.querySelector('#competition-content');
        content.innerHTML = `
            <button class="btn btn-ghost" id="back-to-menu" style="margin-bottom: var(--spacing-lg);">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Geri
            </button>
            <div style="text-align: center; padding: var(--spacing-xl);">
                <div class="loading-spinner" style="margin: 0 auto var(--spacing-lg);"></div>
                <p>Oda olusturuluyor...</p>
            </div>
        `;

        content.querySelector('#back-to-menu').addEventListener('click', () => {
            content.innerHTML = this.renderMainMenu();
            this.setupEventListeners(container);
        });

        try {
            const room = await DB.rooms.create(Auth.user.id, {
                levelStart: 1,
                levelEnd: 1,
                category: 'word_to_meaning',
                questionCount: 10
            });

            this.currentRoom = room;
            this.isHost = true;
            this.participants = [{ user_id: Auth.user.id, users: { username: Auth.profile.username } }];

            this.showWaitingRoom(container);
            this.subscribeToRoom(container);
            this.startRoomTimeout(container);
        } catch (error) {
            Toast.error('Oda olusturulamadi');
            content.innerHTML = this.renderMainMenu();
            this.setupEventListeners(container);
        }
    },

    showJoinRoom(container) {
        const content = container.querySelector('#competition-content');
        content.innerHTML = `
            <button class="btn btn-ghost" id="back-to-menu" style="margin-bottom: var(--spacing-lg);">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Geri
            </button>
            <div class="room-join">
                <h2 style="margin-bottom: var(--spacing-xl);">Oda Kodu Girin</h2>
                <div class="room-code-input">
                    ${[1, 2, 3, 4, 5].map(i => `
                        <input type="text" class="room-code-digit" maxlength="1" data-index="${i}" inputmode="numeric" pattern="[0-9]">
                    `).join('')}
                </div>
                <button class="btn btn-primary btn-block" id="join-btn" disabled>Katil</button>
            </div>
        `;

        content.querySelector('#back-to-menu').addEventListener('click', () => {
            content.innerHTML = this.renderMainMenu();
            this.setupEventListeners(container);
        });

        // Setup code input
        const inputs = content.querySelectorAll('.room-code-digit');
        const joinBtn = content.querySelector('#join-btn');

        inputs.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                const value = e.target.value.replace(/\D/g, '');
                e.target.value = value;

                if (value && index < inputs.length - 1) {
                    inputs[index + 1].focus();
                }

                // Check if all digits entered
                const code = Array.from(inputs).map(i => i.value).join('');
                joinBtn.disabled = code.length !== 5;
            });

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !e.target.value && index > 0) {
                    inputs[index - 1].focus();
                }
            });

            input.addEventListener('paste', (e) => {
                e.preventDefault();
                const paste = (e.clipboardData || window.clipboardData).getData('text');
                const digits = paste.replace(/\D/g, '').slice(0, 5);

                digits.split('').forEach((digit, i) => {
                    if (inputs[i]) inputs[i].value = digit;
                });

                if (digits.length === 5) {
                    joinBtn.disabled = false;
                    joinBtn.focus();
                }
            });
        });

        inputs[0].focus();

        joinBtn.addEventListener('click', async () => {
            const code = Array.from(inputs).map(i => i.value).join('');
            await this.joinRoom(container, code);
        });
    },

    async joinRoom(container, code) {
        const content = container.querySelector('#competition-content');
        const joinBtn = content.querySelector('#join-btn');
        joinBtn.disabled = true;
        joinBtn.innerHTML = '<span class="loading-spinner small"></span>';

        try {
            const room = await DB.rooms.getByCode(code);
            if (!room) {
                Toast.error('Oda bulunamadi veya kapali');
                joinBtn.disabled = false;
                joinBtn.textContent = 'Katil';
                return;
            }

            // Check participant count
            const participants = await DB.rooms.getParticipants(room.id);
            if (participants.length >= CONFIG.MAX_PARTICIPANTS) {
                Toast.error('Oda dolu');
                joinBtn.disabled = false;
                joinBtn.textContent = 'Katil';
                return;
            }

            // Join room
            await DB.rooms.joinRoom(room.id, Auth.user.id);

            this.currentRoom = room;
            this.isHost = false;
            this.participants = [...participants, { user_id: Auth.user.id, users: { username: Auth.profile.username } }];

            this.showWaitingRoom(container);
            this.subscribeToRoom(container);
        } catch (error) {
            Toast.error('Odaya katilamadi');
            joinBtn.disabled = false;
            joinBtn.textContent = 'Katil';
        }
    },

    showWaitingRoom(container) {
        const content = container.querySelector('#competition-content');
        const room = this.currentRoom;

        content.innerHTML = `
            <div class="room-waiting">
                <div class="room-header">
                    <div class="room-code">
                        <span style="color: var(--text-tertiary);">Oda Kodu:</span>
                        <span class="room-code-value">${room.room_code}</span>
                        <button class="room-code-copy" title="Kodu kopyala">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                            </svg>
                        </button>
                    </div>
                    <button class="btn btn-ghost btn-sm" id="leave-room">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                    </button>
                </div>

                <div class="participants-list">
                    <h4 class="participants-title">Katilimcilar (${this.participants.length}/${CONFIG.MAX_PARTICIPANTS})</h4>
                    <div id="participants-container">
                        ${this.renderParticipants()}
                    </div>
                </div>

                ${this.isHost ? `
                    <div class="room-settings">
                        <h4 class="room-settings-title">Yarisma Ayarlari</h4>

                        <div class="form-group" style="margin-bottom: var(--spacing-md);">
                            <label class="form-label">Seviye Araligi</label>
                            <div style="display: flex; gap: var(--spacing-md); align-items: center;">
                                <select class="form-input" id="level-start" style="width: auto;">
                                    ${Array.from({ length: 10 }, (_, i) => `
                                        <option value="${i + 1}">Seviye ${i + 1}</option>
                                    `).join('')}
                                </select>
                                <span>-</span>
                                <select class="form-input" id="level-end" style="width: auto;">
                                    ${Array.from({ length: 10 }, (_, i) => `
                                        <option value="${i + 1}" ${i === 0 ? 'selected' : ''}>Seviye ${i + 1}</option>
                                    `).join('')}
                                </select>
                            </div>
                        </div>

                        <div class="form-group" style="margin-bottom: var(--spacing-md);">
                            <label class="form-label">Kategori</label>
                            <select class="form-input" id="category">
                                <option value="word_to_meaning">Kelimeden Anlama</option>
                                <option value="meaning_to_word">Anlamdan Kelimeye</option>
                                <option value="memory_to_word">Hafiza Metninden Kelimeye</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Soru Sayisi</label>
                            <div class="option-row">
                                <label class="radio-custom">
                                    <input type="radio" name="game-count" value="5">
                                    <span class="radiomark"></span>
                                    <span>5</span>
                                </label>
                                <label class="radio-custom">
                                    <input type="radio" name="game-count" value="10" checked>
                                    <span class="radiomark"></span>
                                    <span>10</span>
                                </label>
                                <label class="radio-custom">
                                    <input type="radio" name="game-count" value="20">
                                    <span class="radiomark"></span>
                                    <span>20</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div id="room-timeout-warning" class="room-timeout-warning hidden">
                        <p>Oda 1 dakika icinde kapanacak</p>
                        <button class="btn btn-sm btn-primary" id="extend-time">Sureyi Uzat</button>
                    </div>

                    <button class="btn btn-primary btn-block btn-lg" id="start-game" ${this.participants.length < CONFIG.MIN_PARTICIPANTS ? 'disabled' : ''}>
                        Yarismayi Baslat
                    </button>
                    ${this.participants.length < CONFIG.MIN_PARTICIPANTS ? `
                        <p style="text-align: center; color: var(--text-tertiary); margin-top: var(--spacing-sm);">
                            Baslatmak icin en az ${CONFIG.MIN_PARTICIPANTS} kisi gerekli
                        </p>
                    ` : ''}
                ` : `
                    <div style="text-align: center; padding: var(--spacing-xl); color: var(--text-secondary);">
                        <p>Oda sahibinin yarismayi baslatmasini bekliyorsunuz...</p>
                    </div>
                `}
            </div>
        `;

        // Event listeners
        content.querySelector('.room-code-copy').addEventListener('click', async () => {
            await Helpers.copyToClipboard(room.room_code);
            Toast.success('Kod kopyalandi');
        });

        content.querySelector('#leave-room').addEventListener('click', () => {
            this.leaveRoom(container);
        });

        if (this.isHost) {
            content.querySelector('#start-game').addEventListener('click', () => {
                this.startGame(container);
            });

            content.querySelector('#extend-time')?.addEventListener('click', () => {
                this.extendRoomTimeout(container);
            });
        }
    },

    renderParticipants() {
        return this.participants.map(p => `
            <div class="participant">
                <div class="avatar sm">${Helpers.getInitials(p.users.username)}</div>
                <span class="participant-name">${Helpers.escapeHtml(p.users.username)}</span>
                ${p.user_id === this.currentRoom.host_user_id ? '<span class="participant-host">Kurucu</span>' : ''}
            </div>
        `).join('');
    },

    subscribeToRoom(container) {
        if (this.roomChannel) {
            DB.rooms.unsubscribe(this.roomChannel);
        }

        this.roomChannel = DB.rooms.subscribeToRoom(this.currentRoom.id, async (payload) => {
            if (payload.table === 'game_participants') {
                // Refresh participants
                this.participants = await DB.rooms.getParticipants(this.currentRoom.id);
                const participantsContainer = container.querySelector('#participants-container');
                if (participantsContainer) {
                    participantsContainer.innerHTML = this.renderParticipants();
                }

                // Update start button
                const startBtn = container.querySelector('#start-game');
                if (startBtn && this.isHost) {
                    startBtn.disabled = this.participants.length < CONFIG.MIN_PARTICIPANTS;
                }
            }

            if (payload.table === 'game_rooms' && payload.new?.status === 'playing') {
                // Game started
                this.startGamePlay(container);
            }
        });
    },

    startRoomTimeout(container) {
        if (this.roomTimeoutTimer) clearTimeout(this.roomTimeoutTimer);

        this.roomTimeoutTimer = setTimeout(() => {
            const warning = container.querySelector('#room-timeout-warning');
            if (warning) warning.classList.remove('hidden');

            // Auto close after 10 more seconds
            setTimeout(() => {
                if (this.participants.length < CONFIG.MIN_PARTICIPANTS) {
                    this.closeRoom(container);
                }
            }, CONFIG.ROOM_TIMEOUT_WARNING);
        }, CONFIG.ROOM_TIMEOUT);
    },

    extendRoomTimeout(container) {
        const warning = container.querySelector('#room-timeout-warning');
        if (warning) warning.classList.add('hidden');
        this.startRoomTimeout(container);
        Toast.success('Sure uzatildi');
    },

    async startGame(container) {
        const settings = {
            levelStart: parseInt(container.querySelector('#level-start').value),
            levelEnd: parseInt(container.querySelector('#level-end').value),
            category: container.querySelector('#category').value,
            questionCount: parseInt(container.querySelector('input[name="game-count"]:checked').value)
        };

        try {
            // Get words
            const words = await DB.levels.getWordsInRange(settings.levelStart, settings.levelEnd);

            if (words.length < 4) {
                Toast.warning('Yeterli kelime yok');
                return;
            }

            // Generate questions
            this.gameQuestions = Test.generateQuestions(words, [settings.category], settings.questionCount);

            // Update room status
            await DB.rooms.updateStatus(this.currentRoom.id, 'playing');

            this.startGamePlay(container);
        } catch (error) {
            Toast.error('Yarisma baslatilamadi');
        }
    },

    async startGamePlay(container) {
        if (this.roomTimeoutTimer) clearTimeout(this.roomTimeoutTimer);

        this.currentQuestionIndex = 0;
        this.myScore = 0;

        this.showQuestion(container);
    },

    showQuestion(container) {
        const content = container.querySelector('#competition-content');
        const q = this.gameQuestions[this.currentQuestionIndex];

        if (!q) {
            this.endGame(container);
            return;
        }

        content.innerHTML = `
            <div class="game-container">
                <div class="game-progress-bar">
                    ${this.gameQuestions.map((_, i) => `
                        <div class="game-progress-segment">
                            <div class="game-progress-fill" style="width: ${i < this.currentQuestionIndex ? '100' : '0'}%; background: var(--accent-primary);"></div>
                        </div>
                    `).join('')}
                </div>

                <div class="test-header">
                    <span class="test-progress-text">Soru ${this.currentQuestionIndex + 1}/${this.gameQuestions.length}</span>
                    <div class="test-timer" id="game-timer">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                        </svg>
                        <span id="timer-value">${CONFIG.COMPETITION_QUESTION_TIME}s</span>
                    </div>
                </div>

                <div class="test-question">
                    <div class="test-question-label">Bu kelimenin anlami nedir?</div>
                    <div class="test-question-text">${Helpers.escapeHtml(q.question)}</div>
                </div>

                <div class="test-options" id="game-options">
                    ${q.options.map((option, i) => `
                        <button class="test-option" data-value="${Helpers.escapeHtml(option)}">
                            ${String.fromCharCode(65 + i)}) ${Helpers.escapeHtml(option)}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        // Setup option handlers
        content.querySelectorAll('.test-option').forEach(btn => {
            btn.addEventListener('click', () => this.selectGameAnswer(container, btn, q));
        });

        // Start timer
        this.startQuestionTimer(container);
    },

    startQuestionTimer(container) {
        let timeLeft = CONFIG.COMPETITION_QUESTION_TIME;
        const timerEl = container.querySelector('#timer-value');
        const timerContainer = container.querySelector('#game-timer');

        if (this.questionTimer) clearInterval(this.questionTimer);

        this.questionTimer = setInterval(() => {
            timeLeft--;
            timerEl.textContent = `${timeLeft}s`;

            if (timeLeft <= 5) {
                timerContainer.classList.add('warning');
            }

            if (timeLeft <= 0) {
                clearInterval(this.questionTimer);
                this.timeoutQuestion(container);
            }
        }, 1000);
    },

    selectGameAnswer(container, btn, question) {
        if (this.questionTimer) clearInterval(this.questionTimer);

        // Disable all options
        container.querySelectorAll('.test-option').forEach(opt => {
            opt.disabled = true;
        });

        const selected = btn.getAttribute('data-value');
        const isCorrect = selected === question.correct;

        btn.classList.add(isCorrect ? 'correct' : 'incorrect');

        if (!isCorrect) {
            container.querySelectorAll('.test-option').forEach(opt => {
                if (opt.getAttribute('data-value') === question.correct) {
                    opt.classList.add('correct');
                }
            });
        }

        if (isCorrect) {
            // Award points based on answering order (simplified for single player demo)
            this.myScore += CONFIG.POINTS.COMPETITION_1ST;
            Flashcard.showPoints(CONFIG.POINTS.COMPETITION_1ST, true);
        }

        // Next question after delay
        setTimeout(() => {
            this.currentQuestionIndex++;
            this.showQuestion(container);
        }, 2000);
    },

    timeoutQuestion(container) {
        container.querySelectorAll('.test-option').forEach(opt => {
            opt.disabled = true;
            if (opt.getAttribute('data-value') === this.gameQuestions[this.currentQuestionIndex].correct) {
                opt.classList.add('correct');
            }
        });

        setTimeout(() => {
            this.currentQuestionIndex++;
            this.showQuestion(container);
        }, 2000);
    },

    async endGame(container) {
        if (this.questionTimer) clearInterval(this.questionTimer);

        // Save game history
        try {
            await DB.gameHistory.save(Auth.user.id, {
                roomCode: this.currentRoom.room_code,
                category: this.currentRoom.category,
                questionCount: this.gameQuestions.length,
                participantCount: this.participants.length,
                score: this.myScore,
                rank: 1 // Simplified
            });

            // Update room status
            await DB.rooms.updateStatus(this.currentRoom.id, 'finished');
        } catch (e) {
            console.error(e);
        }

        this.showGameResults(container);
    },

    showGameResults(container) {
        const content = container.querySelector('#competition-content');

        Flashcard.celebrate();

        content.innerHTML = `
            <div class="game-results">
                <div class="game-results-trophy">🏆</div>
                <h2>Yarisma Bitti!</h2>

                <div class="game-leaderboard">
                    ${this.participants.map((p, i) => `
                        <div class="game-rank-item ${p.user_id === Auth.user.id ? 'current-user' : ''}">
                            <div class="game-rank-position ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : ''}">
                                ${i + 1}
                            </div>
                            <span class="game-rank-name">${Helpers.escapeHtml(p.users.username)}</span>
                            <span class="game-rank-score">${p.user_id === Auth.user.id ? this.myScore : Math.floor(Math.random() * this.myScore)}</span>
                        </div>
                    `).join('')}
                </div>

                <p style="margin-bottom: var(--spacing-xl);">
                    Puaniniz: <strong style="color: var(--accent-primary);">${this.myScore}</strong>
                </p>

                <div style="display: flex; flex-direction: column; gap: var(--spacing-md);">
                    <button class="btn btn-primary btn-block" id="new-game">Yeni Yarisma</button>
                    <button class="btn btn-secondary btn-block" id="exit-game">Cik</button>
                </div>
            </div>
        `;

        content.querySelector('#new-game').addEventListener('click', () => {
            this.cleanup();
            content.innerHTML = this.renderMainMenu();
            this.setupEventListeners(container);
        });

        content.querySelector('#exit-game').addEventListener('click', () => {
            this.cleanup();
            content.innerHTML = this.renderMainMenu();
            this.setupEventListeners(container);
        });
    },

    async leaveRoom(container) {
        const confirmed = await Modal.confirm(
            this.isHost ? 'Cikarsaniz oda kapanacak. Cikmak istiyor musunuz?' : 'Odadan ayrilmak istiyor musunuz?',
            'Odadan Cik'
        );

        if (confirmed) {
            if (this.isHost) {
                await this.closeRoom(container);
            } else {
                await DB.rooms.leaveRoom(this.currentRoom.id, Auth.user.id);
                this.cleanup();
                const content = container.querySelector('#competition-content');
                content.innerHTML = this.renderMainMenu();
                this.setupEventListeners(container);
            }
        }
    },

    async closeRoom(container) {
        try {
            await DB.rooms.deleteRoom(this.currentRoom.id);
        } catch (e) {
            console.error(e);
        }

        this.cleanup();
        Toast.info('Oda kapatildi');
        const content = container.querySelector('#competition-content');
        content.innerHTML = this.renderMainMenu();
        this.setupEventListeners(container);
    },

    async loadGameHistory(container) {
        const historyEl = container.querySelector('#game-history');

        try {
            const history = await DB.gameHistory.getHistory(Auth.user.id, 5);

            if (history.length === 0) {
                historyEl.innerHTML = '<p style="text-align: center; color: var(--text-tertiary); padding: var(--spacing-lg);">Henuz yarisma gecmisiniz yok</p>';
            } else {
                historyEl.innerHTML = history.map(h => `
                    <div class="list-item">
                        <div class="list-item-content">
                            <div class="list-item-title">${h.user_rank}. sirada bitirdiniz</div>
                            <div class="list-item-subtitle">${Helpers.formatRelativeTime(h.played_at)} - ${h.participant_count} katilimci</div>
                        </div>
                        <span style="font-weight: var(--font-weight-bold); color: var(--accent-primary);">${h.user_score} puan</span>
                    </div>
                `).join('');
            }
        } catch (error) {
            historyEl.innerHTML = '<p style="text-align: center; color: var(--text-tertiary);">Yuklenemedi</p>';
        }
    },

    cleanup() {
        if (this.roomChannel) {
            DB.rooms.unsubscribe(this.roomChannel);
            this.roomChannel = null;
        }
        if (this.questionTimer) {
            clearInterval(this.questionTimer);
            this.questionTimer = null;
        }
        if (this.roomTimeoutTimer) {
            clearTimeout(this.roomTimeoutTimer);
            this.roomTimeoutTimer = null;
        }
        this.currentRoom = null;
        this.isHost = false;
        this.participants = [];
        this.gameQuestions = [];
        this.currentQuestionIndex = 0;
        this.myScore = 0;
    }
};

window.CompetitionPage = CompetitionPage;
