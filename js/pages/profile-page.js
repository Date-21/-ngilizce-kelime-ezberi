// VocabMaster Pro - Profile & Settings Page

const ProfilePage = {
    userBadges: [],

    async render() {
        const container = document.createElement('div');
        container.className = 'profile-page page-enter';

        const profile = Auth.getProfile();
        if (!profile) {
            container.innerHTML = '<p>Profil yuklenemedi</p>';
            return container;
        }

        // Load badges
        try {
            this.userBadges = await DB.badges.getUserBadges(Auth.user.id);
        } catch (e) {
            this.userBadges = [];
        }

        const totalLearned = await DB.progress.getTotalLearnedWords(Auth.user.id).catch(() => 0);

        container.innerHTML = `
            <div class="profile-header">
                <div class="avatar xl">${Helpers.getInitials(profile.username)}</div>
                <div class="profile-info">
                    <h2>${Helpers.escapeHtml(profile.username)}</h2>
                    <p>${Helpers.escapeHtml(profile.email)}</p>
                    <p style="color: var(--text-tertiary); font-size: var(--font-size-xs);">
                        Uyelik: ${Helpers.formatDate(profile.created_at, 'long')}
                    </p>
                </div>
            </div>

            <div class="profile-stats">
                <div class="profile-stat">
                    <div class="profile-stat-value">${Helpers.formatNumber(profile.total_points || 0)}</div>
                    <div class="profile-stat-label">Puan</div>
                </div>
                <div class="profile-stat">
                    <div class="profile-stat-value">${totalLearned}</div>
                    <div class="profile-stat-label">Kelime</div>
                </div>
                <div class="profile-stat">
                    <div class="profile-stat-value">${profile.current_streak || 0}🔥</div>
                    <div class="profile-stat-label">Seri</div>
                </div>
            </div>

            <!-- Badges Section -->
            <div class="settings-section">
                <div class="settings-section-title">Rozetler</div>
                <div class="badges-grid" id="badges-grid">
                    ${this.renderBadges()}
                </div>
            </div>

            <!-- Messages Section -->
            <div class="settings-section">
                <div class="settings-section-title">Mesajlar</div>
                <div class="settings-item" id="open-messages">
                    <div class="settings-item-label">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                            <polyline points="22,6 12,13 2,6"/>
                        </svg>
                        <span>Sistem Mesajlari</span>
                    </div>
                    <span id="unread-count" class="badge-count" style="display: none;">0</span>
                </div>
            </div>

            <!-- App Settings -->
            <div class="settings-section">
                <div class="settings-section-title">Uygulama Ayarlari</div>

                <div class="settings-item" id="theme-setting">
                    <div class="settings-item-label">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="5"/>
                            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2"/>
                        </svg>
                        <span>Tema</span>
                    </div>
                    <select class="form-input" style="width: auto; padding: var(--spacing-sm) var(--spacing-md);" id="theme-select">
                        <option value="light" ${Storage.getTheme() === 'light' ? 'selected' : ''}>Gunduz</option>
                        <option value="dark" ${Storage.getTheme() === 'dark' ? 'selected' : ''}>Gece</option>
                    </select>
                </div>

                <div class="settings-item">
                    <div class="settings-item-label">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M4 7V4a2 2 0 0 1 2-2h8.5L20 7.5V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3"/>
                        </svg>
                        <span>Kart Metin Boyutu</span>
                    </div>
                    <select class="form-input" style="width: auto; padding: var(--spacing-sm) var(--spacing-md);" id="card-size-select">
                        <option value="small" ${Storage.getCardSize() === 'small' ? 'selected' : ''}>Kucuk</option>
                        <option value="normal" ${Storage.getCardSize() === 'normal' ? 'selected' : ''}>Normal</option>
                        <option value="large" ${Storage.getCardSize() === 'large' ? 'selected' : ''}>Buyuk</option>
                    </select>
                </div>

                <div class="settings-item">
                    <div class="settings-item-label">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                        </svg>
                        <span>Ses Efektleri</span>
                    </div>
                    <label class="toggle">
                        <input type="checkbox" id="sound-toggle" ${Storage.getSoundEnabled() ? 'checked' : ''}>
                        <span class="toggle-slider"></span>
                    </label>
                </div>

                <div class="settings-item">
                    <div class="settings-item-label">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                            <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                        <span>Liderlik Tablosunda Gorun</span>
                    </div>
                    <label class="toggle">
                        <input type="checkbox" id="privacy-toggle" ${profile.settings?.privacy_leaderboard !== false ? 'checked' : ''}>
                        <span class="toggle-slider"></span>
                    </label>
                </div>
            </div>

            <!-- Account Settings -->
            <div class="settings-section">
                <div class="settings-section-title">Hesap Ayarlari</div>

                <div class="settings-item" id="change-username">
                    <div class="settings-item-label">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                        </svg>
                        <span>Kullanici Adi Degistir</span>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="2">
                        <polyline points="9 18 15 12 9 6"/>
                    </svg>
                </div>

                <div class="settings-item" id="change-email">
                    <div class="settings-item-label">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                            <polyline points="22,6 12,13 2,6"/>
                        </svg>
                        <span>Email Degistir</span>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="2">
                        <polyline points="9 18 15 12 9 6"/>
                    </svg>
                </div>

                <div class="settings-item" id="change-password">
                    <div class="settings-item-label">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                        <span>Sifre Degistir</span>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="2">
                        <polyline points="9 18 15 12 9 6"/>
                    </svg>
                </div>
            </div>

            <!-- Danger Zone -->
            <div class="settings-section">
                <div class="settings-section-title" style="color: var(--error);">Tehlikeli Bolge</div>

                <div class="settings-item" id="reset-stats">
                    <div class="settings-item-label">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="1 4 1 10 7 10"/>
                            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
                        </svg>
                        <span>Istatistikleri Sifirla</span>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="2">
                        <polyline points="9 18 15 12 9 6"/>
                    </svg>
                </div>

                <div class="settings-item" id="delete-account" style="color: var(--error);">
                    <div class="settings-item-label">
                        <svg viewBox="0 0 24 24" fill="none" stroke="var(--error)" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                        <span style="color: var(--error);">Hesabi Sil</span>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--error)" stroke-width="2">
                        <polyline points="9 18 15 12 9 6"/>
                    </svg>
                </div>
            </div>

            ${Auth.isAdmin ? `
                <div class="settings-section">
                    <div class="settings-item" id="open-admin" style="background: rgba(201, 162, 39, 0.05);">
                        <div class="settings-item-label">
                            <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" stroke-width="2">
                                <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/>
                            </svg>
                            <span style="color: var(--accent-primary); font-weight: var(--font-weight-semibold);">Admin Paneli</span>
                        </div>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" stroke-width="2">
                            <polyline points="9 18 15 12 9 6"/>
                        </svg>
                    </div>
                </div>
            ` : ''}

            <button class="btn btn-danger btn-block logout-btn" id="logout-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Cikis Yap
            </button>
        `;

        this.setupEventListeners(container);
        this.loadUnreadCount(container);

        return container;
    },

    renderBadges() {
        const allBadges = Object.values(CONFIG.BADGES);
        const earnedIds = this.userBadges.map(b => b.badge_id);

        return allBadges.map(badge => `
            <div class="badge-item ${earnedIds.includes(badge.id) ? '' : 'locked'}"
                 title="${badge.name} - ${badge.condition}: ${badge.value}">
                <div class="badge-icon">${badge.icon}</div>
                <div class="badge-name">${badge.name}</div>
            </div>
        `).join('');
    },

    setupEventListeners(container) {
        // Theme select
        container.querySelector('#theme-select').addEventListener('change', (e) => {
            Storage.setTheme(e.target.value);
        });

        // Card size select
        container.querySelector('#card-size-select').addEventListener('change', (e) => {
            Storage.setCardSize(e.target.value);
        });

        // Sound toggle
        container.querySelector('#sound-toggle').addEventListener('change', (e) => {
            Storage.setSoundEnabled(e.target.checked);
        });

        // Privacy toggle
        container.querySelector('#privacy-toggle').addEventListener('change', async (e) => {
            const settings = { ...Auth.profile.settings, privacy_leaderboard: e.target.checked };
            await DB.users.updateSettings(Auth.user.id, settings);
            Auth.profile.settings = settings;
        });

        // Change username
        container.querySelector('#change-username').addEventListener('click', async () => {
            const newUsername = await Modal.prompt('Yeni kullanici adinizi girin:', 'Kullanici Adi Degistir', Auth.profile.username);
            if (newUsername && newUsername !== Auth.profile.username) {
                try {
                    await Auth.updateUsername(newUsername);
                    Toast.success('Kullanici adi degistirildi');
                    Router.navigate('profile');
                } catch (error) {
                    Toast.error(error.message);
                }
            }
        });

        // Change email
        container.querySelector('#change-email').addEventListener('click', () => {
            Modal.create({
                title: 'Email Degistir',
                content: `
                    <div class="form-group">
                        <label class="form-label">Yeni Email</label>
                        <input type="email" class="form-input" id="new-email" placeholder="yeni@email.com">
                    </div>
                    <div class="form-group" style="margin-top: var(--spacing-md);">
                        <label class="form-label">Mevcut Sifre</label>
                        <input type="password" class="form-input" id="email-password" placeholder="Sifreniz">
                    </div>
                `,
                actions: [
                    { id: 'cancel', label: 'Iptal', class: 'btn-secondary', handler: (m) => Modal.close(m) },
                    {
                        id: 'save', label: 'Degistir', class: 'btn-primary',
                        handler: async (m) => {
                            const email = m.querySelector('#new-email').value;
                            const password = m.querySelector('#email-password').value;
                            try {
                                await Auth.updateEmail(email, password);
                                Toast.success('Dogrulama emaili gonderildi');
                                Modal.close(m);
                            } catch (error) {
                                Toast.error(error.message);
                            }
                        }
                    }
                ]
            });
        });

        // Change password
        container.querySelector('#change-password').addEventListener('click', () => {
            Modal.create({
                title: 'Sifre Degistir',
                content: `
                    <div class="form-group">
                        <label class="form-label">Mevcut Sifre</label>
                        <input type="password" class="form-input" id="current-password">
                    </div>
                    <div class="form-group" style="margin-top: var(--spacing-md);">
                        <label class="form-label">Yeni Sifre</label>
                        <input type="password" class="form-input" id="new-password" placeholder="En az 8 karakter">
                    </div>
                    <div class="form-group" style="margin-top: var(--spacing-md);">
                        <label class="form-label">Yeni Sifre Tekrar</label>
                        <input type="password" class="form-input" id="new-password-confirm">
                    </div>
                `,
                actions: [
                    { id: 'cancel', label: 'Iptal', class: 'btn-secondary', handler: (m) => Modal.close(m) },
                    {
                        id: 'save', label: 'Degistir', class: 'btn-primary',
                        handler: async (m) => {
                            const current = m.querySelector('#current-password').value;
                            const newPw = m.querySelector('#new-password').value;
                            const confirm = m.querySelector('#new-password-confirm').value;
                            if (newPw !== confirm) { Toast.error('Sifreler eslesmiyor'); return; }
                            try {
                                await Auth.updatePassword(current, newPw);
                                Toast.success('Sifre degistirildi');
                                Modal.close(m);
                            } catch (error) {
                                Toast.error(error.message);
                            }
                        }
                    }
                ]
            });
        });

        // Reset stats
        container.querySelector('#reset-stats').addEventListener('click', async () => {
            const confirmed = await Modal.confirm(
                'Tum istatistikleriniz sifirlanacak. 24 saat icinde geri alabilirsiniz. Devam etmek istiyor musunuz?',
                'Istatistikleri Sifirla',
                'Sifirla',
                'Iptal'
            );
            if (confirmed) {
                // TODO: Implement stats reset with backup
                Toast.success('Istatistikler sifirlandi. 24 saat icinde geri alabilirsiniz.');
            }
        });

        // Delete account
        container.querySelector('#delete-account').addEventListener('click', async () => {
            const confirmed = await Modal.confirm(
                'Hesabiniz kalici olarak silinecek. Bu islem geri alinamaz! Devam etmek istiyor musunuz?',
                'Hesabi Sil',
                'Sil',
                'Iptal'
            );
            if (confirmed) {
                const password = await Modal.prompt('Islemin onayi icin sifrenizi girin:', 'Sifre Dogrulama');
                if (password) {
                    try {
                        await Auth.deleteAccount(password);
                        Toast.success('Hesabiniz silindi');
                    } catch (error) {
                        Toast.error(error.message);
                    }
                }
            }
        });

        // Open messages
        container.querySelector('#open-messages').addEventListener('click', () => {
            this.showMessages(container);
        });

        // Admin panel
        container.querySelector('#open-admin')?.addEventListener('click', () => {
            Router.navigate('admin');
        });

        // Logout
        container.querySelector('#logout-btn').addEventListener('click', async () => {
            const confirmed = await Modal.confirm('Cikis yapmak istiyor musunuz?', 'Cikis');
            if (confirmed) {
                await Auth.signOut();
            }
        });
    },

    async loadUnreadCount(container) {
        try {
            const count = await DB.messages.getUnreadCount(Auth.user.id);
            const badge = container.querySelector('#unread-count');
            if (count > 0) {
                badge.textContent = count;
                badge.style.display = '';
            }
        } catch (e) {}
    },

    async showMessages(container) {
        const modal = Modal.create({
            title: 'Mesajlar',
            content: '<div class="loading-spinner" style="margin: var(--spacing-xl) auto;"></div>',
            size: 'large',
            actions: [
                { id: 'close', label: 'Kapat', class: 'btn-secondary', handler: (m) => Modal.close(m) }
            ]
        });

        try {
            const messages = await DB.messages.getForUser(Auth.user.id);
            const body = modal.querySelector('.modal-body');

            if (messages.length === 0) {
                body.innerHTML = '<p style="text-align: center; color: var(--text-tertiary); padding: var(--spacing-xl);">Mesajiniz yok</p>';
                return;
            }

            body.innerHTML = `
                <div class="list">
                    ${messages.map(msg => `
                        <div class="list-item" data-msg-id="${msg.id}" style="${!msg.is_read ? 'background: var(--bg-secondary);' : ''}">
                            <div class="list-item-content">
                                <div class="list-item-title">${Helpers.escapeHtml(msg.title)}</div>
                                <div class="list-item-subtitle">${Helpers.formatRelativeTime(msg.created_at)}</div>
                            </div>
                            ${!msg.is_read ? '<div class="badge-count" style="width: 8px; height: 8px; min-width: 8px; padding: 0;"></div>' : ''}
                        </div>
                    `).join('')}
                </div>
            `;

            body.querySelectorAll('.list-item').forEach(item => {
                item.addEventListener('click', async () => {
                    const msgId = parseInt(item.dataset.msgId);
                    const msg = messages.find(m => m.id === msgId);
                    if (msg) {
                        await DB.messages.markAsRead(msgId, Auth.user.id);
                        item.style.background = '';
                        item.querySelector('.badge-count')?.remove();

                        Modal.alert(msg.content, msg.title);
                    }
                });
            });
        } catch (error) {
            const body = modal.querySelector('.modal-body');
            body.innerHTML = '<p style="color: var(--text-tertiary);">Mesajlar yuklenemedi</p>';
        }
    },

    cleanup() {}
};

window.ProfilePage = ProfilePage;
