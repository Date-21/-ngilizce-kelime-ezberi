// VocabMaster Pro - Authentication Module

const Auth = {
    user: null,
    profile: null,
    isAdmin: false,
    loginAttempts: 0,
    lockedUntil: null,

    async init() {
        try {
            const session = await DB.auth.getSession();
            if (session) {
                this.user = session.user;
                await this.loadProfile();
            }
        } catch (error) {
            console.error('Auth init error:', error);
        }

        // Listen for auth changes
        DB.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
                this.user = session.user;
                await this.loadProfile();
                App.onAuthChange(true);
            } else if (event === 'SIGNED_OUT') {
                this.user = null;
                this.profile = null;
                this.isAdmin = false;
                App.onAuthChange(false);
            }
        });
    },

    async loadProfile() {
        if (!this.user) return;

        try {
            this.profile = await DB.users.getProfile(this.user.id);
            this.isAdmin = await DB.admin.isAdmin(this.user.id);

            // Check if user is banned
            if (this.profile && !this.profile.is_active) {
                Toast.error('Hesabiniz askiya alinmis');
                await this.signOut();
                return;
            }
        } catch (error) {
            console.error('Failed to load profile:', error);
            // If profile doesn't exist (e.g. trigger didn't fire), create it
            if (error.code === 'PGRST116' || error.message?.includes('JSON')) {
                try {
                    const { data, error: insertErr } = await supabaseClient.from('users').upsert({
                        id: this.user.id,
                        email: this.user.email,
                        username: this.user.user_metadata?.username ||
                                  this.user.user_metadata?.full_name ||
                                  this.user.email?.split('@')[0] || 'user'
                    }, { onConflict: 'id' }).select().single();
                    if (!insertErr) {
                        this.profile = data;
                    }
                } catch (e2) {
                    console.error('Failed to create profile:', e2);
                }
            }
        }
    },

    isLoggedIn() {
        return this.user !== null;
    },

    getUser() {
        return this.user;
    },

    getProfile() {
        return this.profile;
    },

    isLocked() {
        if (!this.lockedUntil) return false;
        if (Date.now() > this.lockedUntil) {
            this.lockedUntil = null;
            this.loginAttempts = 0;
            return false;
        }
        return true;
    },

    getRemainingLockTime() {
        if (!this.lockedUntil) return 0;
        return Math.ceil((this.lockedUntil - Date.now()) / 1000);
    },

    async signUp(email, password, username) {
        // Validate inputs
        if (!Helpers.isValidEmail(email)) {
            throw new Error('Gecerli bir email adresi girin');
        }

        if (!Helpers.isValidUsername(username)) {
            throw new Error(`Kullanici adi ${CONFIG.USERNAME_MIN}-${CONFIG.USERNAME_MAX} karakter olmali ve sadece harf, rakam, alt cizgi icerebilir`);
        }

        if (!Helpers.isValidPassword(password)) {
            throw new Error('Sifre en az 8 karakter olmali ve en az 1 harf ve 1 rakam icermeli');
        }

        const data = await DB.auth.signUp(email, password, username);
        return data;
    },

    async signIn(emailOrUsername, password) {
        // Check if locked
        if (this.isLocked()) {
            throw new Error(`Cok fazla basarisiz giris. ${this.getRemainingLockTime()} saniye bekleyin`);
        }

        try {
            const data = await DB.auth.signIn(emailOrUsername, password);
            this.loginAttempts = 0;
            this.user = data.user;
            await this.loadProfile();
            return data;
        } catch (error) {
            this.loginAttempts++;
            if (this.loginAttempts >= 5) {
                this.lockedUntil = Date.now() + 15 * 60 * 1000; // 15 minutes
                throw new Error('Cok fazla basarisiz giris. 15 dakika bekleyin');
            }
            throw error;
        }
    },

    async signOut() {
        await DB.auth.signOut();
        this.user = null;
        this.profile = null;
        this.isAdmin = false;
        Storage.clear();
    },

    async resetPassword(email) {
        if (!Helpers.isValidEmail(email)) {
            throw new Error('Gecerli bir email adresi girin');
        }
        await DB.auth.resetPassword(email);
    },

    async updatePassword(currentPassword, newPassword) {
        if (!Helpers.isValidPassword(newPassword)) {
            throw new Error('Yeni sifre en az 8 karakter olmali ve en az 1 harf ve 1 rakam icermeli');
        }

        // Verify current password by re-authenticating
        try {
            await DB.auth.signIn(this.user.email, currentPassword);
        } catch {
            throw new Error('Mevcut sifre yanlis');
        }

        await DB.auth.updatePassword(newPassword);
    },

    async updateUsername(newUsername) {
        if (!Helpers.isValidUsername(newUsername)) {
            throw new Error(`Kullanici adi ${CONFIG.USERNAME_MIN}-${CONFIG.USERNAME_MAX} karakter olmali`);
        }

        // Check if username change is allowed (30 day limit)
        if (this.profile.username_changed_at) {
            const lastChange = new Date(this.profile.username_changed_at);
            const daysSinceChange = Helpers.getDaysBetween(lastChange, new Date());
            if (daysSinceChange < CONFIG.USERNAME_CHANGE_DAYS) {
                throw new Error(`Kullanici adinizi ${CONFIG.USERNAME_CHANGE_DAYS - daysSinceChange} gun sonra degistirebilirsiniz`);
            }
        }

        // Check if username is taken
        const { data: existing } = await supabaseClient
            .from('users')
            .select('id')
            .eq('username', newUsername)
            .neq('id', this.user.id)
            .single();

        if (existing) {
            throw new Error('Bu kullanici adi zaten kullaniliyor');
        }

        await DB.users.updateProfile(this.user.id, {
            username: newUsername,
            username_changed_at: new Date().toISOString()
        });

        this.profile.username = newUsername;
    },

    async updateEmail(newEmail, password) {
        if (!Helpers.isValidEmail(newEmail)) {
            throw new Error('Gecerli bir email adresi girin');
        }

        // Verify password
        try {
            await DB.auth.signIn(this.user.email, password);
        } catch {
            throw new Error('Sifre yanlis');
        }

        // Update in Supabase Auth
        const { error } = await supabaseClient.auth.updateUser({ email: newEmail });
        if (error) throw error;

        // Update in users table
        await DB.users.updateProfile(this.user.id, { email: newEmail });
    },

    async deleteAccount(password) {
        // Verify password
        try {
            await DB.auth.signIn(this.user.email, password);
        } catch {
            throw new Error('Sifre yanlis');
        }

        await DB.users.deleteAccount(this.user.id);
    },

    async addPoints(points) {
        if (!this.user) return;

        const newTotal = await DB.users.addPoints(this.user.id, points);
        this.profile.total_points = newTotal;

        // Update daily stats
        await DB.stats.update(this.user.id, { points });

        // Check for badges
        await DB.badges.checkAndAward(this.user.id, 'points', newTotal);

        return newTotal;
    },

    async updateStudyTime(minutes) {
        if (!this.user) return;

        await DB.users.updateStudyTime(this.user.id, minutes);
        await DB.stats.update(this.user.id, { studyTime: minutes });
    },

    async incrementStreak() {
        if (!this.user) return;

        const newStreak = (this.profile.current_streak || 0) + 1;
        await DB.users.updateStreak(this.user.id, newStreak);
        this.profile.current_streak = newStreak;

        // Check for streak badges
        await DB.badges.checkAndAward(this.user.id, 'streak', newStreak);

        return newStreak;
    },

    async resetStreak() {
        if (!this.user) return;

        await DB.users.updateStreak(this.user.id, 0);
        this.profile.current_streak = 0;
    },

    async checkAndUpdateStreak() {
        if (!this.user) return;

        // Get today's stats
        const today = await DB.stats.getOrCreate(this.user.id);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        // Check if user did anything today
        if (today.words_learned > 0 || today.tests_completed > 0) {
            // Check yesterday's activity
            const yesterdayStats = await DB.stats.getRange(
                this.user.id,
                yesterdayStr,
                yesterdayStr
            );

            if (yesterdayStats.length === 0 ||
                (yesterdayStats[0].words_learned === 0 && yesterdayStats[0].tests_completed === 0)) {
                // Reset streak if no activity yesterday
                await this.resetStreak();
            }
        }
    }
};

// Make globally available
window.Auth = Auth;
