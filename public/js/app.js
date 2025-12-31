// ============================================
// POLLPULSE - FRONTEND APPLICATION (ENHANCED)
// Main JavaScript file with improved error handling
// ============================================

const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' 
    : '/api';

// ============================================
// SESSION MANAGEMENT
// ============================================

function getSessionId() {
    let sessionId = localStorage.getItem('pollpulse_session');
    if (!sessionId) {
        sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('pollpulse_session', sessionId);
    }
    return sessionId;
}

// ============================================
// API FUNCTIONS
// ============================================

async function apiRequest(endpoint, options = {}) {
    try {
        console.log(`API Request: ${endpoint}`, options);
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        const data = await response.json();
        console.log(`API Response:`, data);
        
        if (!response.ok) {
            throw new Error(data.error || `Request failed with status ${response.status}`);
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        showToast(error.message, 'error');
        throw error;
    }
}

// Get all polls
async function fetchPolls(filter = 'all', search = '') {
    return apiRequest(`/polls?filter=${filter}&search=${encodeURIComponent(search)}`);
}

// Get single poll
async function fetchPoll(pollId) {
    return apiRequest(`/polls/${pollId}`);
}

// Create poll
async function createPoll(pollData) {
    console.log('Creating poll with data:', pollData);
    return apiRequest('/polls', {
        method: 'POST',
        body: JSON.stringify(pollData)
    });
}

// Submit vote
async function submitVote(pollId, optionId) {
    return apiRequest(`/polls/${pollId}/vote`, {
        method: 'POST',
        body: JSON.stringify({
            optionId,
            sessionId: getSessionId()
        })
    });
}

// Get global stats
async function fetchGlobalStats() {
    return apiRequest('/stats/global');
}

// Get leaderboard
async function fetchLeaderboard(type = 'voters', limit = 10) {
    return apiRequest(`/leaderboard?type=${type}&limit=${limit}`);
}

// ============================================
// UI UTILITIES
// ============================================

function showToast(message, type = 'info') {
    console.log(`Toast: ${type} - ${message}`);
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    const colors = {
        error: '#ff0044',
        success: '#00ff88',
        info: '#667eea'
    };
    
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background: ${colors[type] || colors.info};
        color: #fff;
        border-radius: 12px;
        font-weight: 600;
        z-index: 10000;
        animation: toastSlideIn 0.3s ease-out;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        max-width: 400px;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'toastSlideOut 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function showLoading(element) {
    element.innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <div class="spinner" style="width: 40px; height: 40px; border: 4px solid rgba(255,255,255,0.1); border-top-color: #ff0044; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
            <p style="color: var(--color-gray-400); margin-top: 16px;">Loading...</p>
        </div>
    `;
}

function formatNumber(num) {
    return new Intl.NumberFormat().format(num);
}

function timeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    
    return new Date(date).toLocaleDateString();
}

// ============================================
// POLL RENDERING
// ============================================

function renderPollCard(poll) {
    const totalVotes = poll.vote_count || 0;
    
    return `
        <div class="poll-card animate-fadeInUp" onclick="window.location.href='vote.html?id=${poll.id}'" style="cursor: pointer;">
            <div class="poll-header">
                <div class="poll-badge">
                    <div class="live-dot"></div>
                    <span>${totalVotes > 1000 ? 'VIRAL' : totalVotes > 100 ? 'HOT' : 'NEW'}</span>
                </div>
                <div class="poll-votes">${formatNumber(totalVotes)} votes</div>
            </div>
            <div class="poll-question">${escapeHtml(poll.question)}</div>
            <div class="poll-options">
                ${poll.options ? poll.options.slice(0, 3).map(option => `
                    <div class="poll-option">
                        <div class="option-content">
                            <div class="option-text">
                                <span class="option-emoji">${option.emoji || '📊'}</span>
                                <span>${escapeHtml(option.option_text)}</span>
                            </div>
                            <div class="option-percentage">${option.percentage || 0}%</div>
                        </div>
                    </div>
                `).join('') : '<p>No options available</p>'}
            </div>
        </div>
    `;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// CONFETTI ANIMATION
// ============================================

function createConfetti() {
    const colors = ['#ff0044', '#ffffff', '#ff3366', '#ff6688', '#667eea'];
    const confettiCount = 50;
    
    for (let i = 0; i < confettiCount; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.style.cssText = `
                position: fixed;
                width: ${Math.random() * 10 + 5}px;
                height: ${Math.random() * 10 + 5}px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                left: ${Math.random() * 100}vw;
                top: -20px;
                border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
                pointer-events: none;
                z-index: 9999;
                animation: confettiFall ${Math.random() * 3 + 2}s linear forwards;
            `;
            
            document.body.appendChild(confetti);
            
            setTimeout(() => confetti.remove(), 5000);
        }, i * 30);
    }
}

// Add confetti animation CSS
if (!document.getElementById('confetti-style')) {
    const style = document.createElement('style');
    style.id = 'confetti-style';
    style.textContent = `
        @keyframes confettiFall {
            to {
                transform: translateY(100vh) rotate(360deg);
                opacity: 0;
            }
        }
        @keyframes spin {
            to {
                transform: rotate(360deg);
            }
        }
        @keyframes toastSlideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes toastSlideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// ============================================
// REAL-TIME UPDATES
// ============================================

let updateInterval = null;

function startRealtimeUpdates(pollId, callback) {
    // Update every 5 seconds
    updateInterval = setInterval(async () => {
        try {
            const data = await fetchPoll(pollId);
            callback(data);
        } catch (error) {
            console.error('Failed to fetch updates:', error);
        }
    }, 5000);
}

function stopRealtimeUpdates() {
    if (updateInterval) {
        clearInterval(updateInterval);
        updateInterval = null;
    }
}

// ============================================
// FORM VALIDATION
// ============================================

function validatePollForm(question, options) {
    if (!question || question.trim().length < 5) {
        showToast('Question must be at least 5 characters', 'error');
        return false;
    }
    
    if (options.length < 2) {
        showToast('Please provide at least 2 options', 'error');
        return false;
    }
    
    if (options.length > 10) {
        showToast('Maximum 10 options allowed', 'error');
        return false;
    }
    
    for (let option of options) {
        if (!option.text || option.text.trim().length === 0) {
            showToast('All options must have text', 'error');
            return false;
        }
    }
    
    return true;
}

// ============================================
// LOCAL STORAGE HELPERS
// ============================================

function saveToLocalStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error('Failed to save to localStorage:', error);
    }
}

function getFromLocalStorage(key) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (error) {
        console.error('Failed to get from localStorage:', error);
        return null;
    }
}

function hasVoted(pollId) {
    const votes = getFromLocalStorage('pollpulse_votes') || [];
    return votes.includes(pollId);
}

function markAsVoted(pollId) {
    const votes = getFromLocalStorage('pollpulse_votes') || [];
    if (!votes.includes(pollId)) {
        votes.push(pollId);
        saveToLocalStorage('pollpulse_votes', votes);
    }
}

// ============================================
// SHARE FUNCTIONS
// ============================================

function shareToTwitter(text, url) {
    window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
        '_blank',
        'width=550,height=420'
    );
}

function shareToFacebook(url) {
    window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        '_blank',
        'width=550,height=420'
    );
}

function shareToWhatsApp(text, url) {
    window.open(
        `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
        '_blank'
    );
}

async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast('Link copied to clipboard! 📋', 'success');
    } catch (error) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showToast('Link copied to clipboard! 📋', 'success');
        } catch (err) {
            showToast('Failed to copy link', 'error');
        }
        document.body.removeChild(textArea);
    }
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('PollPulse initialized');
    console.log('API Base URL:', API_BASE_URL);
    
    // Initialize session
    const sessionId = getSessionId();
    console.log('Session ID:', sessionId);
    
    // Add smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
    
    // Add intersection observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('.animate-fadeInUp').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(40px)';
        el.style.transition = 'all 0.6s ease-out';
        observer.observe(el);
    });
});

// ============================================
// EXPORT FUNCTIONS (Global scope)
// ============================================

window.PollPulse = {
    fetchPolls,
    fetchPoll,
    createPoll,
    submitVote,
    fetchGlobalStats,
    fetchLeaderboard,
    renderPollCard,
    createConfetti,
    showToast,
    showLoading,
    startRealtimeUpdates,
    stopRealtimeUpdates,
    hasVoted,
    markAsVoted,
    shareToTwitter,
    shareToFacebook,
    shareToWhatsApp,
    copyToClipboard,
    validatePollForm,
    escapeHtml,
    formatNumber,
    timeAgo
};

// Also export individual functions to global scope for inline onclick handlers
window.createConfetti = createConfetti;
window.showToast = showToast;