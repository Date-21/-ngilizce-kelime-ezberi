// VocabMaster Pro - Supabase Client

// Initialize Supabase client
// Note: window.supabase is created by the CDN, we use a different variable name to avoid conflicts
let supabaseClient;
try {
    const _sb = window.supabase;
    if (!_sb || !_sb.createClient) {
        throw new Error('Supabase JS kutuphanesi yuklenemedi. Internet baglantinizi kontrol edin.');
    }
    supabaseClient = _sb.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
} catch (e) {
    console.error('Supabase baglanti hatasi:', e);
    document.addEventListener('DOMContentLoaded', () => {
        const el = document.getElementById('loading-screen');
        if (el) el.style.display = 'none';
        document.getElementById('main-content').innerHTML =
            '<div style="padding:40px;text-align:center;">' +
            '<h2>Baglanti Hatasi</h2>' +
            '<p>' + e.message + '</p>' +
            '<p>Sayfayi yenileyip tekrar deneyin.</p></div>';
    });
}

// Database API wrapper
const DB = {
    // ==================
    // AUTH
    // ==================
    auth: {
        async signUp(email, password, username) {
            // Check if username is taken (use maybeSingle to avoid error on no match)
            try {
                const { data: existingUser } = await supabaseClient
                    .from('users')
                    .select('id')
                    .eq('username', username)
                    .maybeSingle();

                if (existingUser) {
                    throw new Error('Bu kullanici adi zaten kullaniliyor');
                }
            } catch (checkErr) {
                // If table doesn't exist or RLS blocks, log but continue with signup
                if (checkErr.message === 'Bu kullanici adi zaten kullaniliyor') throw checkErr;
                console.warn('Username check skipped:', checkErr.message);
            }

            const { data, error } = await supabaseClient.auth.signUp({
                email,
                password,
                options: {
                    data: { username },
                    emailRedirectTo: window.location.origin + window.location.pathname
                }
            });

            if (error) throw error;

            // If email confirmation is required, data.user exists but session is null
            if (data.user && !data.session) {
                // Try to create user profile anyway (trigger should handle it)
                try {
                    await supabaseClient.from('users').upsert({
                        id: data.user.id,
                        email: email,
                        username: username
                    }, { onConflict: 'id' });
                } catch (e) {
                    console.warn('User profile upsert warning:', e.message);
                }
                return data;
            }

            // If auto-confirmed (email confirmation disabled), create profile
            if (data.user) {
                try {
                    await supabaseClient.from('users').upsert({
                        id: data.user.id,
                        email: email,
                        username: username
                    }, { onConflict: 'id' });
                } catch (e) {
                    console.warn('User profile upsert warning:', e.message);
                }
            }

            return data;
        },

        async signIn(emailOrUsername, password) {
            let email = emailOrUsername;

            // Check if it's a username
            if (!emailOrUsername.includes('@')) {
                const { data: user, error: lookupError } = await supabaseClient
                    .from('users')
                    .select('email')
                    .eq('username', emailOrUsername)
                    .maybeSingle();

                if (lookupError || !user) {
                    throw new Error('Kullanici bulunamadi');
                }
                email = user.email;
            }

            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            // Update last login (don't block sign-in if this fails)
            try {
                await supabaseClient
                    .from('users')
                    .update({ last_login: new Date().toISOString() })
                    .eq('id', data.user.id);
            } catch (e) {
                console.warn('last_login update skipped:', e.message);
            }

            return data;
        },

        async signOut() {
            const { error } = await supabaseClient.auth.signOut();
            if (error) throw error;
        },

        async resetPassword(email) {
            const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`
            });
            if (error) throw error;
        },

        async updatePassword(newPassword) {
            const { error } = await supabaseClient.auth.updateUser({
                password: newPassword
            });
            if (error) throw error;
        },

        async getSession() {
            const { data, error } = await supabaseClient.auth.getSession();
            if (error) throw error;
            return data.session;
        },

        async getUser() {
            const { data: { user }, error } = await supabaseClient.auth.getUser();
            if (error) throw error;
            return user;
        },

        onAuthStateChange(callback) {
            return supabaseClient.auth.onAuthStateChange(callback);
        }
    },

    // ==================
    // USERS
    // ==================
    users: {
        async getProfile(userId) {
            const { data, error } = await supabaseClient
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;
            return data;
        },

        async updateProfile(userId, updates) {
            const { data, error } = await supabaseClient
                .from('users')
                .update(updates)
                .eq('id', userId)
                .select()
                .single();

            if (error) throw error;
            return data;
        },

        async updateSettings(userId, settings) {
            const { data, error } = await supabaseClient
                .from('users')
                .update({ settings })
                .eq('id', userId)
                .select()
                .single();

            if (error) throw error;
            return data;
        },

        async addPoints(userId, points) {
            const { data: user } = await supabaseClient
                .from('users')
                .select('total_points')
                .eq('id', userId)
                .single();

            const newPoints = Math.max(0, (user?.total_points || 0) + points);

            const { error } = await supabaseClient
                .from('users')
                .update({ total_points: newPoints })
                .eq('id', userId);

            if (error) throw error;
            return newPoints;
        },

        async updateStudyTime(userId, minutes) {
            const { data: user } = await supabaseClient
                .from('users')
                .select('total_study_time')
                .eq('id', userId)
                .single();

            const { error } = await supabaseClient
                .from('users')
                .update({
                    total_study_time: (user?.total_study_time || 0) + minutes
                })
                .eq('id', userId);

            if (error) throw error;
        },

        async updateStreak(userId, streak) {
            const { data: user } = await supabaseClient
                .from('users')
                .select('longest_streak')
                .eq('id', userId)
                .single();

            const longestStreak = Math.max(user?.longest_streak || 0, streak);

            const { error } = await supabaseClient
                .from('users')
                .update({
                    current_streak: streak,
                    longest_streak: longestStreak
                })
                .eq('id', userId);

            if (error) throw error;
        },

        async getLeaderboard(type = 'points', period = 'all', limit = 10) {
            let query = supabaseClient
                .from('users')
                .select('id, username, total_points, total_study_time')
                .eq('is_active', true);

            if (type === 'points') {
                query = query.order('total_points', { ascending: false });
            } else {
                query = query.order('total_study_time', { ascending: false });
            }

            const { data, error } = await query.limit(limit);
            if (error) throw error;
            return data;
        },

        async getUserRank(userId, type = 'points') {
            const column = type === 'points' ? 'total_points' : 'total_study_time';

            const { data: user } = await supabaseClient
                .from('users')
                .select(column)
                .eq('id', userId)
                .single();

            if (!user) return null;

            const { count } = await supabaseClient
                .from('users')
                .select('*', { count: 'exact', head: true })
                .gt(column, user[column]);

            return (count || 0) + 1;
        },

        async deleteAccount(userId) {
            const { error } = await supabaseClient
                .from('users')
                .update({ is_active: false })
                .eq('id', userId);

            if (error) throw error;

            await supabaseClient.auth.signOut();
        }
    },

    // ==================
    // LEVELS & WORDS
    // ==================
    levels: {
        async getAll() {
            const { data, error } = await supabaseClient
                .from('levels')
                .select('*')
                .order('order_index', { ascending: true });

            if (error) throw error;
            return data;
        },

        async getWords(levelId) {
            const { data, error } = await supabaseClient
                .from('words')
                .select('*')
                .eq('level_id', levelId)
                .order('id', { ascending: true });

            if (error) throw error;
            return data;
        },

        async getWordsInRange(startLevel, endLevel) {
            const { data, error } = await supabaseClient
                .from('words')
                .select('*, levels!inner(order_index)')
                .gte('levels.order_index', startLevel)
                .lte('levels.order_index', endLevel);

            if (error) throw error;
            return data;
        }
    },

    // ==================
    // USER PROGRESS
    // ==================
    progress: {
        async getLevelProgress(userId) {
            const { data, error } = await supabaseClient
                .from('user_level_progress')
                .select('*, levels(*)')
                .eq('user_id', userId);

            if (error) throw error;
            return data;
        },

        async getWordProgress(userId, levelId) {
            const { data, error } = await supabaseClient
                .from('user_word_progress')
                .select('*, words!inner(*)')
                .eq('user_id', userId)
                .eq('words.level_id', levelId);

            if (error) throw error;
            return data;
        },

        async initializeLevelProgress(userId, levelId) {
            const { data, error } = await supabaseClient
                .from('user_level_progress')
                .upsert({
                    user_id: userId,
                    level_id: levelId,
                    is_unlocked: true,
                    current_word_index: 0,
                    learned_words: [],
                    repeat_words: []
                }, { onConflict: 'user_id,level_id' })
                .select()
                .single();

            if (error) throw error;
            return data;
        },

        async updateLevelProgress(userId, levelId, updates) {
            const { data, error } = await supabaseClient
                .from('user_level_progress')
                .update(updates)
                .eq('user_id', userId)
                .eq('level_id', levelId)
                .select()
                .single();

            if (error) throw error;
            return data;
        },

        async markWordLearned(userId, wordId) {
            const { data, error } = await supabaseClient
                .from('user_word_progress')
                .upsert({
                    user_id: userId,
                    word_id: wordId,
                    is_learned: true,
                    learned_at: new Date().toISOString(),
                    next_review_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    review_count: 0
                }, { onConflict: 'user_id,word_id' })
                .select()
                .single();

            if (error) throw error;
            return data;
        },

        async getWordsForReview(userId) {
            const today = new Date().toISOString().split('T')[0];

            const { data, error } = await supabaseClient
                .from('user_word_progress')
                .select('*, words(*)')
                .eq('user_id', userId)
                .eq('is_learned', true)
                .lte('next_review_date', today);

            if (error) throw error;
            return data;
        },

        async updateReview(userId, wordId, success) {
            const { data: current } = await supabaseClient
                .from('user_word_progress')
                .select('review_count')
                .eq('user_id', userId)
                .eq('word_id', wordId)
                .single();

            const reviewCount = success ? (current?.review_count || 0) + 1 : 0;
            const intervalDays = CONFIG.SPACED_REPETITION[Math.min(reviewCount, CONFIG.SPACED_REPETITION.length - 1)];
            const nextReview = new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            const { error } = await supabaseClient
                .from('user_word_progress')
                .update({
                    review_count: reviewCount,
                    next_review_date: nextReview
                })
                .eq('user_id', userId)
                .eq('word_id', wordId);

            if (error) throw error;
        },

        async getTotalLearnedWords(userId) {
            const { count, error } = await supabaseClient
                .from('user_word_progress')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('is_learned', true);

            if (error) throw error;
            return count || 0;
        },

        async searchLearnedWords(userId, query) {
            const { data, error } = await supabaseClient
                .from('user_word_progress')
                .select('words(*)')
                .eq('user_id', userId)
                .eq('is_learned', true);

            if (error) throw error;

            // Filter client-side for flexibility
            const searchLower = query.toLowerCase();
            return data
                .map(p => p.words)
                .filter(w =>
                    w.english_word.toLowerCase().includes(searchLower) ||
                    w.turkish_meaning.toLowerCase().includes(searchLower)
                );
        }
    },

    // ==================
    // SENTENCES
    // ==================
    sentences: {
        async getRandom(difficulty, count, excludeIds = []) {
            let query = supabaseClient
                .from('translation_sentences')
                .select('*');

            if (difficulty && difficulty !== 'all') {
                query = query.eq('difficulty', difficulty);
            }

            if (excludeIds.length > 0) {
                query = query.not('id', 'in', `(${excludeIds.join(',')})`);
            }

            const { data, error } = await query.limit(count * 3); // Get more than needed for randomization

            if (error) throw error;

            // Shuffle and take requested count
            const shuffled = data.sort(() => Math.random() - 0.5);
            return shuffled.slice(0, count);
        }
    },

    // ==================
    // TESTS
    // ==================
    tests: {
        async saveResult(userId, result) {
            const { data, error } = await supabaseClient
                .from('test_results')
                .insert({
                    user_id: userId,
                    test_type: result.type,
                    category: result.category,
                    difficulty: result.difficulty,
                    total_questions: result.totalQuestions,
                    correct_answers: result.correctAnswers,
                    points_earned: result.points,
                    completed_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },

        async getHistory(userId, limit = 20) {
            const { data, error } = await supabaseClient
                .from('test_results')
                .select('*')
                .eq('user_id', userId)
                .order('completed_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data;
        },

        async getWeakWords(userId, limit = 20) {
            // This would need a more complex query or RPC function
            // For now, return from test history analysis
            const { data, error } = await supabaseClient
                .from('test_results')
                .select('*')
                .eq('user_id', userId)
                .order('completed_at', { ascending: false })
                .limit(100);

            if (error) throw error;
            return data;
        }
    },

    // ==================
    // DAILY STATS
    // ==================
    stats: {
        async getOrCreate(userId, date = null) {
            const targetDate = date || new Date().toISOString().split('T')[0];

            const { data: existing } = await supabaseClient
                .from('daily_stats')
                .select('*')
                .eq('user_id', userId)
                .eq('date', targetDate)
                .single();

            if (existing) return existing;

            const { data, error } = await supabaseClient
                .from('daily_stats')
                .insert({
                    user_id: userId,
                    date: targetDate,
                    points_earned: 0,
                    words_learned: 0,
                    study_time: 0,
                    tests_completed: 0
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },

        async update(userId, updates) {
            const today = new Date().toISOString().split('T')[0];
            await this.getOrCreate(userId, today); // Ensure exists

            const { data: current } = await supabaseClient
                .from('daily_stats')
                .select('*')
                .eq('user_id', userId)
                .eq('date', today)
                .single();

            const { error } = await supabaseClient
                .from('daily_stats')
                .update({
                    points_earned: (current?.points_earned || 0) + (updates.points || 0),
                    words_learned: (current?.words_learned || 0) + (updates.words || 0),
                    study_time: (current?.study_time || 0) + (updates.studyTime || 0),
                    tests_completed: (current?.tests_completed || 0) + (updates.tests || 0)
                })
                .eq('user_id', userId)
                .eq('date', today);

            if (error) throw error;
        },

        async getRange(userId, startDate, endDate) {
            const { data, error } = await supabaseClient
                .from('daily_stats')
                .select('*')
                .eq('user_id', userId)
                .gte('date', startDate)
                .lte('date', endDate)
                .order('date', { ascending: true });

            if (error) throw error;
            return data;
        },

        async getWeekly(userId) {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 7);

            return this.getRange(
                userId,
                startDate.toISOString().split('T')[0],
                endDate.toISOString().split('T')[0]
            );
        },

        async getMonthly(userId) {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 30);

            return this.getRange(
                userId,
                startDate.toISOString().split('T')[0],
                endDate.toISOString().split('T')[0]
            );
        }
    },

    // ==================
    // BADGES
    // ==================
    badges: {
        async getUserBadges(userId) {
            const { data, error } = await supabaseClient
                .from('user_badges')
                .select('*, badges(*)')
                .eq('user_id', userId);

            if (error) throw error;
            return data;
        },

        async awardBadge(userId, badgeId) {
            const { data, error } = await supabaseClient
                .from('user_badges')
                .upsert({
                    user_id: userId,
                    badge_id: badgeId,
                    earned_at: new Date().toISOString()
                }, { onConflict: 'user_id,badge_id' })
                .select()
                .single();

            if (error) throw error;
            return data;
        },

        async checkAndAward(userId, type, value) {
            // Check all badges of this type
            const allBadges = Object.values(CONFIG.BADGES);
            const matchingBadges = allBadges.filter(b => b.condition === type && value >= b.value);

            for (const badge of matchingBadges) {
                await this.awardBadge(userId, badge.id);
            }
        }
    },

    // ==================
    // GAME ROOMS
    // ==================
    rooms: {
        async create(hostUserId, settings) {
            const roomCode = this.generateRoomCode();

            const { data, error } = await supabaseClient
                .from('game_rooms')
                .insert({
                    room_code: roomCode,
                    host_user_id: hostUserId,
                    level_start: settings.levelStart,
                    level_end: settings.levelEnd,
                    category: settings.category,
                    question_count: settings.questionCount,
                    status: 'waiting',
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;

            // Add host as participant
            await this.joinRoom(data.id, hostUserId);

            return data;
        },

        generateRoomCode() {
            return Math.floor(10000 + Math.random() * 90000).toString();
        },

        async getByCode(code) {
            const { data, error } = await supabaseClient
                .from('game_rooms')
                .select('*')
                .eq('room_code', code)
                .eq('status', 'waiting')
                .single();

            if (error) return null;
            return data;
        },

        async joinRoom(roomId, userId) {
            const { data, error } = await supabaseClient
                .from('game_participants')
                .insert({
                    room_id: roomId,
                    user_id: userId,
                    score: 0
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },

        async leaveRoom(roomId, userId) {
            const { error } = await supabaseClient
                .from('game_participants')
                .delete()
                .eq('room_id', roomId)
                .eq('user_id', userId);

            if (error) throw error;
        },

        async getParticipants(roomId) {
            const { data, error } = await supabaseClient
                .from('game_participants')
                .select('*, users(username)')
                .eq('room_id', roomId);

            if (error) throw error;
            return data;
        },

        async updateStatus(roomId, status) {
            const { error } = await supabaseClient
                .from('game_rooms')
                .update({ status })
                .eq('id', roomId);

            if (error) throw error;
        },

        async updateScore(roomId, odId, score) {
            const { error } = await supabaseClient
                .from('game_participants')
                .update({ score })
                .eq('room_id', roomId)
                .eq('user_id', odId);

            if (error) throw error;
        },

        async setFinalRanks(roomId) {
            const { data: participants } = await supabaseClient
                .from('game_participants')
                .select('*')
                .eq('room_id', roomId)
                .order('score', { ascending: false });

            for (let i = 0; i < participants.length; i++) {
                await supabaseClient
                    .from('game_participants')
                    .update({ final_rank: i + 1 })
                    .eq('id', participants[i].id);
            }
        },

        async deleteRoom(roomId) {
            await supabaseClient.from('game_participants').delete().eq('room_id', roomId);
            await supabaseClient.from('game_rooms').delete().eq('id', roomId);
        },

        subscribeToRoom(roomId, callback) {
            return supabaseClient
                .channel(`room:${roomId}`)
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'game_participants',
                    filter: `room_id=eq.${roomId}`
                }, callback)
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'game_rooms',
                    filter: `id=eq.${roomId}`
                }, callback)
                .subscribe();
        },

        unsubscribe(channel) {
            supabaseClient.removeChannel(channel);
        }
    },

    // ==================
    // GAME HISTORY
    // ==================
    gameHistory: {
        async save(userId, result) {
            const { data, error } = await supabaseClient
                .from('game_history')
                .insert({
                    user_id: userId,
                    room_code: result.roomCode,
                    category: result.category,
                    question_count: result.questionCount,
                    participant_count: result.participantCount,
                    user_score: result.score,
                    user_rank: result.rank,
                    played_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },

        async getHistory(userId, limit = 20) {
            const { data, error } = await supabaseClient
                .from('game_history')
                .select('*')
                .eq('user_id', userId)
                .order('played_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data;
        }
    },

    // ==================
    // FORUM
    // ==================
    forum: {
        async getTopics() {
            const { data, error } = await supabaseClient
                .from('forum_topics')
                .select('*, forum_posts(count)')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        },

        async getTopic(topicId) {
            const { data, error } = await supabaseClient
                .from('forum_topics')
                .select('*')
                .eq('id', topicId)
                .single();

            if (error) throw error;
            return data;
        },

        async getPosts(topicId) {
            const { data, error } = await supabaseClient
                .from('forum_posts')
                .select('*, users(username)')
                .eq('topic_id', topicId)
                .eq('is_approved', true)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        },

        async createPost(userId, topicId, title, content) {
            const { data, error } = await supabaseClient
                .from('forum_posts')
                .insert({
                    topic_id: topicId,
                    user_id: userId,
                    title,
                    content,
                    is_approved: false,
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },

        async getComments(postId) {
            const { data, error } = await supabaseClient
                .from('forum_comments')
                .select('*, users(username)')
                .eq('post_id', postId)
                .eq('is_approved', true)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data;
        },

        async addComment(userId, postId, content) {
            const { data, error } = await supabaseClient
                .from('forum_comments')
                .insert({
                    post_id: postId,
                    user_id: userId,
                    content,
                    is_approved: false,
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },

        async likePost(postId, increment = 1) {
            const { data: post } = await supabaseClient
                .from('forum_posts')
                .select('likes')
                .eq('id', postId)
                .single();

            const { error } = await supabaseClient
                .from('forum_posts')
                .update({ likes: (post?.likes || 0) + increment })
                .eq('id', postId);

            if (error) throw error;
        },

        async dislikePost(postId, increment = 1) {
            const { data: post } = await supabaseClient
                .from('forum_posts')
                .select('dislikes')
                .eq('id', postId)
                .single();

            const { error } = await supabaseClient
                .from('forum_posts')
                .update({ dislikes: (post?.dislikes || 0) + increment })
                .eq('id', postId);

            if (error) throw error;
        }
    },

    // ==================
    // MESSAGES
    // ==================
    messages: {
        async getForUser(userId) {
            const { data, error } = await supabaseClient
                .from('system_messages')
                .select('*')
                .or(`to_user.eq.${userId},to_user.is.null`)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        },

        async markAsRead(messageId, userId) {
            const { error } = await supabaseClient
                .from('system_messages')
                .update({ is_read: true })
                .eq('id', messageId)
                .eq('to_user', userId);

            if (error) throw error;
        },

        async getUnreadCount(userId) {
            const { count, error } = await supabaseClient
                .from('system_messages')
                .select('*', { count: 'exact', head: true })
                .or(`to_user.eq.${userId},to_user.is.null`)
                .eq('is_read', false);

            if (error) throw error;
            return count || 0;
        }
    },

    // ==================
    // ADMIN
    // ==================
    admin: {
        async isAdmin(userId) {
            const { data } = await supabaseClient
                .from('users')
                .select('is_admin')
                .eq('id', userId)
                .single();

            return data?.is_admin || false;
        },

        async getAllUsers(search = '', limit = 50) {
            let query = supabaseClient
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });

            if (search) {
                query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%`);
            }

            const { data, error } = await query.limit(limit);
            if (error) throw error;
            return data;
        },

        async uploadWords(levelName, words) {
            // Create level
            const { data: existingLevels } = await supabaseClient
                .from('levels')
                .select('order_index')
                .order('order_index', { ascending: false })
                .limit(1);

            const nextOrder = (existingLevels?.[0]?.order_index || 0) + 1;

            const { data: level, error: levelError } = await supabaseClient
                .from('levels')
                .insert({
                    name: levelName || `Seviye ${nextOrder}`,
                    order_index: nextOrder,
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (levelError) throw levelError;

            // Insert words
            const wordsToInsert = words.map(w => ({
                level_id: level.id,
                english_word: w.english_word,
                turkish_meaning: w.turkish_meaning,
                pronunciation: w.pronunciation || '',
                memory_sentence: w.memory_sentence || '',
                example_sentence: w.example_sentence || '',
                created_at: new Date().toISOString()
            }));

            const { error: wordsError } = await supabaseClient
                .from('words')
                .insert(wordsToInsert);

            if (wordsError) throw wordsError;

            return level;
        },

        async uploadSentences(sentences) {
            const toInsert = sentences.map(s => ({
                turkish_sentence: s.turkish_sentence,
                english_sentence: s.english_sentence,
                difficulty: s.difficulty || 'medium',
                created_at: new Date().toISOString()
            }));

            const { data, error } = await supabaseClient
                .from('translation_sentences')
                .insert(toInsert)
                .select();

            if (error) throw error;
            return data;
        },

        async updateWord(wordId, updates) {
            const { data, error } = await supabaseClient
                .from('words')
                .update(updates)
                .eq('id', wordId)
                .select()
                .single();

            if (error) throw error;
            return data;
        },

        async uploadWordImage(wordId, file) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${wordId}.${fileExt}`;

            const { data, error } = await supabaseClient.storage
                .from('word-images')
                .upload(fileName, file, { upsert: true });

            if (error) throw error;

            const { data: urlData } = supabaseClient.storage
                .from('word-images')
                .getPublicUrl(fileName);

            await supabaseClient
                .from('words')
                .update({ image_url: urlData.publicUrl })
                .eq('id', wordId);

            return urlData.publicUrl;
        },

        async getPendingPosts() {
            const { data, error } = await supabaseClient
                .from('forum_posts')
                .select('*, users(username)')
                .eq('is_approved', false)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        },

        async getPendingComments() {
            const { data, error } = await supabaseClient
                .from('forum_comments')
                .select('*, users(username), forum_posts(title)')
                .eq('is_approved', false)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        },

        async approvePost(postId) {
            const { error } = await supabaseClient
                .from('forum_posts')
                .update({ is_approved: true })
                .eq('id', postId);

            if (error) throw error;
        },

        async approveComment(commentId) {
            const { error } = await supabaseClient
                .from('forum_comments')
                .update({ is_approved: true })
                .eq('id', commentId);

            if (error) throw error;
        },

        async deletePost(postId) {
            await supabaseClient.from('forum_comments').delete().eq('post_id', postId);
            const { error } = await supabaseClient.from('forum_posts').delete().eq('id', postId);
            if (error) throw error;
        },

        async deleteComment(commentId) {
            const { error } = await supabaseClient.from('forum_comments').delete().eq('id', commentId);
            if (error) throw error;
        },

        async sendMessage(toUserId, title, content) {
            const { data: admin } = await supabaseClient.auth.getUser();

            const { data, error } = await supabaseClient
                .from('system_messages')
                .insert({
                    from_admin: admin.user.id,
                    to_user: toUserId,
                    title,
                    content,
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },

        async sendBroadcast(title, content) {
            const { data: admin } = await supabaseClient.auth.getUser();

            const { data, error } = await supabaseClient
                .from('system_messages')
                .insert({
                    from_admin: admin.user.id,
                    to_user: null,
                    title,
                    content,
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },

        async getStats() {
            const [
                { count: totalUsers },
                { count: totalWords },
                { count: totalSentences },
                { count: pendingPosts },
                { count: pendingComments }
            ] = await Promise.all([
                supabaseClient.from('users').select('*', { count: 'exact', head: true }),
                supabaseClient.from('words').select('*', { count: 'exact', head: true }),
                supabaseClient.from('translation_sentences').select('*', { count: 'exact', head: true }),
                supabaseClient.from('forum_posts').select('*', { count: 'exact', head: true }).eq('is_approved', false),
                supabaseClient.from('forum_comments').select('*', { count: 'exact', head: true }).eq('is_approved', false)
            ]);

            // Active users (last 7 days)
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            const { count: activeUsers } = await supabaseClient
                .from('users')
                .select('*', { count: 'exact', head: true })
                .gte('last_login', weekAgo.toISOString());

            // Levels count
            const { count: totalLevels } = await supabaseClient
                .from('levels')
                .select('*', { count: 'exact', head: true });

            return {
                totalUsers: totalUsers || 0,
                activeUsers: activeUsers || 0,
                totalWords: totalWords || 0,
                totalLevels: totalLevels || 0,
                totalSentences: totalSentences || 0,
                pendingPosts: pendingPosts || 0,
                pendingComments: pendingComments || 0
            };
        },

        async banUser(userId) {
            const { error } = await supabaseClient
                .from('users')
                .update({ is_active: false })
                .eq('id', userId);

            if (error) throw error;
        },

        async unbanUser(userId) {
            const { error } = await supabaseClient
                .from('users')
                .update({ is_active: true })
                .eq('id', userId);

            if (error) throw error;
        }
    }
};
