// VocabMaster Pro - Forum Page

const ForumPage = {
    currentTopic: null,
    currentPost: null,

    async render() {
        const container = document.createElement('div');
        container.className = 'forum-page page-enter';

        container.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">Forum</h1>
                <p class="page-subtitle">Goruslerini paylas, tartismalara katil</p>
            </div>

            <div id="forum-content">
                ${this.renderTopicsLoading()}
            </div>
        `;

        await this.loadTopics(container);
        return container;
    },

    renderTopicsLoading() {
        return `
            <div class="forum-topics">
                ${[1, 2, 3].map(() => `
                    <div class="card" style="padding: var(--spacing-lg);">
                        <div class="skeleton skeleton-text lg" style="width: 60%;"></div>
                        <div class="skeleton skeleton-text" style="width: 40%; margin-top: var(--spacing-sm);"></div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    async loadTopics(container) {
        const content = container.querySelector('#forum-content');

        try {
            const topics = await DB.forum.getTopics();

            if (topics.length === 0) {
                content.innerHTML = `
                    <div class="empty-state">
                        <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                        <h3 class="empty-state-title">Henuz konu yok</h3>
                        <p class="empty-state-text">Forum konulari admin tarafindan eklenir</p>
                    </div>
                    <div style="text-align: center; margin-top: var(--spacing-xl);">
                        <button class="btn btn-primary" id="new-suggestion">Gorus / Oneri Gonder</button>
                    </div>
                `;

                content.querySelector('#new-suggestion')?.addEventListener('click', () => {
                    this.showNewSuggestion(container);
                });
                return;
            }

            content.innerHTML = `
                <div style="display: flex; justify-content: flex-end; margin-bottom: var(--spacing-lg);">
                    <button class="btn btn-primary" id="new-suggestion">Gorus / Oneri Gonder</button>
                </div>
                <div class="forum-topics">
                    ${topics.map(topic => `
                        <div class="forum-topic" data-topic-id="${topic.id}">
                            <h3 class="forum-topic-title">${Helpers.escapeHtml(topic.title)}</h3>
                            <div class="forum-topic-meta">
                                <span>${Helpers.formatDate(topic.created_at)}</span>
                                <span>${topic.forum_posts?.[0]?.count || 0} yorum</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;

            // Topic click
            content.querySelectorAll('.forum-topic').forEach(el => {
                el.addEventListener('click', () => {
                    const topicId = parseInt(el.dataset.topicId);
                    this.showTopic(container, topicId);
                });
            });

            content.querySelector('#new-suggestion')?.addEventListener('click', () => {
                this.showNewSuggestion(container);
            });

        } catch (error) {
            content.innerHTML = `
                <div class="empty-state">
                    <h3 class="empty-state-title">Yuklenemedi</h3>
                    <p class="empty-state-text">Lutfen tekrar deneyin</p>
                    <button class="btn btn-secondary" id="retry-forum">Tekrar Dene</button>
                </div>
            `;
            content.querySelector('#retry-forum')?.addEventListener('click', () => {
                this.loadTopics(container);
            });
        }
    },

    async showTopic(container, topicId) {
        const content = container.querySelector('#forum-content');
        content.innerHTML = '<div style="text-align: center; padding: var(--spacing-xl);"><div class="loading-spinner" style="margin: 0 auto;"></div></div>';

        try {
            const topic = await DB.forum.getTopic(topicId);
            const posts = await DB.forum.getPosts(topicId);

            this.currentTopic = topic;

            content.innerHTML = `
                <button class="btn btn-ghost" id="back-to-topics" style="margin-bottom: var(--spacing-lg);">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                    Konulara Don
                </button>

                <div class="forum-post" style="border-left: 4px solid var(--accent-primary);">
                    <div class="forum-post-header">
                        <h2 style="font-size: var(--font-size-xl);">${Helpers.escapeHtml(topic.title)}</h2>
                        <span class="forum-post-date">${Helpers.formatDate(topic.created_at)}</span>
                    </div>
                    <div class="forum-post-content">${Helpers.escapeHtml(topic.content || '')}</div>
                </div>

                <h3 style="margin: var(--spacing-xl) 0 var(--spacing-lg);">
                    Gorusler & Yorumlar (${posts.length})
                </h3>

                <div id="posts-list">
                    ${posts.length === 0 ? `
                        <p style="color: var(--text-tertiary); text-align: center; padding: var(--spacing-xl);">
                            Henuz gorus yazilmamis. Ilk sen yaz!
                        </p>
                    ` : posts.map(post => this.renderPost(post)).join('')}
                </div>

                <div class="card" style="margin-top: var(--spacing-xl);">
                    <h4 style="margin-bottom: var(--spacing-md);">Gorusunuzu Yazin</h4>
                    <div class="form-group">
                        <input type="text" class="form-input" id="post-title" placeholder="Baslik">
                    </div>
                    <div class="form-group" style="margin-top: var(--spacing-md);">
                        <textarea class="form-input form-textarea" id="post-content" placeholder="Gorusunuzu yazin..."></textarea>
                    </div>
                    <button class="btn btn-primary" id="submit-post" style="margin-top: var(--spacing-md);">Gonder</button>
                </div>
            `;

            // Back button
            content.querySelector('#back-to-topics').addEventListener('click', () => {
                this.loadTopics(container);
            });

            // Submit post
            content.querySelector('#submit-post').addEventListener('click', () => {
                this.submitPost(container, topicId);
            });

            // Like/dislike handlers
            this.setupPostActions(content);

        } catch (error) {
            Toast.error('Konu yuklenemedi');
            this.loadTopics(container);
        }
    },

    renderPost(post) {
        return `
            <div class="forum-post" data-post-id="${post.id}">
                <div class="forum-post-header">
                    <div class="forum-post-author">
                        <div class="avatar sm">${Helpers.getInitials(post.users?.username || '?')}</div>
                        <div>
                            <div class="forum-post-author-name">${Helpers.escapeHtml(post.users?.username || 'Anonim')}</div>
                            <div class="forum-post-date">${Helpers.formatRelativeTime(post.created_at)}</div>
                        </div>
                    </div>
                </div>
                ${post.title ? `<h4 style="margin-bottom: var(--spacing-sm);">${Helpers.escapeHtml(post.title)}</h4>` : ''}
                <div class="forum-post-content">${Helpers.escapeHtml(post.content)}</div>
                <div class="forum-post-actions">
                    <button class="forum-action-btn like-btn" data-post-id="${post.id}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                        </svg>
                        <span>${post.likes || 0}</span>
                    </button>
                    <button class="forum-action-btn dislike-btn" data-post-id="${post.id}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
                        </svg>
                        <span>${post.dislikes || 0}</span>
                    </button>
                    <button class="forum-action-btn comment-btn" data-post-id="${post.id}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                        Yorum
                    </button>
                </div>
                <div class="forum-comments hidden" id="comments-${post.id}">
                    <div class="loading-spinner small" style="margin: var(--spacing-md) auto;"></div>
                </div>
            </div>
        `;
    },

    setupPostActions(content) {
        // Like buttons
        content.querySelectorAll('.like-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const postId = parseInt(btn.dataset.postId);
                try {
                    await DB.forum.likePost(postId);
                    const countEl = btn.querySelector('span');
                    countEl.textContent = parseInt(countEl.textContent) + 1;
                    btn.classList.add('active');
                } catch (error) {
                    Toast.error('Islem basarisiz');
                }
            });
        });

        // Dislike buttons
        content.querySelectorAll('.dislike-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const postId = parseInt(btn.dataset.postId);
                try {
                    await DB.forum.dislikePost(postId);
                    const countEl = btn.querySelector('span');
                    countEl.textContent = parseInt(countEl.textContent) + 1;
                    btn.classList.add('active');
                } catch (error) {
                    Toast.error('Islem basarisiz');
                }
            });
        });

        // Comment buttons
        content.querySelectorAll('.comment-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const postId = parseInt(btn.dataset.postId);
                const commentsEl = content.querySelector(`#comments-${postId}`);
                commentsEl.classList.toggle('hidden');

                if (!commentsEl.classList.contains('hidden')) {
                    await this.loadComments(commentsEl, postId);
                }
            });
        });
    },

    async loadComments(container, postId) {
        try {
            const comments = await DB.forum.getComments(postId);

            container.innerHTML = `
                ${comments.length === 0 ? '<p style="color: var(--text-tertiary); padding: var(--spacing-md);">Henuz yorum yok</p>' :
                    comments.map(c => `
                        <div class="forum-comment">
                            <div style="display: flex; align-items: center; gap: var(--spacing-sm); margin-bottom: var(--spacing-sm);">
                                <div class="avatar sm" style="width: 24px; height: 24px; font-size: 10px;">
                                    ${Helpers.getInitials(c.users?.username || '?')}
                                </div>
                                <strong style="font-size: var(--font-size-sm);">${Helpers.escapeHtml(c.users?.username || 'Anonim')}</strong>
                                <span style="font-size: var(--font-size-xs); color: var(--text-tertiary);">${Helpers.formatRelativeTime(c.created_at)}</span>
                            </div>
                            <p style="font-size: var(--font-size-sm);">${Helpers.escapeHtml(c.content)}</p>
                        </div>
                    `).join('')}
                <div style="display: flex; gap: var(--spacing-sm); margin-top: var(--spacing-md);">
                    <input type="text" class="form-input" placeholder="Yorum yaz..." id="comment-input-${postId}">
                    <button class="btn btn-sm btn-primary comment-submit" data-post-id="${postId}">Gonder</button>
                </div>
            `;

            container.querySelector(`.comment-submit`)?.addEventListener('click', async () => {
                const input = container.querySelector(`#comment-input-${postId}`);
                const text = input.value.trim();
                if (!text) return;

                try {
                    await DB.forum.addComment(Auth.user.id, postId, text);
                    input.value = '';
                    Toast.success('Yorumunuz onaya gonderildi');
                } catch (error) {
                    Toast.error('Yorum gonderilemedi');
                }
            });
        } catch (error) {
            container.innerHTML = '<p style="color: var(--text-tertiary); padding: var(--spacing-md);">Yorumlar yuklenemedi</p>';
        }
    },

    async submitPost(container, topicId) {
        const title = container.querySelector('#post-title').value.trim();
        const content = container.querySelector('#post-content').value.trim();

        if (!content) {
            Toast.warning('Lutfen gorusunuzu yazin');
            return;
        }

        const submitBtn = container.querySelector('#submit-post');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Gonderiliyor...';

        try {
            await DB.forum.createPost(Auth.user.id, topicId, title, content);
            Toast.success('Gorusunuz yonetici onayina gonderildi');
            container.querySelector('#post-title').value = '';
            container.querySelector('#post-content').value = '';
        } catch (error) {
            Toast.error('Gonderilemedi');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Gonder';
        }
    },

    showNewSuggestion(container) {
        Modal.create({
            title: 'Gorus / Oneri Gonder',
            content: `
                <div class="form-group">
                    <label class="form-label">Baslik</label>
                    <input type="text" class="form-input" id="suggestion-title" placeholder="Onerinizin basligi">
                </div>
                <div class="form-group" style="margin-top: var(--spacing-md);">
                    <label class="form-label">Icerik</label>
                    <textarea class="form-input form-textarea" id="suggestion-content" placeholder="Gorusunuzu detayli yazin..."></textarea>
                </div>
            `,
            actions: [
                {
                    id: 'cancel',
                    label: 'Iptal',
                    class: 'btn-secondary',
                    handler: (m) => Modal.close(m)
                },
                {
                    id: 'submit',
                    label: 'Gonder',
                    class: 'btn-primary',
                    handler: async (m) => {
                        const title = m.querySelector('#suggestion-title').value.trim();
                        const content = m.querySelector('#suggestion-content').value.trim();

                        if (!title || !content) {
                            Toast.warning('Tum alanlari doldurun');
                            return;
                        }

                        try {
                            // Create as a post under a general topic or standalone
                            await DB.forum.createPost(Auth.user.id, null, title, content);
                            Toast.success('Oneriniz yonetici onayina gonderildi');
                            Modal.close(m);
                        } catch (error) {
                            Toast.error('Gonderilemedi');
                        }
                    }
                }
            ]
        });
    },

    cleanup() {
        this.currentTopic = null;
        this.currentPost = null;
    }
};

window.ForumPage = ForumPage;
