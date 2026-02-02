// VocabMaster Pro - Admin Panel Page (Enhanced with Column Mapping)

const AdminPage = {
    currentSection: 'dashboard',
    uploadedData: null,
    columnHeaders: [],

    async render() {
        const container = document.createElement('div');
        container.className = 'admin-page page-enter';

        // Check admin status
        if (!Auth.isAdmin) {
            container.innerHTML = `
                <div class="empty-state" style="min-height: 60vh;">
                    <h3 class="empty-state-title">Erisim Engellendi</h3>
                    <p class="empty-state-text">Bu sayfaya erisim yetkiniz yok</p>
                    <button class="btn btn-primary" onclick="Router.navigate('home')">Ana Sayfaya Don</button>
                </div>
            `;
            return container;
        }

        container.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">Admin Paneli</h1>
                <button class="btn btn-ghost" onclick="Router.navigate('profile')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                    Geri
                </button>
            </div>

            <nav class="admin-nav">
                <button class="admin-nav-item active" data-section="dashboard">Dashboard</button>
                <button class="admin-nav-item" data-section="words">Kelimeler</button>
                <button class="admin-nav-item" data-section="sentences">Cumleler</button>
                <button class="admin-nav-item" data-section="images">Gorseller</button>
                <button class="admin-nav-item" data-section="users">Kullanicilar</button>
                <button class="admin-nav-item" data-section="forum">Forum</button>
                <button class="admin-nav-item" data-section="messages">Mesajlar</button>
                <button class="admin-nav-item" data-section="settings">Ayarlar</button>
            </nav>

            <div id="admin-content"></div>
        `;

        // Nav event listeners
        container.querySelectorAll('.admin-nav-item').forEach(btn => {
            btn.addEventListener('click', () => {
                container.querySelectorAll('.admin-nav-item').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentSection = btn.dataset.section;
                this.loadSection(container);
            });
        });

        await this.loadSection(container);
        return container;
    },

    async loadSection(container) {
        const content = container.querySelector('#admin-content');
        content.innerHTML = '<div class="loading-spinner" style="margin: var(--spacing-2xl) auto;"></div>';

        switch (this.currentSection) {
            case 'dashboard': await this.renderDashboard(content); break;
            case 'words': this.renderWords(content); break;
            case 'sentences': this.renderSentences(content); break;
            case 'images': await this.renderImages(content); break;
            case 'users': await this.renderUsers(content); break;
            case 'forum': await this.renderForum(content); break;
            case 'messages': this.renderMessages(content); break;
            case 'settings': this.renderSettings(content); break;
        }
    },

    async renderDashboard(content) {
        try {
            const stats = await DB.admin.getStats();
            content.innerHTML = `
                <div class="admin-section">
                    <h2 class="admin-section-title" style="margin-bottom: var(--spacing-xl);">Genel Bakis</h2>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-label">Toplam Kullanici</div>
                            <div class="stat-value">${stats.totalUsers}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-label">Aktif (7 gun)</div>
                            <div class="stat-value">${stats.activeUsers}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-label">Toplam Kelime</div>
                            <div class="stat-value">${stats.totalWords}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-label">Toplam Seviye</div>
                            <div class="stat-value">${stats.totalLevels}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-label">Toplam Cumle</div>
                            <div class="stat-value">${stats.totalSentences}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-label">Bekleyen Icerik</div>
                            <div class="stat-value" style="color: var(--warning);">${stats.pendingPosts + stats.pendingComments}</div>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            content.innerHTML = '<p style="text-align: center; color: var(--error);">Dashboard yuklenemedi</p>';
        }
    },

    // ==========================================
    // WORDS SECTION WITH COLUMN MAPPING
    // ==========================================
    renderWords(content) {
        content.innerHTML = `
            <div class="admin-section">
                <div class="admin-section-header">
                    <h2 class="admin-section-title">Kelime Yonetimi</h2>
                </div>

                <div class="upload-area" id="word-upload-area">
                    <svg class="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <p class="upload-text">Excel, CSV veya Google Sheets dosyasini surukleyin</p>
                    <p class="upload-hint">Desteklenen formatlar: .xlsx, .xls, .csv, .ods</p>
                    <input type="file" id="word-file-input" accept=".csv,.xlsx,.xls,.ods" style="display: none;">
                </div>

                <div id="column-mapping-section" class="hidden" style="margin-top: var(--spacing-xl);"></div>
                <div id="word-preview" class="hidden" style="margin-top: var(--spacing-xl);"></div>

                <div style="margin-top: var(--spacing-xl);">
                    <h3 style="margin-bottom: var(--spacing-md);">Mevcut Seviyeler ve Kelimeler</h3>
                    <div id="word-list">
                        <div class="skeleton skeleton-text"></div>
                    </div>
                </div>
            </div>
        `;

        const uploadArea = content.querySelector('#word-upload-area');
        const fileInput = content.querySelector('#word-file-input');

        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.classList.add('dragover'); });
        uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            if (e.dataTransfer.files.length) this.handleWordFile(content, e.dataTransfer.files[0]);
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length) this.handleWordFile(content, e.target.files[0]);
        });

        this.loadWordList(content);
    },

    async handleWordFile(content, file) {
        const mappingSection = content.querySelector('#column-mapping-section');
        mappingSection.innerHTML = '<div class="loading-spinner"></div>';
        mappingSection.classList.remove('hidden');

        try {
            // Parse file to get headers and data
            const { headers, data } = await this.parseFileWithHeaders(file);
            
            if (data.length === 0) {
                Toast.error('Dosyada veri bulunamadi');
                mappingSection.classList.add('hidden');
                return;
            }

            this.uploadedData = data;
            this.columnHeaders = headers;

            // Show column mapping UI
            this.showWordColumnMapping(content, headers, data);

        } catch (error) {
            Toast.error('Dosya okunamadi: ' + error.message);
            mappingSection.classList.add('hidden');
        }
    },

    async parseFileWithHeaders(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
                    
                    if (jsonData.length < 2) {
                        reject(new Error('Dosyada yeterli veri yok'));
                        return;
                    }
                    
                    const headers = jsonData[0].map((h, i) => ({
                        index: i,
                        name: String(h || `Sutun ${i + 1}`).trim(),
                        sample: String(jsonData[1]?.[i] || '').substring(0, 30)
                    }));
                    
                    const rows = jsonData.slice(1).filter(row => row.some(cell => cell !== ''));
                    
                    resolve({ headers, data: rows });
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = () => reject(new Error('Dosya okunamadi'));
            reader.readAsArrayBuffer(file);
        });
    },

    showWordColumnMapping(content, headers, data) {
        const mappingSection = content.querySelector('#column-mapping-section');
        const preview = content.querySelector('#word-preview');
        
        const fields = [
            { id: 'english_word', label: 'Ingilizce Kelime', required: true },
            { id: 'turkish_meaning', label: 'Turkce Anlam', required: true },
            { id: 'pronunciation', label: 'Okunusu', required: false },
            { id: 'memory_sentence', label: 'Hafiza Cumlesi', required: false },
            { id: 'example_sentence', label: 'Ornek Cumle', required: false }
        ];

        const optionsHtml = headers.map(h => 
            `<option value="${h.index}">${Helpers.escapeHtml(h.name)} (ornek: ${Helpers.escapeHtml(h.sample)}...)</option>`
        ).join('');

        mappingSection.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Sutun Eslestirme</h3>
                </div>
                <div class="card-body">
                    <p style="color: var(--text-secondary); margin-bottom: var(--spacing-lg);">
                        Dosyanizda ${data.length} satir veri bulundu. Lutfen her alanin hangi sutuna karsilik geldigini secin.
                    </p>
                    
                    <div class="column-mapping-grid">
                        ${fields.map(field => `
                            <div class="form-group">
                                <label class="form-label">
                                    ${field.label} ${field.required ? '<span style="color: var(--error);">*</span>' : '(opsiyonel)'}
                                </label>
                                <select class="form-input" id="map-${field.id}" data-field="${field.id}">
                                    <option value="-1">-- Secin --</option>
                                    ${optionsHtml}
                                </select>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="form-group" style="margin-top: var(--spacing-lg);">
                        <label class="form-label">Seviye Secimi <span style="color: var(--error);">*</span></label>
                        <select class="form-input" id="level-select">
                            <option value="new">-- Yeni Seviye Olustur --</option>
                        </select>
                    </div>
                    <div id="new-level-fields" style="margin-top: var(--spacing-md);">
                        <div class="form-group">
                            <label class="form-label">Yeni Seviye Adi</label>
                            <input type="text" class="form-input" id="new-level-name" placeholder="Ornegin: A1 - Temel Kelimeler">
                        </div>
                    </div>
                    
                    <div style="margin-top: var(--spacing-lg); display: flex; gap: var(--spacing-md);">
                        <button class="btn btn-primary" id="preview-mapping">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                <circle cx="12" cy="12" r="3"/>
                            </svg>
                            Onizle
                        </button>
                        <button class="btn btn-secondary" id="cancel-mapping">Iptal</button>
                    </div>
                </div>
            </div>
        `;

        // Auto-detect columns
        this.autoDetectWordColumns(headers);

        // Load existing levels into the select
        this.loadLevelOptions();

        // Toggle new level fields visibility
        const levelSelect = mappingSection.querySelector('#level-select');
        const newLevelFields = mappingSection.querySelector('#new-level-fields');
        levelSelect.addEventListener('change', () => {
            newLevelFields.style.display = levelSelect.value === 'new' ? 'block' : 'none';
        });

        // Preview button
        mappingSection.querySelector('#preview-mapping').addEventListener('click', () => {
            this.previewWordMapping(content, data);
        });

        // Cancel button
        mappingSection.querySelector('#cancel-mapping').addEventListener('click', () => {
            mappingSection.classList.add('hidden');
            preview.classList.add('hidden');
            this.uploadedData = null;
        });
    },

    async loadLevelOptions() {
        try {
            const levels = await DB.levels.getAll();
            const select = document.querySelector('#level-select');
            if (!select) return;
            levels.forEach(level => {
                const option = document.createElement('option');
                option.value = level.id;
                option.textContent = `${level.name} (Sira: ${level.order_index})`;
                select.appendChild(option);
            });
        } catch (e) {
            console.warn('Could not load levels:', e);
        }
    },

    autoDetectWordColumns(headers) {
        const mappings = {
            english_word: ['english', 'ingilizce', 'word', 'kelime', 'eng', 'english_word'],
            turkish_meaning: ['turkish', 'turkce', 'meaning', 'anlam', 'tr', 'turkish_meaning'],
            pronunciation: ['pronunciation', 'okunusu', 'telaffuz', 'pron', 'reading'],
            memory_sentence: ['memory', 'hafiza', 'hatirlatici', 'memory_sentence', 'akilda'],
            example_sentence: ['example', 'ornek', 'sentence', 'cumle', 'example_sentence']
        };

        for (const [field, keywords] of Object.entries(mappings)) {
            const select = document.querySelector(`#map-${field}`);
            if (!select) continue;

            for (const header of headers) {
                const headerLower = header.name.toLowerCase();
                if (keywords.some(kw => headerLower.includes(kw))) {
                    select.value = header.index;
                    break;
                }
            }
        }
    },

    previewWordMapping(content, data) {
        const preview = content.querySelector('#word-preview');

        const mapping = {
            english_word: parseInt(document.querySelector('#map-english_word').value),
            turkish_meaning: parseInt(document.querySelector('#map-turkish_meaning').value),
            pronunciation: parseInt(document.querySelector('#map-pronunciation').value),
            memory_sentence: parseInt(document.querySelector('#map-memory_sentence').value),
            example_sentence: parseInt(document.querySelector('#map-example_sentence').value)
        };

        if (mapping.english_word === -1 || mapping.turkish_meaning === -1) {
            Toast.warning('Ingilizce Kelime ve Turkce Anlam sutunlarini secmelisiniz');
            return;
        }

        // Transform data according to mapping
        const transformedData = data.map(row => ({
            english_word: String(row[mapping.english_word] || '').trim(),
            turkish_meaning: String(row[mapping.turkish_meaning] || '').trim(),
            pronunciation: mapping.pronunciation >= 0 ? String(row[mapping.pronunciation] || '').trim() : '',
            memory_sentence: mapping.memory_sentence >= 0 ? String(row[mapping.memory_sentence] || '').trim() : '',
            example_sentence: mapping.example_sentence >= 0 ? String(row[mapping.example_sentence] || '').trim() : ''
        })).filter(w => w.english_word && w.turkish_meaning);

        if (transformedData.length === 0) {
            Toast.error('Gecerli veri bulunamadi');
            return;
        }

        const levelSelect = document.querySelector('#level-select');
        const selectedLevelId = levelSelect.value;
        const levelLabel = selectedLevelId === 'new'
            ? (document.querySelector('#new-level-name')?.value?.trim() || 'Yeni Seviye')
            : levelSelect.options[levelSelect.selectedIndex].textContent;

        preview.classList.remove('hidden');
        preview.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Onizleme (${transformedData.length} kelime → ${Helpers.escapeHtml(levelLabel)})</h3>
                </div>
                <div class="card-body">
                    <div style="max-height: 300px; overflow-y: auto;">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>English</th>
                                    <th>Turkish</th>
                                    <th>Pronunciation</th>
                                    <th>Memory</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${transformedData.slice(0, 15).map((row, i) => `
                                    <tr>
                                        <td>${i + 1}</td>
                                        <td>${Helpers.escapeHtml(row.english_word)}</td>
                                        <td>${Helpers.escapeHtml(row.turkish_meaning)}</td>
                                        <td>${Helpers.escapeHtml(row.pronunciation || '-')}</td>
                                        <td>${Helpers.escapeHtml((row.memory_sentence || '').substring(0, 25))}${row.memory_sentence?.length > 25 ? '...' : ''}</td>
                                    </tr>
                                `).join('')}
                                ${transformedData.length > 15 ? `<tr><td colspan="5" style="text-align: center; color: var(--text-tertiary);">... ve ${transformedData.length - 15} daha</td></tr>` : ''}
                            </tbody>
                        </table>
                    </div>

                    <div style="margin-top: var(--spacing-lg); display: flex; gap: var(--spacing-md);">
                        <button class="btn btn-primary btn-lg" id="confirm-word-upload">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="17 8 12 3 7 8"/>
                                <line x1="12" y1="3" x2="12" y2="15"/>
                            </svg>
                            Veritabanina Yukle (${transformedData.length} Kelime)
                        </button>
                    </div>
                </div>
            </div>
        `;

        preview.querySelector('#confirm-word-upload').addEventListener('click', async () => {
            await this.uploadWords(content, transformedData);
        });
    },

    async uploadWords(content, words) {
        const btn = content.querySelector('#confirm-word-upload');
        btn.disabled = true;
        btn.innerHTML = '<span class="loading-spinner small"></span> Yukleniyor...';

        try {
            const levelSelect = document.querySelector('#level-select');
            const selectedLevelId = levelSelect.value;
            let levelId;

            if (selectedLevelId === 'new') {
                // Create new level
                const newLevelName = document.querySelector('#new-level-name')?.value?.trim();
                const { data: existingLevels, error: levelsErr } = await supabaseClient
                    .from('levels')
                    .select('order_index')
                    .order('order_index', { ascending: false })
                    .limit(1);

                if (levelsErr) {
                    console.error('Levels query error:', levelsErr);
                    throw new Error('Seviye listesi alinamadi: ' + (levelsErr.message || levelsErr.details || JSON.stringify(levelsErr)));
                }

                const nextOrder = (existingLevels?.[0]?.order_index || 0) + 1;
                const levelName = newLevelName || `Seviye ${nextOrder}`;

                const { data: level, error: levelError } = await supabaseClient
                    .from('levels')
                    .insert({ name: levelName, order_index: nextOrder })
                    .select()
                    .single();

                if (levelError) {
                    console.error('Level insert error:', levelError);
                    throw new Error('Seviye olusturulamadi: ' + (levelError.message || levelError.details || levelError.hint || JSON.stringify(levelError)));
                }
                if (!level) {
                    throw new Error('Seviye olusturulamadi. RLS politikasi nedeniyle erisim reddedilmis olabilir. Kullanicinin admin yetkisi oldugundan emin olun.');
                }
                levelId = level.id;
            } else {
                levelId = parseInt(selectedLevelId);
            }

            // Insert words in batches of 500
            const BATCH_SIZE = 500;
            let uploaded = 0;
            for (let i = 0; i < words.length; i += BATCH_SIZE) {
                const batch = words.slice(i, i + BATCH_SIZE).map(w => ({
                    level_id: levelId,
                    english_word: w.english_word,
                    turkish_meaning: w.turkish_meaning,
                    pronunciation: w.pronunciation || '',
                    memory_sentence: w.memory_sentence || '',
                    example_sentence: w.example_sentence || ''
                }));

                const { error: wordsError } = await supabaseClient.from('words').insert(batch);
                if (wordsError) {
                    console.error('Words insert error:', wordsError);
                    throw new Error('Kelime yukleme hatasi: ' + (wordsError.message || wordsError.details || wordsError.hint || JSON.stringify(wordsError)));
                }

                uploaded += batch.length;
                btn.textContent = `Yukleniyor... (${uploaded}/${words.length})`;
            }

            Toast.success(`${words.length} kelime basariyla yuklendi`);
            content.querySelector('#column-mapping-section').classList.add('hidden');
            content.querySelector('#word-preview').classList.add('hidden');
            this.uploadedData = null;
            this.loadWordList(content);
        } catch (error) {
            console.error('Upload failed:', error);
            Toast.error(error.message || 'Yukleme basarisiz');
            btn.disabled = false;
            btn.innerHTML = 'Tekrar Dene';
        }
    },

    async loadWordList(content) {
        const wordList = content.querySelector('#word-list');
        try {
            const levels = await DB.levels.getAll();
            if (levels.length === 0) {
                wordList.innerHTML = '<p style="color: var(--text-tertiary);">Henuz kelime eklenmemis</p>';
                return;
            }

            wordList.innerHTML = levels.map(level => `
                <div class="list-item" data-level-id="${level.id}">
                    <div class="list-item-content">
                        <div class="list-item-title">${Helpers.escapeHtml(level.name)}</div>
                        <div class="list-item-subtitle">Sira: ${level.order_index}</div>
                    </div>
                    <div class="table-actions">
                        <button class="btn btn-sm btn-ghost" data-view-level="${level.id}">Gor</button>
                        <button class="btn btn-sm btn-danger" data-delete-level="${level.id}">Sil</button>
                    </div>
                </div>
            `).join('');
            
            wordList.querySelectorAll('[data-view-level]').forEach(btn => {
                btn.addEventListener('click', async () => {
                    await this.showLevelWords(parseInt(btn.dataset.viewLevel));
                });
            });
            
            wordList.querySelectorAll('[data-delete-level]').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const confirmed = await Modal.confirm('Bu seviyeyi ve tum kelimelerini silmek istiyor musunuz?', 'Sil');
                    if (confirmed) {
                        try {
                            await supabaseClient.from('words').delete().eq('level_id', parseInt(btn.dataset.deleteLevel));
                            await supabaseClient.from('levels').delete().eq('id', parseInt(btn.dataset.deleteLevel));
                            Toast.success('Seviye silindi');
                            this.loadWordList(content);
                        } catch (e) {
                            Toast.error('Silinemedi');
                        }
                    }
                });
            });
            
        } catch (error) {
            wordList.innerHTML = '<p style="color: var(--text-tertiary);">Yuklenemedi</p>';
        }
    },

    async showLevelWords(levelId) {
        try {
            const words = await DB.levels.getWords(levelId);
            
            Modal.create({
                title: `Seviye Kelimeleri (${words.length} kelime)`,
                content: `
                    <div style="max-height: 400px; overflow-y: auto;">
                        <table class="data-table">
                            <thead>
                                <tr><th>#</th><th>English</th><th>Turkish</th><th>Gorsel</th></tr>
                            </thead>
                            <tbody>
                                ${words.map((w, i) => `
                                    <tr>
                                        <td>${i + 1}</td>
                                        <td>${Helpers.escapeHtml(w.english_word)}</td>
                                        <td>${Helpers.escapeHtml(w.turkish_meaning)}</td>
                                        <td>${w.image_url ? '✅' : '❌'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `,
                actions: [
                    { id: 'close', label: 'Kapat', class: 'btn-primary', handler: (m) => Modal.close(m) }
                ]
            });
        } catch (e) {
            Toast.error('Kelimeler yuklenemedi');
        }
    },

    // ==========================================
    // SENTENCES SECTION WITH COLUMN MAPPING
    // ==========================================
    renderSentences(content) {
        content.innerHTML = `
            <div class="admin-section">
                <div class="admin-section-header">
                    <h2 class="admin-section-title">Cumle Yonetimi</h2>
                </div>

                <div class="upload-area" id="sentence-upload-area">
                    <svg class="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <p class="upload-text">Excel, CSV veya Google Sheets dosyasini surukleyin</p>
                    <p class="upload-hint">Desteklenen formatlar: .xlsx, .xls, .csv, .ods</p>
                    <input type="file" id="sentence-file-input" accept=".csv,.xlsx,.xls,.ods" style="display: none;">
                </div>

                <div id="sentence-mapping-section" class="hidden" style="margin-top: var(--spacing-xl);"></div>
                <div id="sentence-preview" class="hidden" style="margin-top: var(--spacing-xl);"></div>
                
                <div style="margin-top: var(--spacing-xl);">
                    <h3 style="margin-bottom: var(--spacing-md);">Mevcut Cumleler</h3>
                    <div id="sentence-list"></div>
                </div>
            </div>
        `;

        const uploadArea = content.querySelector('#sentence-upload-area');
        const fileInput = content.querySelector('#sentence-file-input');

        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.classList.add('dragover'); });
        uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            if (e.dataTransfer.files.length) this.handleSentenceFile(content, e.dataTransfer.files[0]);
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length) this.handleSentenceFile(content, e.target.files[0]);
        });
        
        this.loadSentenceList(content);
    },

    async handleSentenceFile(content, file) {
        const mappingSection = content.querySelector('#sentence-mapping-section');
        mappingSection.innerHTML = '<div class="loading-spinner"></div>';
        mappingSection.classList.remove('hidden');

        try {
            const { headers, data } = await this.parseFileWithHeaders(file);
            
            if (data.length === 0) {
                Toast.error('Dosyada veri bulunamadi');
                mappingSection.classList.add('hidden');
                return;
            }

            this.showSentenceColumnMapping(content, headers, data);

        } catch (error) {
            Toast.error('Dosya okunamadi: ' + error.message);
            mappingSection.classList.add('hidden');
        }
    },

    showSentenceColumnMapping(content, headers, data) {
        const mappingSection = content.querySelector('#sentence-mapping-section');
        
        const optionsHtml = headers.map(h => 
            `<option value="${h.index}">${Helpers.escapeHtml(h.name)} (ornek: ${Helpers.escapeHtml(h.sample)}...)</option>`
        ).join('');

        mappingSection.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Sutun Eslestirme</h3>
                </div>
                <div class="card-body">
                    <p style="color: var(--text-secondary); margin-bottom: var(--spacing-lg);">
                        Dosyanizda ${data.length} satir veri bulundu. Lutfen her alanin hangi sutuna karsilik geldigini secin.
                    </p>
                    
                    <div class="column-mapping-grid">
                        <div class="form-group">
                            <label class="form-label">Turkce Cumle <span style="color: var(--error);">*</span></label>
                            <select class="form-input" id="map-turkish-sentence">
                                <option value="-1">-- Secin --</option>
                                ${optionsHtml}
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Ingilizce Cumle <span style="color: var(--error);">*</span></label>
                            <select class="form-input" id="map-english-sentence">
                                <option value="-1">-- Secin --</option>
                                ${optionsHtml}
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Zorluk Seviyesi (opsiyonel)</label>
                            <select class="form-input" id="map-difficulty">
                                <option value="-1">-- Secin (varsayilan: medium) --</option>
                                ${optionsHtml}
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-group" style="margin-top: var(--spacing-md);">
                        <label class="form-label">Zorluk sutunu yoksa varsayilan zorluk:</label>
                        <select class="form-input" id="default-difficulty" style="max-width: 200px;">
                            <option value="easy">Kolay (Easy)</option>
                            <option value="medium" selected>Orta (Medium)</option>
                            <option value="hard">Zor (Hard)</option>
                        </select>
                    </div>
                    
                    <div style="margin-top: var(--spacing-lg); display: flex; gap: var(--spacing-md);">
                        <button class="btn btn-primary" id="preview-sentence-mapping">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                <circle cx="12" cy="12" r="3"/>
                            </svg>
                            Onizle
                        </button>
                        <button class="btn btn-secondary" id="cancel-sentence-mapping">Iptal</button>
                    </div>
                </div>
            </div>
        `;

        // Auto-detect columns
        this.autoDetectSentenceColumns(headers);

        mappingSection.querySelector('#preview-sentence-mapping').addEventListener('click', () => {
            this.previewSentenceMapping(content, data);
        });

        mappingSection.querySelector('#cancel-sentence-mapping').addEventListener('click', () => {
            mappingSection.classList.add('hidden');
            content.querySelector('#sentence-preview').classList.add('hidden');
        });
    },

    autoDetectSentenceColumns(headers) {
        const mappings = {
            'turkish-sentence': ['turkish', 'turkce', 'tr', 'cumle_tr', 'turkish_sentence'],
            'english-sentence': ['english', 'ingilizce', 'eng', 'cumle_en', 'english_sentence'],
            'difficulty': ['difficulty', 'zorluk', 'level', 'seviye']
        };

        for (const [field, keywords] of Object.entries(mappings)) {
            const select = document.querySelector(`#map-${field}`);
            if (!select) continue;

            for (const header of headers) {
                const headerLower = header.name.toLowerCase();
                if (keywords.some(kw => headerLower.includes(kw))) {
                    select.value = header.index;
                    break;
                }
            }
        }
    },

    previewSentenceMapping(content, data) {
        const preview = content.querySelector('#sentence-preview');
        
        const turkishCol = parseInt(document.querySelector('#map-turkish-sentence').value);
        const englishCol = parseInt(document.querySelector('#map-english-sentence').value);
        const difficultyCol = parseInt(document.querySelector('#map-difficulty').value);
        const defaultDifficulty = document.querySelector('#default-difficulty').value;

        if (turkishCol === -1 || englishCol === -1) {
            Toast.warning('Turkce ve Ingilizce cumle sutunlarini secmelisiniz');
            return;
        }

        const transformedData = data.map(row => {
            let diff = defaultDifficulty;
            if (difficultyCol >= 0) {
                const rawDiff = String(row[difficultyCol] || '').toLowerCase().trim();
                if (['easy', 'kolay'].includes(rawDiff)) diff = 'easy';
                else if (['medium', 'orta'].includes(rawDiff)) diff = 'medium';
                else if (['hard', 'zor'].includes(rawDiff)) diff = 'hard';
            }
            
            return {
                turkish_sentence: String(row[turkishCol] || '').trim(),
                english_sentence: String(row[englishCol] || '').trim(),
                difficulty: diff
            };
        }).filter(s => s.turkish_sentence && s.english_sentence);

        if (transformedData.length === 0) {
            Toast.error('Gecerli veri bulunamadi');
            return;
        }

        const difficultyLabels = { easy: 'Kolay', medium: 'Orta', hard: 'Zor' };
        const difficultyColors = { easy: 'success', medium: 'warning', hard: 'error' };

        preview.classList.remove('hidden');
        preview.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Onizleme (${transformedData.length} cumle)</h3>
                </div>
                <div class="card-body">
                    <div style="max-height: 300px; overflow-y: auto;">
                        <table class="data-table">
                            <thead>
                                <tr><th>#</th><th>Turkce</th><th>Ingilizce</th><th>Zorluk</th></tr>
                            </thead>
                            <tbody>
                                ${transformedData.slice(0, 10).map((row, i) => `
                                    <tr>
                                        <td>${i + 1}</td>
                                        <td>${Helpers.escapeHtml(row.turkish_sentence.substring(0, 40))}...</td>
                                        <td>${Helpers.escapeHtml(row.english_sentence.substring(0, 40))}...</td>
                                        <td><span class="tag ${difficultyColors[row.difficulty]}">${difficultyLabels[row.difficulty]}</span></td>
                                    </tr>
                                `).join('')}
                                ${transformedData.length > 10 ? `<tr><td colspan="4" style="text-align: center; color: var(--text-tertiary);">... ve ${transformedData.length - 10} daha</td></tr>` : ''}
                            </tbody>
                        </table>
                    </div>
                    
                    <div style="margin-top: var(--spacing-lg);">
                        <button class="btn btn-primary btn-lg" id="confirm-sentence-upload">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="17 8 12 3 7 8"/>
                                <line x1="12" y1="3" x2="12" y2="15"/>
                            </svg>
                            Veritabanina Yukle (${transformedData.length} Cumle)
                        </button>
                    </div>
                </div>
            </div>
        `;

        preview.querySelector('#confirm-sentence-upload').addEventListener('click', async () => {
            const btn = preview.querySelector('#confirm-sentence-upload');
            btn.disabled = true;
            btn.innerHTML = '<span class="loading-spinner small"></span> Yukleniyor...';
            
            try {
                await DB.admin.uploadSentences(transformedData);
                Toast.success(`${transformedData.length} cumle yuklendi`);
                content.querySelector('#sentence-mapping-section').classList.add('hidden');
                preview.classList.add('hidden');
                this.loadSentenceList(content);
            } catch (error) {
                Toast.error('Yukleme basarisiz');
                btn.disabled = false;
                btn.textContent = 'Tekrar Dene';
            }
        });
    },

    async loadSentenceList(content) {
        const list = content.querySelector('#sentence-list');
        try {
            const { data, count } = await supabaseClient
                .from('translation_sentences')
                .select('*', { count: 'exact' })
                .limit(10)
                .order('id', { ascending: false });
            
            if (!data || data.length === 0) {
                list.innerHTML = '<p style="color: var(--text-tertiary);">Henuz cumle eklenmemis</p>';
                return;
            }

            const diffLabels = { easy: 'Kolay', medium: 'Orta', hard: 'Zor' };
            list.innerHTML = `
                <p style="color: var(--text-secondary); margin-bottom: var(--spacing-md);">Toplam ${count || 0} cumle (son 10 gosteriliyor)</p>
                <table class="data-table">
                    <thead><tr><th>Turkce</th><th>Ingilizce</th><th>Zorluk</th></tr></thead>
                    <tbody>
                        ${data.map(s => `
                            <tr>
                                <td>${Helpers.escapeHtml((s.turkish_sentence || '').substring(0, 30))}...</td>
                                <td>${Helpers.escapeHtml((s.english_sentence || '').substring(0, 30))}...</td>
                                <td><span class="tag">${diffLabels[s.difficulty] || 'Orta'}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } catch (e) {
            list.innerHTML = '<p style="color: var(--text-tertiary);">Yuklenemedi</p>';
        }
    },

    // ==========================================
    // IMAGES SECTION - Upload images for words
    // ==========================================
    async renderImages(content) {
        content.innerHTML = `
            <div class="admin-section">
                <div class="admin-section-header">
                    <h2 class="admin-section-title">Kelime Gorselleri</h2>
                </div>
                
                <p style="color: var(--text-secondary); margin-bottom: var(--spacing-lg);">
                    Kelimelere gorsel ekleyebilirsiniz. Gorseller kelime kartinin arkasinda gosterilir.
                </p>
                
                <div class="form-group" style="margin-bottom: var(--spacing-lg);">
                    <label class="form-label">Seviye Sec</label>
                    <select class="form-input" id="image-level-select" style="max-width: 300px;">
                        <option value="">-- Seviye Secin --</option>
                    </select>
                </div>
                
                <div id="words-for-images" style="display: none;">
                    <div class="image-upload-grid" id="image-upload-grid"></div>
                </div>
            </div>
        `;

        // Load levels
        try {
            const levels = await DB.levels.getAll();
            const select = content.querySelector('#image-level-select');
            
            levels.forEach(level => {
                const option = document.createElement('option');
                option.value = level.id;
                option.textContent = level.name;
                select.appendChild(option);
            });

            select.addEventListener('change', async () => {
                if (select.value) {
                    await this.loadWordsForImages(content, parseInt(select.value));
                } else {
                    content.querySelector('#words-for-images').style.display = 'none';
                }
            });
        } catch (e) {
            Toast.error('Seviyeler yuklenemedi');
        }
    },

    async loadWordsForImages(content, levelId) {
        const container = content.querySelector('#words-for-images');
        const grid = content.querySelector('#image-upload-grid');
        
        container.style.display = 'block';
        grid.innerHTML = '<div class="loading-spinner"></div>';

        try {
            const words = await DB.levels.getWords(levelId);
            
            if (words.length === 0) {
                grid.innerHTML = '<p style="color: var(--text-tertiary);">Bu seviyede kelime yok</p>';
                return;
            }

            grid.innerHTML = words.map(word => `
                <div class="image-upload-card" data-word-id="${word.id}">
                    <div class="image-preview">
                        ${word.image_url 
                            ? `<img src="${word.image_url}" alt="${word.english_word}">`
                            : `<div class="no-image">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                                    <circle cx="8.5" cy="8.5" r="1.5"/>
                                    <path d="M21 15l-5-5L5 21"/>
                                </svg>
                               </div>`
                        }
                    </div>
                    <div class="image-card-info">
                        <strong>${Helpers.escapeHtml(word.english_word)}</strong>
                        <span>${Helpers.escapeHtml(word.turkish_meaning)}</span>
                    </div>
                    <div class="image-card-actions">
                        <input type="file" accept="image/*" style="display: none;" data-word-id="${word.id}">
                        <button class="btn btn-sm btn-primary upload-image-btn" data-word-id="${word.id}">
                            ${word.image_url ? 'Degistir' : 'Yukle'}
                        </button>
                        ${word.image_url ? `<button class="btn btn-sm btn-danger remove-image-btn" data-word-id="${word.id}">Kaldir</button>` : ''}
                    </div>
                </div>
            `).join('');

            // Upload handlers
            grid.querySelectorAll('.upload-image-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const wordId = btn.dataset.wordId;
                    const input = grid.querySelector(`input[data-word-id="${wordId}"]`);
                    input.click();
                });
            });

            grid.querySelectorAll('input[type="file"]').forEach(input => {
                input.addEventListener('change', async (e) => {
                    if (e.target.files.length) {
                        await this.uploadWordImage(content, parseInt(input.dataset.wordId), e.target.files[0], levelId);
                    }
                });
            });

            // Remove handlers
            grid.querySelectorAll('.remove-image-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const confirmed = await Modal.confirm('Gorseli kaldirmak istiyor musunuz?', 'Kaldir');
                    if (confirmed) {
                        await this.removeWordImage(content, parseInt(btn.dataset.wordId), levelId);
                    }
                });
            });

        } catch (e) {
            grid.innerHTML = '<p style="color: var(--error);">Kelimeler yuklenemedi</p>';
        }
    },

    async uploadWordImage(content, wordId, file, levelId) {
        try {
            Toast.info('Gorsel yukleniyor...');
            
            // Create a unique filename
            const fileExt = file.name.split('.').pop();
            const fileName = `word-${wordId}-${Date.now()}.${fileExt}`;
            
            // Upload to Supabase Storage
            const { data, error } = await supabaseClient.storage
                .from('word-images')
                .upload(fileName, file, { 
                    upsert: true,
                    contentType: file.type
                });
            
            if (error) throw error;
            
            // Get public URL
            const { data: urlData } = supabaseClient.storage
                .from('word-images')
                .getPublicUrl(fileName);
            
            // Update word with image URL
            await supabaseClient
                .from('words')
                .update({ image_url: urlData.publicUrl })
                .eq('id', wordId);
            
            Toast.success('Gorsel yuklendi');
            await this.loadWordsForImages(content, levelId);
            
        } catch (error) {
            console.error('Image upload error:', error);
            Toast.error('Gorsel yuklenemedi: ' + error.message);
        }
    },

    async removeWordImage(content, wordId, levelId) {
        try {
            await supabaseClient
                .from('words')
                .update({ image_url: null })
                .eq('id', wordId);
            
            Toast.success('Gorsel kaldirildi');
            await this.loadWordsForImages(content, levelId);
        } catch (error) {
            Toast.error('Gorsel kaldirilamadi');
        }
    },

    // ==========================================
    // USERS SECTION
    // ==========================================
    async renderUsers(content) {
        content.innerHTML = `
            <div class="admin-section">
                <div class="admin-section-header">
                    <h2 class="admin-section-title">Kullanici Yonetimi</h2>
                </div>
                <div class="search-input-wrapper" style="margin-bottom: var(--spacing-lg);">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                    </svg>
                    <input type="text" class="form-input" id="user-search" placeholder="Kullanici ara...">
                </div>
                <div id="users-list">
                    <div class="loading-spinner" style="margin: var(--spacing-xl) auto;"></div>
                </div>
            </div>
        `;

        content.querySelector('#user-search').addEventListener('input', Helpers.debounce(async (e) => {
            await this.loadUsers(content, e.target.value.trim());
        }, 300));

        await this.loadUsers(content, '');
    },

    async loadUsers(content, search) {
        const usersList = content.querySelector('#users-list');
        try {
            const users = await DB.admin.getAllUsers(search);
            usersList.innerHTML = `
                <table class="data-table">
                    <thead><tr><th>Kullanici</th><th>Email</th><th>Puan</th><th>Admin</th><th>Durum</th><th>Islem</th></tr></thead>
                    <tbody>
                        ${users.map(u => `
                            <tr>
                                <td><strong>${Helpers.escapeHtml(u.username)}</strong></td>
                                <td>${Helpers.escapeHtml(u.email || '-')}</td>
                                <td>${Helpers.formatNumber(u.total_points || 0)}</td>
                                <td>${u.is_admin ? '<span class="tag gold">Admin</span>' : '-'}</td>
                                <td>${u.is_active ? '<span class="tag success">Aktif</span>' : '<span class="tag error">Engelli</span>'}</td>
                                <td>
                                    <div class="table-actions">
                                        <button class="table-action-btn ${u.is_admin ? '' : 'success'}" title="${u.is_admin ? 'Admin Kaldir' : 'Admin Yap'}" data-toggle-admin="${u.id}" data-is-admin="${u.is_admin}">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                                            </svg>
                                        </button>
                                        <button class="table-action-btn danger" title="${u.is_active ? 'Engelle' : 'Engeli Kaldir'}" data-ban="${u.id}" data-active="${u.is_active}">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                ${u.is_active ? '<circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>' : '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>'}
                                            </svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;

            usersList.querySelectorAll('[data-ban]').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const userId = btn.dataset.ban;
                    const isActive = btn.dataset.active === 'true';
                    const confirmed = await Modal.confirm(
                        isActive ? 'Bu kullaniciyi engellemek istiyor musunuz?' : 'Engeli kaldirmak istiyor musunuz?',
                        isActive ? 'Engelle' : 'Engeli Kaldir'
                    );
                    if (confirmed) {
                        try {
                            if (isActive) await DB.admin.banUser(userId);
                            else await DB.admin.unbanUser(userId);
                            Toast.success(isActive ? 'Kullanici engellendi' : 'Engel kaldirildi');
                            await this.loadUsers(content, '');
                        } catch (error) {
                            Toast.error('Islem basarisiz');
                        }
                    }
                });
            });
            
            usersList.querySelectorAll('[data-toggle-admin]').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const userId = btn.dataset.toggleAdmin;
                    const isAdmin = btn.dataset.isAdmin === 'true';
                    const confirmed = await Modal.confirm(
                        isAdmin ? 'Bu kullanicinin admin yetkisini kaldirmak istiyor musunuz?' : 'Bu kullaniciyi admin yapmak istiyor musunuz?',
                        isAdmin ? 'Yetkiyi Kaldir' : 'Admin Yap'
                    );
                    if (confirmed) {
                        try {
                            await supabaseClient.from('users').update({ is_admin: !isAdmin }).eq('id', userId);
                            Toast.success(isAdmin ? 'Admin yetkisi kaldirildi' : 'Kullanici admin yapildi');
                            await this.loadUsers(content, '');
                        } catch (error) {
                            Toast.error('Islem basarisiz');
                        }
                    }
                });
            });

        } catch (error) {
            usersList.innerHTML = '<p style="color: var(--error);">Kullanicilar yuklenemedi</p>';
        }
    },

    // Forum, Messages, Settings - Same as before
    async renderForum(content) {
        try {
            const pendingPosts = await DB.admin.getPendingPosts();
            const pendingComments = await DB.admin.getPendingComments();

            content.innerHTML = `
                <div class="admin-section">
                    <div class="admin-section-header">
                        <h2 class="admin-section-title">Forum Yonetimi</h2>
                        <button class="btn btn-primary btn-sm" id="create-topic">Yeni Baslik</button>
                    </div>

                    <h3 style="margin-bottom: var(--spacing-md);">Bekleyen Gorusler (${pendingPosts.length})</h3>
                    ${pendingPosts.length === 0 ? '<p style="color: var(--text-tertiary); margin-bottom: var(--spacing-xl);">Bekleyen gorus yok</p>' :
                        `<div class="list" style="margin-bottom: var(--spacing-xl);">
                            ${pendingPosts.map(post => `
                                <div class="list-item" style="flex-wrap: wrap;">
                                    <div class="list-item-content">
                                        <div class="list-item-title">${Helpers.escapeHtml(post.title || 'Baslitsiz')}</div>
                                        <div class="list-item-subtitle">${Helpers.escapeHtml(post.users?.username || '?')} - ${Helpers.escapeHtml(post.content?.substring(0, 60) || '')}...</div>
                                    </div>
                                    <div class="table-actions">
                                        <button class="btn btn-sm btn-success" data-approve-post="${post.id}">Onayla</button>
                                        <button class="btn btn-sm btn-danger" data-reject-post="${post.id}">Reddet</button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>`}

                    <h3 style="margin-bottom: var(--spacing-md);">Bekleyen Yorumlar (${pendingComments.length})</h3>
                    ${pendingComments.length === 0 ? '<p style="color: var(--text-tertiary);">Bekleyen yorum yok</p>' :
                        `<div class="list">
                            ${pendingComments.map(comment => `
                                <div class="list-item" style="flex-wrap: wrap;">
                                    <div class="list-item-content">
                                        <div class="list-item-title">${Helpers.escapeHtml(comment.users?.username || '?')}</div>
                                        <div class="list-item-subtitle">${Helpers.escapeHtml(comment.content?.substring(0, 80) || '')}</div>
                                    </div>
                                    <div class="table-actions">
                                        <button class="btn btn-sm btn-success" data-approve-comment="${comment.id}">Onayla</button>
                                        <button class="btn btn-sm btn-danger" data-reject-comment="${comment.id}">Reddet</button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>`}
                </div>
            `;

            content.querySelector('#create-topic')?.addEventListener('click', () => this.showCreateTopic(content));
            content.querySelectorAll('[data-approve-post]').forEach(btn => {
                btn.addEventListener('click', async () => { await DB.admin.approvePost(parseInt(btn.dataset.approvePost)); Toast.success('Onaylandi'); this.renderForum(content); });
            });
            content.querySelectorAll('[data-reject-post]').forEach(btn => {
                btn.addEventListener('click', async () => { await DB.admin.deletePost(parseInt(btn.dataset.rejectPost)); Toast.success('Reddedildi'); this.renderForum(content); });
            });
            content.querySelectorAll('[data-approve-comment]').forEach(btn => {
                btn.addEventListener('click', async () => { await DB.admin.approveComment(parseInt(btn.dataset.approveComment)); Toast.success('Onaylandi'); this.renderForum(content); });
            });
            content.querySelectorAll('[data-reject-comment]').forEach(btn => {
                btn.addEventListener('click', async () => { await DB.admin.deleteComment(parseInt(btn.dataset.rejectComment)); Toast.success('Reddedildi'); this.renderForum(content); });
            });

        } catch (error) {
            content.innerHTML = '<p style="color: var(--error);">Forum yonetimi yuklenemedi</p>';
        }
    },

    showCreateTopic(content) {
        Modal.create({
            title: 'Yeni Forum Basligi',
            content: `
                <div class="form-group">
                    <label class="form-label">Baslik</label>
                    <input type="text" class="form-input" id="topic-title" placeholder="Baslik giriniz">
                </div>
                <div class="form-group" style="margin-top: var(--spacing-md);">
                    <label class="form-label">Aciklama</label>
                    <textarea class="form-input form-textarea" id="topic-content" placeholder="Aciklama giriniz"></textarea>
                </div>
            `,
            actions: [
                { id: 'cancel', label: 'Iptal', class: 'btn-secondary', handler: (m) => Modal.close(m) },
                {
                    id: 'create', label: 'Olustur', class: 'btn-primary',
                    handler: async (m) => {
                        const title = m.querySelector('#topic-title').value.trim();
                        const topicContent = m.querySelector('#topic-content').value.trim();
                        if (!title) { Toast.warning('Baslik gerekli'); return; }
                        try {
                            await supabaseClient.from('forum_topics').insert({ name: title, description: topicContent });
                            Toast.success('Baslik olusturuldu');
                            Modal.close(m);
                            this.renderForum(content);
                        } catch (error) {
                            Toast.error('Olusturulamadi');
                        }
                    }
                }
            ]
        });
    },

    renderMessages(content) {
        content.innerHTML = `
            <div class="admin-section">
                <h2 class="admin-section-title" style="margin-bottom: var(--spacing-xl);">Mesaj Gonder</h2>
                <div class="form-group">
                    <label class="form-label">Alici</label>
                    <select class="form-input" id="msg-recipient">
                        <option value="all">Tum Kullanicilar (Duyuru)</option>
                    </select>
                </div>
                <div class="form-group" style="margin-top: var(--spacing-md);">
                    <label class="form-label">Baslik</label>
                    <input type="text" class="form-input" id="msg-title" placeholder="Mesaj basligi">
                </div>
                <div class="form-group" style="margin-top: var(--spacing-md);">
                    <label class="form-label">Icerik</label>
                    <textarea class="form-input form-textarea" id="msg-content" placeholder="Mesaj icerigi" rows="5"></textarea>
                </div>
                <button class="btn btn-primary" id="send-msg" style="margin-top: var(--spacing-lg);">Gonder</button>
            </div>
        `;

        this.loadUserDropdown(content);

        content.querySelector('#send-msg').addEventListener('click', async () => {
            const recipient = content.querySelector('#msg-recipient').value;
            const title = content.querySelector('#msg-title').value.trim();
            const msgContent = content.querySelector('#msg-content').value.trim();
            if (!title || !msgContent) { Toast.warning('Baslik ve icerik gerekli'); return; }
            try {
                if (recipient === 'all') await DB.admin.sendBroadcast(title, msgContent);
                else await DB.admin.sendMessage(recipient, title, msgContent);
                Toast.success('Mesaj gonderildi');
                content.querySelector('#msg-title').value = '';
                content.querySelector('#msg-content').value = '';
            } catch (error) {
                Toast.error('Mesaj gonderilemedi');
            }
        });
    },

    async loadUserDropdown(content) {
        try {
            const users = await DB.admin.getAllUsers('', 100);
            const select = content.querySelector('#msg-recipient');
            users.forEach(u => {
                const option = document.createElement('option');
                option.value = u.id;
                option.textContent = `${u.username} (${u.email || 'email yok'})`;
                select.appendChild(option);
            });
        } catch (e) {}
    },

    renderSettings(content) {
        content.innerHTML = `
            <div class="admin-section">
                <h2 class="admin-section-title" style="margin-bottom: var(--spacing-xl);">Admin Ayarlari</h2>
                
                <div class="card" style="margin-bottom: var(--spacing-xl);">
                    <div class="card-header"><h3 class="card-title">Sifre Degistir</h3></div>
                    <div class="card-body">
                        <div class="form-group">
                            <label class="form-label">Mevcut Sifre</label>
                            <input type="password" class="form-input" id="current-password">
                        </div>
                        <div class="form-group" style="margin-top: var(--spacing-md);">
                            <label class="form-label">Yeni Sifre</label>
                            <input type="password" class="form-input" id="new-password">
                        </div>
                        <div class="form-group" style="margin-top: var(--spacing-md);">
                            <label class="form-label">Yeni Sifre (Tekrar)</label>
                            <input type="password" class="form-input" id="confirm-password">
                        </div>
                        <button class="btn btn-primary" id="change-password" style="margin-top: var(--spacing-lg);">Sifreyi Degistir</button>
                    </div>
                </div>
            </div>
        `;

        content.querySelector('#change-password').addEventListener('click', async () => {
            const currentPwd = content.querySelector('#current-password').value;
            const newPwd = content.querySelector('#new-password').value;
            const confirmPwd = content.querySelector('#confirm-password').value;
            
            if (!currentPwd || !newPwd || !confirmPwd) { Toast.warning('Tum alanlari doldurun'); return; }
            if (newPwd.length < 6) { Toast.warning('Sifre en az 6 karakter olmali'); return; }
            if (newPwd !== confirmPwd) { Toast.warning('Sifreler eslesmedi'); return; }
            
            try {
                const { error: signInError } = await supabaseClient.auth.signInWithPassword({
                    email: Auth.user?.email,
                    password: currentPwd
                });
                if (signInError) { Toast.error('Mevcut sifre yanlis'); return; }
                
                const { error } = await supabaseClient.auth.updateUser({ password: newPwd });
                if (error) throw error;
                
                Toast.success('Sifre basariyla degistirildi');
                content.querySelector('#current-password').value = '';
                content.querySelector('#new-password').value = '';
                content.querySelector('#confirm-password').value = '';
            } catch (error) {
                Toast.error('Sifre degistirilemedi');
            }
        });
    },

    cleanup() {}
};

window.AdminPage = AdminPage;
