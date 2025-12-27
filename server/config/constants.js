// ============================================
// APPLICATION CONSTANTS
// ============================================

module.exports = {
    // Server
    PORT: process.env.PORT || 3000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    
    // Database
    DB_CONFIG: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'pollpulse'
    },
    
    // Poll Settings
    MAX_POLL_OPTIONS: 10,
    MIN_POLL_OPTIONS: 2,
    MAX_QUESTION_LENGTH: 500,
    MAX_OPTION_LENGTH: 255,
    
    // Rate Limiting
    VOTE_RATE_LIMIT: {
        windowMs: 60 * 1000, // 1 minute
        max: 10 // 10 votes per minute
    },
    
    // Pagination
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
    
    // Session
    SESSION_SECRET: process.env.SESSION_SECRET || 'dev_secret_change_in_production',
    SESSION_MAX_AGE: 24 * 60 * 60 * 1000, // 24 hours
    
    // Status
    POLL_STATUS: {
        DRAFT: 'draft',
        ACTIVE: 'active',
        ENDED: 'ended',
        ARCHIVED: 'archived'
    },
    
    // Themes
    POLL_THEMES: ['default', 'fire', 'ocean', 'neon', 'forest']
};