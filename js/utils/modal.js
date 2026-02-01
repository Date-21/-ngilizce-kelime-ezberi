// VocabMaster Pro - Modal System

const Modal = {
    confirmModal: null,
    confirmResolve: null,

    init() {
        this.confirmModal = document.getElementById('confirm-modal');
        if (!this.confirmModal) return;

        // Setup event listeners
        this.confirmModal.querySelector('.modal-backdrop').addEventListener('click', () => {
            this.closeConfirm(false);
        });

        document.getElementById('confirm-cancel').addEventListener('click', () => {
            this.closeConfirm(false);
        });

        document.getElementById('confirm-ok').addEventListener('click', () => {
            this.closeConfirm(true);
        });

        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.confirmModal.classList.contains('hidden')) {
                this.closeConfirm(false);
            }
        });
    },

    confirm(message, title = 'Onay', okText = 'Tamam', cancelText = 'Iptal') {
        return new Promise((resolve) => {
            this.confirmResolve = resolve;

            document.getElementById('confirm-title').textContent = title;
            document.getElementById('confirm-message').textContent = message;
            document.getElementById('confirm-ok').textContent = okText;
            document.getElementById('confirm-cancel').textContent = cancelText;

            this.confirmModal.classList.remove('hidden');
            document.getElementById('confirm-ok').focus();
        });
    },

    closeConfirm(result) {
        this.confirmModal.classList.add('hidden');
        if (this.confirmResolve) {
            this.confirmResolve(result);
            this.confirmResolve = null;
        }
    },

    // Create custom modal
    create(options) {
        const {
            title = '',
            content = '',
            actions = [],
            closable = true,
            size = 'medium' // small, medium, large, fullscreen
        } = options;

        const modal = document.createElement('div');
        modal.className = 'modal custom-modal';
        modal.innerHTML = `
            <div class="modal-backdrop"></div>
            <div class="modal-content modal-${size}">
                ${title ? `
                    <div class="modal-header">
                        <h3 class="modal-title">${title}</h3>
                        ${closable ? `
                            <button class="modal-close icon-btn" aria-label="Kapat">
                                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="6" x2="6" y2="18"/>
                                    <line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                            </button>
                        ` : ''}
                    </div>
                ` : ''}
                <div class="modal-body">
                    ${content}
                </div>
                ${actions.length > 0 ? `
                    <div class="modal-actions">
                        ${actions.map(action => `
                            <button class="btn ${action.class || 'btn-secondary'}" data-action="${action.id}">
                                ${action.label}
                            </button>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;

        // Event handlers
        if (closable) {
            modal.querySelector('.modal-backdrop').addEventListener('click', () => {
                this.close(modal);
            });

            const closeBtn = modal.querySelector('.modal-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    this.close(modal);
                });
            }
        }

        // Action handlers
        actions.forEach(action => {
            const btn = modal.querySelector(`[data-action="${action.id}"]`);
            if (btn && action.handler) {
                btn.addEventListener('click', () => {
                    action.handler(modal);
                });
            }
        });

        document.body.appendChild(modal);

        // Animate in
        requestAnimationFrame(() => {
            modal.querySelector('.modal-content').classList.add('animate-scale-in');
        });

        return modal;
    },

    close(modal) {
        if (!modal) return;

        const content = modal.querySelector('.modal-content');
        content.classList.remove('animate-scale-in');
        content.classList.add('animate-scale-out');

        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 250);
    },

    // Loading modal
    showLoading(message = 'Yukleniyor...') {
        const modal = this.create({
            content: `
                <div style="text-align: center; padding: var(--spacing-xl);">
                    <div class="loading-spinner" style="margin: 0 auto var(--spacing-lg);"></div>
                    <p>${message}</p>
                </div>
            `,
            closable: false,
            size: 'small'
        });

        modal.classList.add('loading-modal');
        return modal;
    },

    // Alert modal
    alert(message, title = 'Bilgi') {
        return new Promise((resolve) => {
            this.create({
                title,
                content: `<p>${message}</p>`,
                actions: [
                    {
                        id: 'ok',
                        label: 'Tamam',
                        class: 'btn-primary',
                        handler: (modal) => {
                            this.close(modal);
                            resolve();
                        }
                    }
                ],
                size: 'small'
            });
        });
    },

    // Prompt modal
    prompt(message, title = 'Giris', defaultValue = '') {
        return new Promise((resolve) => {
            const modal = this.create({
                title,
                content: `
                    <p style="margin-bottom: var(--spacing-md);">${message}</p>
                    <input type="text" class="form-input prompt-input" value="${defaultValue}">
                `,
                actions: [
                    {
                        id: 'cancel',
                        label: 'Iptal',
                        class: 'btn-secondary',
                        handler: (modal) => {
                            this.close(modal);
                            resolve(null);
                        }
                    },
                    {
                        id: 'ok',
                        label: 'Tamam',
                        class: 'btn-primary',
                        handler: (modal) => {
                            const value = modal.querySelector('.prompt-input').value;
                            this.close(modal);
                            resolve(value);
                        }
                    }
                ],
                size: 'small'
            });

            // Focus input and select text
            const input = modal.querySelector('.prompt-input');
            input.focus();
            input.select();

            // Enter key to submit
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.close(modal);
                    resolve(input.value);
                }
            });
        });
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => Modal.init());

// Make globally available
window.Modal = Modal;

// Add additional modal styles
const modalStyles = document.createElement('style');
modalStyles.textContent = `
    .custom-modal .modal-content {
        animation: scaleIn 0.2s ease-out;
    }

    .custom-modal .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-bottom: var(--spacing-md);
        border-bottom: 1px solid var(--border-light);
        margin-bottom: var(--spacing-lg);
    }

    .custom-modal .modal-title {
        font-size: var(--font-size-xl);
        font-weight: var(--font-weight-semibold);
        margin: 0;
    }

    .custom-modal .modal-close {
        margin: calc(var(--spacing-md) * -1);
    }

    .custom-modal .modal-body {
        color: var(--text-secondary);
    }

    .modal-small {
        max-width: 360px;
    }

    .modal-medium {
        max-width: 500px;
    }

    .modal-large {
        max-width: 700px;
    }

    .modal-fullscreen {
        max-width: calc(100vw - var(--spacing-xl) * 2);
        max-height: calc(100vh - var(--spacing-xl) * 2);
        width: 100%;
        height: 100%;
    }

    .loading-modal .modal-content {
        background: var(--bg-card);
    }
`;
document.head.appendChild(modalStyles);
