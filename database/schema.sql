-- ============================================
-- POLLPULSE DATABASE SCHEMA
-- MySQL 8.0+
-- ============================================

CREATE DATABASE IF NOT EXISTS pollpulse 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE pollpulse;

-- ============================================
-- CORE TABLES
-- ============================================

-- Users table (session-based)
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50),
    ip_address VARCHAR(45),
    country_code VARCHAR(2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_session (session_id),
    INDEX idx_active (last_active)
) ENGINE=InnoDB;

-- Polls table
CREATE TABLE polls (
    id INT PRIMARY KEY AUTO_INCREMENT,
    question VARCHAR(500) NOT NULL,
    description TEXT,
    creator_id INT,
    
    -- Visual settings
    theme ENUM('default', 'fire', 'ocean', 'neon', 'forest') DEFAULT 'default',
    background_emoji VARCHAR(10),
    
    -- Behavior settings
    allow_multiple_votes BOOLEAN DEFAULT FALSE,
    show_results_before_vote BOOLEAN DEFAULT TRUE,
    anonymous_results BOOLEAN DEFAULT TRUE,
    
    -- Timing
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ends_at TIMESTAMP NULL,
    
    -- Status
    status ENUM('draft', 'active', 'ended', 'archived') DEFAULT 'active',
    featured BOOLEAN DEFAULT FALSE,
    
    -- Engagement
    view_count INT DEFAULT 0,
    
    FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_created (created_at DESC),
    INDEX idx_featured (featured, created_at DESC)
) ENGINE=InnoDB;

-- Poll options
CREATE TABLE poll_options (
    id INT PRIMARY KEY AUTO_INCREMENT,
    poll_id INT NOT NULL,
    option_text VARCHAR(255) NOT NULL,
    emoji VARCHAR(10),
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE,
    INDEX idx_poll (poll_id, display_order)
) ENGINE=InnoDB;

-- Votes
CREATE TABLE votes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    poll_id INT NOT NULL,
    option_id INT NOT NULL,
    user_id INT,
    
    -- Vote metadata
    voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    vote_time_ms INT,
    ip_address VARCHAR(45),
    device_type ENUM('mobile', 'tablet', 'desktop') DEFAULT 'desktop',
    
    FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE,
    FOREIGN KEY (option_id) REFERENCES poll_options(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_poll_time (poll_id, voted_at DESC),
    INDEX idx_option (option_id),
    INDEX idx_user (user_id)
) ENGINE=InnoDB;

-- ============================================
-- GAMIFICATION TABLES
-- ============================================

-- User badges
CREATE TABLE user_badges (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    badge_type ENUM(
        'first_vote',
        'streak_3',
        'streak_7',
        'streak_30',
        'speed_demon',
        'viral_creator',
        'globe_trotter'
    ) NOT NULL,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_badge (user_id, badge_type),
    INDEX idx_earned (earned_at DESC)
) ENGINE=InnoDB;

-- Voting streaks
CREATE TABLE user_streaks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    current_streak INT DEFAULT 0,
    longest_streak INT DEFAULT 0,
    last_vote_date DATE,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================
-- ANALYTICS TABLES
-- ============================================

-- Hourly poll stats
CREATE TABLE poll_stats_hourly (
    id INT PRIMARY KEY AUTO_INCREMENT,
    poll_id INT NOT NULL,
    hour_timestamp TIMESTAMP NOT NULL,
    votes_count INT DEFAULT 0,
    unique_voters INT DEFAULT 0,
    
    FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE,
    UNIQUE KEY unique_poll_hour (poll_id, hour_timestamp),
    INDEX idx_timestamp (hour_timestamp DESC)
) ENGINE=InnoDB;

-- ============================================
-- SEED DATA
-- ============================================

-- Create sample users
INSERT INTO users (session_id, username) VALUES 
('demo_session_1', 'DemoUser1'),
('demo_session_2', 'DemoUser2'),
('demo_session_3', 'DemoUser3');

-- Create sample polls
INSERT INTO polls (question, description, theme, featured) VALUES
('🍕 Pineapple on pizza: Yay or Nay?', 'Settle this debate once and for all!', 'default', TRUE),
('🦸 Ultimate Superhero Battle', 'Who would win in a fight?', 'fire', TRUE),
('☕ How do you take your coffee?', 'Morning routine preferences', 'default', TRUE),
('🎮 Best Gaming Platform 2024?', 'Vote for your favorite gaming system', 'neon', TRUE);

-- Poll 1 options
INSERT INTO poll_options (poll_id, option_text, emoji, display_order) VALUES
(1, 'Absolutely YES!', '✅', 1),
(1, 'NO WAY!', '❌', 2),
(1, 'I don\'t care', '🤷', 3);

-- Poll 2 options
INSERT INTO poll_options (poll_id, option_text, emoji, display_order) VALUES
(2, 'Batman', '🦇', 1),
(2, 'Superman', '💪', 2),
(2, 'Spider-Man', '🕷️', 3);

-- Poll 3 options
INSERT INTO poll_options (poll_id, option_text, emoji, display_order) VALUES
(3, 'Black', '⚫', 1),
(3, 'With milk', '🥛', 2),
(3, 'Fancy (latte/etc)', '🍰', 3);

-- Poll 4 options
INSERT INTO poll_options (poll_id, option_text, emoji, display_order) VALUES
(4, 'PC Gaming', '💻', 1),
(4, 'PlayStation', '🎮', 2),
(4, 'Xbox', '🟢', 3),
(4, 'Nintendo Switch', '🕹️', 4);

-- Sample votes
INSERT INTO votes (poll_id, option_id, user_id, voted_at) VALUES
(1, 1, 1, DATE_SUB(NOW(), INTERVAL 5 MINUTE)),
(1, 1, 2, DATE_SUB(NOW(), INTERVAL 10 MINUTE)),
(1, 2, 3, DATE_SUB(NOW(), INTERVAL 15 MINUTE)),
(2, 1, 1, DATE_SUB(NOW(), INTERVAL 3 MINUTE)),
(2, 2, 2, DATE_SUB(NOW(), INTERVAL 7 MINUTE)),
(3, 1, 3, DATE_SUB(NOW(), INTERVAL 12 MINUTE));

-- ============================================
-- STORED PROCEDURES
-- ============================================

DELIMITER //

-- Update streak on vote
CREATE TRIGGER tr_update_streak
AFTER INSERT ON votes
FOR EACH ROW
BEGIN
    INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_vote_date)
    VALUES (NEW.user_id, 1, 1, DATE(NEW.voted_at))
    ON DUPLICATE KEY UPDATE
        current_streak = CASE
            WHEN DATEDIFF(DATE(NEW.voted_at), last_vote_date) = 1 
            THEN current_streak + 1
            WHEN DATEDIFF(DATE(NEW.voted_at), last_vote_date) > 1 
            THEN 1
            ELSE current_streak
        END,
        longest_streak = GREATEST(longest_streak, 
            CASE
                WHEN DATEDIFF(DATE(NEW.voted_at), last_vote_date) = 1 
                THEN current_streak + 1
                ELSE current_streak
            END
        ),
        last_vote_date = DATE(NEW.voted_at);
END//

DELIMITER ;

-- ============================================
-- VIEWS
-- ============================================

-- Current poll results
CREATE VIEW v_poll_results AS
SELECT 
    p.id AS poll_id,
    p.question,
    po.id AS option_id,
    po.option_text,
    po.emoji,
    COUNT(v.id) AS vote_count,
    ROUND(COUNT(v.id) * 100.0 / NULLIF(
        (SELECT COUNT(*) FROM votes WHERE poll_id = p.id), 0
    ), 2) AS percentage
FROM polls p
JOIN poll_options po ON p.id = po.poll_id
LEFT JOIN votes v ON po.id = v.option_id
WHERE p.status = 'active'
GROUP BY p.id, po.id
ORDER BY p.id, vote_count DESC;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_active_polls ON polls(status, created_at DESC);
CREATE INDEX idx_recent_votes ON votes(voted_at DESC);

-- ============================================
-- APPLICATION USER
-- ============================================

CREATE USER IF NOT EXISTS 'pollpulse_app'@'%' 
IDENTIFIED BY 'CHANGE_THIS_PASSWORD';

GRANT SELECT, INSERT, UPDATE ON pollpulse.* 
TO 'pollpulse_app'@'%';

FLUSH PRIVILEGES;

-- ============================================
-- VERIFICATION
-- ============================================

SELECT 'Database schema created successfully!' AS status;