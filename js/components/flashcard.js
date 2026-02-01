// VocabMaster Pro - Flashcard Component

const Flashcard = {
    currentCard: null,
    isFlipped: false,
    swipeStartX: 0,
    swipeThreshold: CONFIG.SWIPE_THRESHOLD,

    create(word, options = {}) {
        const {
            showActions = true,
            onLearn = null,
            onRepeat = null
        } = options;

        const card = document.createElement('div');
        card.className = 'flashcard-container';
        card.innerHTML = `
            <div class="flashcard" data-word-id="${word.id}">
                <div class="flashcard-face flashcard-front">
                    <button class="flashcard-sound" aria-label="Sesi dinle">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                            <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                        </svg>
                    </button>
                    <div class="flashcard-content">
                        <div class="flashcard-word">${Helpers.escapeHtml(word.english_word)}</div>
                        <div class="flashcard-pronunciation">${Helpers.escapeHtml(word.pronunciation || '')}</div>
                        <div class="flashcard-meaning">${Helpers.escapeHtml(word.turkish_meaning)}</div>
                        ${word.memory_sentence ? `
                            <div class="flashcard-sentence">"${Helpers.escapeHtml(word.memory_sentence)}"</div>
                        ` : ''}
                    </div>
                </div>
                <div class="flashcard-face flashcard-back">
                    ${word.image_url ? `
                        <img src="${word.image_url}" alt="${word.english_word}" class="flashcard-image" loading="lazy">
                    ` : `
                        <div class="flashcard-image-placeholder">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                                <rect x="3" y="3" width="18" height="18" rx="2"/>
                                <circle cx="8.5" cy="8.5" r="1.5"/>
                                <path d="M21 15l-5-5L5 21"/>
                            </svg>
                        </div>
                    `}
                </div>
                <div class="swipe-overlay left">
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                </div>
                <div class="swipe-overlay right">
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"/>
                    </svg>
                </div>
            </div>
        `;

        // Sound button
        const soundBtn = card.querySelector('.flashcard-sound');
        soundBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.speak(word.english_word);
        });

        // Flip on click
        const flashcard = card.querySelector('.flashcard');
        flashcard.addEventListener('click', () => {
            this.flip(flashcard);
        });

        // Swipe handling
        this.setupSwipe(card, flashcard, onLearn, onRepeat);

        // Actions
        if (showActions) {
            const actions = document.createElement('div');
            actions.className = 'flashcard-actions';
            actions.innerHTML = `
                <button class="flashcard-btn repeat">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                    Tekrar Et
                </button>
                <button class="flashcard-btn learned">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Ogrendim
                </button>
            `;

            actions.querySelector('.repeat').addEventListener('click', () => {
                this.animateSwipe(flashcard, 'left', () => {
                    if (onRepeat) onRepeat(word);
                });
            });

            actions.querySelector('.learned').addEventListener('click', () => {
                this.animateSwipe(flashcard, 'right', () => {
                    if (onLearn) onLearn(word);
                });
            });

            card.appendChild(actions);
        }

        this.currentCard = card;
        return card;
    },

    setupSwipe(container, flashcard, onLearn, onRepeat) {
        let startX = 0;
        let currentX = 0;
        let isDragging = false;

        const onStart = (e) => {
            isDragging = true;
            startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
            flashcard.style.transition = 'none';
        };

        const onMove = (e) => {
            if (!isDragging) return;

            currentX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
            const diff = currentX - startX;

            // Limit the swipe distance
            const maxSwipe = container.offsetWidth * 0.5;
            const clampedDiff = Helpers.clamp(diff, -maxSwipe, maxSwipe);

            flashcard.style.transform = `translateX(${clampedDiff}px) rotate(${clampedDiff * 0.05}deg)`;

            // Show overlay
            const leftOverlay = container.querySelector('.swipe-overlay.left');
            const rightOverlay = container.querySelector('.swipe-overlay.right');

            if (diff < -30) {
                leftOverlay.style.opacity = Math.min(1, Math.abs(diff) / this.swipeThreshold);
                rightOverlay.style.opacity = 0;
            } else if (diff > 30) {
                rightOverlay.style.opacity = Math.min(1, diff / this.swipeThreshold);
                leftOverlay.style.opacity = 0;
            } else {
                leftOverlay.style.opacity = 0;
                rightOverlay.style.opacity = 0;
            }
        };

        const onEnd = () => {
            if (!isDragging) return;
            isDragging = false;

            const diff = currentX - startX;
            flashcard.style.transition = '';

            // Reset overlays
            container.querySelector('.swipe-overlay.left').style.opacity = 0;
            container.querySelector('.swipe-overlay.right').style.opacity = 0;

            if (Math.abs(diff) >= this.swipeThreshold) {
                if (diff > 0) {
                    this.animateSwipe(flashcard, 'right', () => {
                        if (onLearn) onLearn();
                    });
                } else {
                    this.animateSwipe(flashcard, 'left', () => {
                        if (onRepeat) onRepeat();
                    });
                }
            } else {
                // Reset position
                flashcard.style.transform = '';
            }
        };

        // Mouse events
        flashcard.addEventListener('mousedown', onStart);
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onEnd);

        // Touch events
        flashcard.addEventListener('touchstart', onStart, { passive: true });
        flashcard.addEventListener('touchmove', onMove, { passive: true });
        flashcard.addEventListener('touchend', onEnd);
    },

    flip(flashcard) {
        if (!flashcard) flashcard = document.querySelector('.flashcard');
        if (!flashcard) return;

        this.isFlipped = !this.isFlipped;
        flashcard.classList.toggle('flipped', this.isFlipped);
    },

    animateSwipe(flashcard, direction, callback) {
        const distance = direction === 'right' ? window.innerWidth : -window.innerWidth;
        flashcard.style.transition = 'transform 0.3s ease-out';
        flashcard.style.transform = `translateX(${distance}px) rotate(${direction === 'right' ? 30 : -30}deg)`;

        setTimeout(() => {
            if (callback) callback();
        }, 300);
    },

    speak(text) {
        if (!('speechSynthesis' in window)) {
            Toast.warning('Tarayiciniz ses sentezini desteklemiyor');
            return;
        }

        // Cancel any ongoing speech
        speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 0.9;
        utterance.pitch = 1;

        // Try to get a male English voice
        const voices = speechSynthesis.getVoices();
        const englishVoices = voices.filter(v => v.lang.startsWith('en'));
        const maleVoice = englishVoices.find(v =>
            v.name.toLowerCase().includes('male') ||
            v.name.toLowerCase().includes('david') ||
            v.name.toLowerCase().includes('james')
        );

        if (maleVoice) {
            utterance.voice = maleVoice;
        } else if (englishVoices.length > 0) {
            utterance.voice = englishVoices[0];
        }

        speechSynthesis.speak(utterance);
    },

    // Show points animation
    showPoints(amount, isPositive = true) {
        const popup = document.createElement('div');
        popup.className = `points-popup ${isPositive ? 'positive' : 'negative'}`;
        popup.textContent = isPositive ? `+${amount}` : amount.toString();
        popup.style.left = '50%';
        popup.style.top = '40%';
        popup.style.transform = 'translateX(-50%)';

        document.body.appendChild(popup);

        popup.classList.add(isPositive ? 'animate-points-up' : 'animate-points-down');

        setTimeout(() => {
            popup.remove();
        }, 800);
    },

    // Show confetti celebration
    celebrate() {
        const container = document.createElement('div');
        container.className = 'confetti-container';

        const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#DDA0DD'];

        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti-piece';
            confetti.style.left = `${Math.random() * 100}%`;
            confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = `${Math.random() * 0.5}s`;
            confetti.style.transform = `rotate(${Math.random() * 360}deg)`;

            container.appendChild(confetti);
        }

        document.body.appendChild(container);

        setTimeout(() => {
            container.remove();
        }, 3000);
    },

    reset() {
        this.currentCard = null;
        this.isFlipped = false;
    }
};

// Load voices when available
if ('speechSynthesis' in window) {
    speechSynthesis.onvoiceschanged = () => {
        speechSynthesis.getVoices();
    };
}

// Make globally available
window.Flashcard = Flashcard;
