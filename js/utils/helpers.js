// VocabMaster Pro - Helper Utilities

const Helpers = {
    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Format number with commas
    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },

    // Format time duration
    formatDuration(minutes) {
        if (minutes < 60) {
            return `${minutes} dk`;
        }
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}s ${mins}dk` : `${hours}s`;
    },

    // Format date
    formatDate(date, format = 'short') {
        const d = new Date(date);
        const options = format === 'long'
            ? { year: 'numeric', month: 'long', day: 'numeric' }
            : { year: 'numeric', month: 'short', day: 'numeric' };
        return d.toLocaleDateString('tr-TR', options);
    },

    // Format relative time
    formatRelativeTime(date) {
        const now = new Date();
        const d = new Date(date);
        const diff = Math.floor((now - d) / 1000);

        if (diff < 60) return 'Az once';
        if (diff < 3600) return `${Math.floor(diff / 60)} dakika once`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} saat once`;
        if (diff < 604800) return `${Math.floor(diff / 86400)} gun once`;
        return this.formatDate(date);
    },

    // Shuffle array
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    },

    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Throttle function
    throttle(func, limit) {
        let inThrottle;
        return function (...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // Escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    // Validate email
    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    // Validate password
    isValidPassword(password) {
        // At least 8 characters, 1 letter and 1 number
        return password.length >= 8 &&
            /[a-zA-Z]/.test(password) &&
            /[0-9]/.test(password);
    },

    // Validate username
    isValidUsername(username) {
        return username.length >= CONFIG.USERNAME_MIN &&
            username.length <= CONFIG.USERNAME_MAX &&
            /^[a-zA-Z0-9_]+$/.test(username);
    },

    // Compare strings with tolerance
    compareStrings(str1, str2, tolerance = 1) {
        const s1 = str1.toLowerCase().replace(/[^\w\s]/g, '').trim();
        const s2 = str2.toLowerCase().replace(/[^\w\s]/g, '').trim();

        if (s1 === s2) return true;

        // Check Levenshtein distance
        const distance = this.levenshteinDistance(s1, s2);
        return distance <= tolerance;
    },

    // Levenshtein distance
    levenshteinDistance(str1, str2) {
        const m = str1.length;
        const n = str2.length;
        const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

        for (let i = 0; i <= m; i++) dp[i][0] = i;
        for (let j = 0; j <= n; j++) dp[0][j] = j;

        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                if (str1[i - 1] === str2[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1];
                } else {
                    dp[i][j] = 1 + Math.min(
                        dp[i - 1][j],
                        dp[i][j - 1],
                        dp[i - 1][j - 1]
                    );
                }
            }
        }

        return dp[m][n];
    },

    // Compare words with tolerance
    compareWords(userInput, correct) {
        const userWords = userInput.toLowerCase().replace(/[^\w\s]/g, '').trim().split(/\s+/);
        const correctWords = correct.toLowerCase().replace(/[^\w\s]/g, '').trim().split(/\s+/);

        const results = [];
        const maxLen = Math.max(userWords.length, correctWords.length);

        for (let i = 0; i < maxLen; i++) {
            const userWord = userWords[i] || '';
            const correctWord = correctWords[i] || '';

            if (!userWord && correctWord) {
                results.push({ word: correctWord, correct: false, missing: true });
            } else if (userWord && !correctWord) {
                results.push({ word: userWord, correct: false, extra: true });
            } else if (this.compareStrings(userWord, correctWord, 1)) {
                results.push({ word: userWord, correct: true });
            } else {
                results.push({ word: userWord, correct: false, expected: correctWord });
            }
        }

        return results;
    },

    // Get initials from name
    getInitials(name) {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    },

    // Parse CSV
    parseCSV(text) {
        const lines = text.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));

        return lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim());
            const obj = {};
            headers.forEach((header, i) => {
                obj[header] = values[i] || '';
            });
            return obj;
        });
    },

    // Create element from HTML string
    createElement(html) {
        const template = document.createElement('template');
        template.innerHTML = html.trim();
        return template.content.firstChild;
    },

    // Wait for animation
    waitForAnimation(element, animation) {
        return new Promise(resolve => {
            element.classList.add(animation);
            element.addEventListener('animationend', function handler() {
                element.removeEventListener('animationend', handler);
                resolve();
            });
        });
    },

    // Wait for transition
    waitForTransition(element) {
        return new Promise(resolve => {
            element.addEventListener('transitionend', function handler() {
                element.removeEventListener('transitionend', handler);
                resolve();
            });
        });
    },

    // Sleep
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    // Get random items from array
    getRandomItems(array, count) {
        const shuffled = this.shuffleArray(array);
        return shuffled.slice(0, count);
    },

    // Calculate percentage
    percentage(value, total) {
        if (total === 0) return 0;
        return Math.round((value / total) * 100);
    },

    // Clamp number
    clamp(num, min, max) {
        return Math.min(Math.max(num, min), max);
    },

    // Check if touch device
    isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    },

    // Get scroll position
    getScrollPosition() {
        return {
            x: window.pageXOffset || document.documentElement.scrollLeft,
            y: window.pageYOffset || document.documentElement.scrollTop
        };
    },

    // Smooth scroll to element
    scrollToElement(element, offset = 0) {
        const top = element.getBoundingClientRect().top + window.pageYOffset + offset;
        window.scrollTo({ top, behavior: 'smooth' });
    },

    // Copy to clipboard
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            // Fallback
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            const success = document.execCommand('copy');
            document.body.removeChild(textarea);
            return success;
        }
    },

    // Get today's date string
    getTodayString() {
        return new Date().toISOString().split('T')[0];
    },

    // Check if same day
    isSameDay(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        return d1.toDateString() === d2.toDateString();
    },

    // Get days between dates
    getDaysBetween(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const diffTime = Math.abs(d2 - d1);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },

    // Generate random color
    getRandomColor() {
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
            '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    },

    // Parse Excel file (using SheetJS if available)
    async parseExcel(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    // If SheetJS is available
                    if (window.XLSX) {
                        const data = new Uint8Array(e.target.result);
                        const workbook = XLSX.read(data, { type: 'array' });
                        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                        const jsonData = XLSX.utils.sheet_to_json(firstSheet);
                        resolve(jsonData);
                    } else {
                        // Fallback: try CSV parsing
                        const text = e.target.result;
                        resolve(this.parseCSV(text));
                    }
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(reader.error);

            if (file.name.endsWith('.csv')) {
                reader.readAsText(file);
            } else {
                reader.readAsArrayBuffer(file);
            }
        });
    }
};

// Make globally available
window.Helpers = Helpers;
