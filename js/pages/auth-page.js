// VocabMaster Pro - Auth Page

const AuthPage = {
    resendTimer: null,
    resendCountdown: 0,

    render() {
        const container = document.createElement('div');
        container.className = 'auth-page';
        container.innerHTML = `
            <div class="auth-container">
                <div class="auth-logo">
                    <h1>VocabMaster Pro</h1>
                    <p>Ingilizce kelime ezberle, basariyi yakala</p>
                </div>

                <div class="auth-card">
                    <div class="auth-tabs">
                        <button class="auth-tab active" data-tab="login">Giris Yap</button>
                        <button class="auth-tab" data-tab="register">Kayit Ol</button>
                    </div>

                    <!-- Login Form -->
                    <form class="auth-form" id="login-form">
                        <div class="form-group">
                            <label class="form-label">Email veya Kullanici Adi</label>
                            <input type="text" class="form-input" id="login-email" required
                                placeholder="email@ornek.com veya kullaniciadi">
                        </div>

                        <div class="form-group">
                            <label class="form-label">Sifre</label>
                            <div style="position: relative;">
                                <input type="password" class="form-input" id="login-password" required
                                    placeholder="Sifreniz">
                                <button type="button" class="password-toggle" data-target="login-password">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                        <circle cx="12" cy="12" r="3"/>
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <label class="checkbox-custom">
                                <input type="checkbox" id="remember-me">
                                <span class="checkmark"></span>
                                <span>Beni hatirla</span>
                            </label>
                            <a class="forgot-password" id="forgot-password-link">Sifremi unuttum</a>
                        </div>

                        <div class="auth-actions">
                            <button type="submit" class="btn btn-primary btn-block">Giris Yap</button>
                        </div>

                    </form>

                    <!-- Register Form -->
                    <form class="auth-form hidden" id="register-form">
                        <div class="form-group">
                            <label class="form-label">Email</label>
                            <input type="email" class="form-input" id="register-email" required
                                placeholder="email@ornek.com">
                        </div>

                        <div class="form-group">
                            <label class="form-label">Kullanici Adi</label>
                            <input type="text" class="form-input" id="register-username" required
                                placeholder="3-20 karakter, harf, rakam ve _ kullanabilirsiniz"
                                minlength="3" maxlength="20" pattern="[a-zA-Z0-9_]+">
                        </div>

                        <div class="form-group">
                            <label class="form-label">Sifre</label>
                            <div style="position: relative;">
                                <input type="password" class="form-input" id="register-password" required
                                    placeholder="En az 8 karakter, 1 harf ve 1 rakam"
                                    minlength="8">
                                <button type="button" class="password-toggle" data-target="register-password">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                        <circle cx="12" cy="12" r="3"/>
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Sifre Tekrar</label>
                            <div style="position: relative;">
                                <input type="password" class="form-input" id="register-password-confirm" required
                                    placeholder="Sifrenizi tekrar girin">
                                <button type="button" class="password-toggle" data-target="register-password-confirm">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                        <circle cx="12" cy="12" r="3"/>
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div class="auth-actions">
                            <button type="submit" class="btn btn-primary btn-block">Kayit Ol</button>
                        </div>

                    </form>

                    <!-- Forgot Password Form -->
                    <form class="auth-form hidden" id="forgot-form">
                        <div style="text-align: center; margin-bottom: var(--spacing-lg);">
                            <h3 style="margin-bottom: var(--spacing-sm);">Sifre Sifirlama</h3>
                            <p style="color: var(--text-secondary); font-size: var(--font-size-sm);">
                                Email adresinizi girin, size sifre sifirlama baglantisi gonderelim.
                            </p>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Email</label>
                            <input type="email" class="form-input" id="forgot-email" required
                                placeholder="email@ornek.com">
                        </div>

                        <div class="auth-actions">
                            <button type="submit" class="btn btn-primary btn-block">Sifirlama Baglantisi Gonder</button>
                            <button type="button" class="btn btn-ghost btn-block" id="back-to-login">
                                Girise Don
                            </button>
                        </div>
                    </form>

                    <!-- Verification Sent -->
                    <div class="verification-sent hidden" id="verification-sent">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                            <polyline points="22 4 12 14.01 9 11.01"/>
                        </svg>
                        <h2>Email Gonderildi!</h2>
                        <p id="verification-message">Email adresinize dogrulama linki gonderdik. Lutfen email kutunuzu kontrol edin.</p>
                        <button class="btn btn-secondary" id="resend-email" disabled>
                            Tekrar Gonder (<span id="resend-countdown">60</span>s)
                        </button>
                        <p class="resend-timer">
                            Email gelmediyse spam klasorunu kontrol edin.
                        </p>
                    </div>
                </div>
            </div>
        `;

        this.setupEventListeners(container);
        return container;
    },

    setupEventListeners(container) {
        // Tab switching
        container.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(container, tab.dataset.tab));
        });

        // Password toggles
        container.querySelectorAll('.password-toggle').forEach(btn => {
            btn.addEventListener('click', () => {
                const input = container.querySelector(`#${btn.dataset.target}`);
                const isPassword = input.type === 'password';
                input.type = isPassword ? 'text' : 'password';
                btn.innerHTML = isPassword
                    ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>`
                    : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                    </svg>`;
            });
        });

        // Login form
        container.querySelector('#login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleLogin(container);
        });

        // Register form
        container.querySelector('#register-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleRegister(container);
        });

        // Forgot password
        container.querySelector('#forgot-password-link').addEventListener('click', () => {
            this.showForgotPassword(container);
        });

        container.querySelector('#forgot-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleForgotPassword(container);
        });

        container.querySelector('#back-to-login').addEventListener('click', () => {
            this.switchTab(container, 'login');
        });

        // Resend email
        container.querySelector('#resend-email').addEventListener('click', () => {
            this.handleResendEmail(container);
        });
    },

    switchTab(container, tab) {
        // Update tabs
        container.querySelectorAll('.auth-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.tab === tab);
        });

        // Show/hide forms
        container.querySelector('#login-form').classList.toggle('hidden', tab !== 'login');
        container.querySelector('#register-form').classList.toggle('hidden', tab !== 'register');
        container.querySelector('#forgot-form').classList.add('hidden');
        container.querySelector('#verification-sent').classList.add('hidden');
    },

    showForgotPassword(container) {
        container.querySelector('#login-form').classList.add('hidden');
        container.querySelector('#register-form').classList.add('hidden');
        container.querySelector('#forgot-form').classList.remove('hidden');
        container.querySelector('#verification-sent').classList.add('hidden');
    },

    showVerificationSent(container, message) {
        container.querySelector('#login-form').classList.add('hidden');
        container.querySelector('#register-form').classList.add('hidden');
        container.querySelector('#forgot-form').classList.add('hidden');
        container.querySelector('#verification-sent').classList.remove('hidden');
        container.querySelector('#verification-message').textContent = message;

        // Start resend countdown
        this.startResendCountdown(container);
    },

    startResendCountdown(container) {
        this.resendCountdown = 60;
        const btn = container.querySelector('#resend-email');
        const countdown = container.querySelector('#resend-countdown');

        btn.disabled = true;

        if (this.resendTimer) clearInterval(this.resendTimer);

        this.resendTimer = setInterval(() => {
            this.resendCountdown--;
            countdown.textContent = this.resendCountdown;

            if (this.resendCountdown <= 0) {
                clearInterval(this.resendTimer);
                btn.disabled = false;
                btn.textContent = 'Tekrar Gonder';
            }
        }, 1000);
    },

    async handleLogin(container) {
        const emailOrUsername = container.querySelector('#login-email').value.trim();
        const password = container.querySelector('#login-password').value;

        if (!emailOrUsername || !password) {
            Toast.error('Lutfen tum alanlari doldurun');
            return;
        }

        const btn = container.querySelector('#login-form button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = '<span class="loading-spinner small"></span> Giris yapiliyor...';

        try {
            await Auth.signIn(emailOrUsername, password);
            Toast.success('Basariyla giris yapildi!');
        } catch (error) {
            console.error('Login error:', error);
            let msg = error.message || 'Giris basarisiz';
            if (msg.includes('Invalid login credentials')) {
                msg = 'Email/kullanici adi veya sifre hatali';
            } else if (msg.includes('Email not confirmed')) {
                msg = 'Email adresiniz henuz dogrulanmamis. Lutfen email kutunuzu kontrol edin.';
            }
            Toast.error(msg);
        } finally {
            btn.disabled = false;
            btn.textContent = 'Giris Yap';
        }
    },

    async handleRegister(container) {
        const email = container.querySelector('#register-email').value.trim();
        const username = container.querySelector('#register-username').value.trim();
        const password = container.querySelector('#register-password').value;
        const passwordConfirm = container.querySelector('#register-password-confirm').value;

        if (!email || !username || !password || !passwordConfirm) {
            Toast.error('Lutfen tum alanlari doldurun');
            return;
        }

        if (password !== passwordConfirm) {
            Toast.error('Sifreler eslesmiyor');
            return;
        }

        const btn = container.querySelector('#register-form button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = '<span class="loading-spinner small"></span> Kayit olusuturuluyor...';

        try {
            const data = await Auth.signUp(email, password, username);

            // Check if email confirmation is required
            if (data.user && !data.session) {
                this.showVerificationSent(container, 'Email adresinize dogrulama linki gonderdik. Lutfen email kutunuzu kontrol edin. Spam klasorunu de kontrol etmeyi unutmayin.');
                Toast.success('Kayit basarili! Email adresinizi dogrulayin.');
            } else if (data.session) {
                // Auto-confirmed, user is now logged in
                Toast.success('Kayit basarili! Giris yapildi.');
            }
        } catch (error) {
            console.error('Signup error:', error);
            let msg = error.message || 'Kayit basarisiz';
            if (msg.includes('already registered') || msg.includes('already been registered')) {
                msg = 'Bu email adresi zaten kayitli. Giris yapin veya sifrenizi sifirlayin.';
            }
            Toast.error(msg);
        } finally {
            btn.disabled = false;
            btn.textContent = 'Kayit Ol';
        }
    },

    async handleForgotPassword(container) {
        const email = container.querySelector('#forgot-email').value.trim();

        if (!email) {
            Toast.error('Lutfen email adresinizi girin');
            return;
        }

        const btn = container.querySelector('#forgot-form button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = '<span class="loading-spinner small"></span> Gonderiliyor...';

        try {
            await Auth.resetPassword(email);
            this.showVerificationSent(container, 'Sifre sifirlama baglantisi email adresinize gonderildi.');
            Toast.success('Sifirlama linki gonderildi!');
        } catch (error) {
            Toast.error(error.message || 'Bir hata olustu');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Sifirlama Baglantisi Gonder';
        }
    },

    async handleResendEmail(container) {
        const btn = container.querySelector('#resend-email');
        btn.disabled = true;

        try {
            // Resend verification email logic would go here
            Toast.success('Dogrulama emaili tekrar gonderildi');
            this.startResendCountdown(container);
        } catch (error) {
            Toast.error('Email gonderilemedi');
            btn.disabled = false;
        }
    },

    cleanup() {
        if (this.resendTimer) {
            clearInterval(this.resendTimer);
        }
    }
};

window.AuthPage = AuthPage;
