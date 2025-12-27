// ============================================
// POLLPULSE - BACKEND SERVER (FIXED)
// ============================================

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { pool, testConnection } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARE
// ============================================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: pool ? 'connected' : 'disconnected'
    });
});

// Get all polls
app.get('/api/polls', async (req, res) => {
    try {
        const { filter = 'all', search = '', limit = 20 } = req.query;
        
        let query = `
            SELECT 
                p.id,
                p.question,
                p.description,
                p.theme,
                p.created_at,
                p.ends_at,
                p.status,
                COUNT(v.id) as vote_count
            FROM polls p
            LEFT JOIN votes v ON p.id = v.poll_id
            WHERE p.status = 'active'
        `;
        
        const params = [];
        
        if (search) {
            query += ` AND p.question LIKE ?`;
            params.push(`%${search}%`);
        }
        
        query += ` GROUP BY p.id ORDER BY p.created_at DESC LIMIT ?`;
        params.push(parseInt(limit));
        
        const [polls] = await pool.query(query, params);
        
        res.json({ success: true, polls });
    } catch (error) {
        console.error('Error fetching polls:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch polls' });
    }
});

// Get single poll with options
app.get('/api/polls/:id', async (req, res) => {
    try {
        const pollId = req.params.id;
        
        const [polls] = await pool.query(
            'SELECT * FROM polls WHERE id = ? AND status = "active"',
            [pollId]
        );
        
        if (polls.length === 0) {
            return res.status(404).json({ success: false, error: 'Poll not found' });
        }
        
        const poll = polls[0];
        
        const [options] = await pool.query(`
            SELECT 
                po.id,
                po.option_text,
                po.emoji,
                po.display_order,
                COUNT(v.id) as vote_count,
                ROUND(COUNT(v.id) * 100.0 / NULLIF((
                    SELECT COUNT(*) FROM votes WHERE poll_id = ?
                ), 0), 2) as percentage
            FROM poll_options po
            LEFT JOIN votes v ON po.id = v.option_id
            WHERE po.poll_id = ?
            GROUP BY po.id
            ORDER BY po.display_order
        `, [pollId, pollId]);
        
        const [totalVotes] = await pool.query(
            'SELECT COUNT(*) as total FROM votes WHERE poll_id = ?',
            [pollId]
        );
        
        res.json({
            success: true,
            poll: {
                ...poll,
                options,
                total_votes: totalVotes[0].total
            }
        });
    } catch (error) {
        console.error('Error fetching poll:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch poll' });
    }
});

// Create new poll
app.post('/api/polls', async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const {
            question,
            description = '',
            options = [],
            theme = 'default',
            duration = 0,
            showResults = true,
            multipleVotes = false
        } = req.body;
        
        if (!question || options.length < 2 || options.length > 10) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid poll data' 
            });
        }
        
        let endsAt = null;
        if (duration > 0) {
            endsAt = new Date(Date.now() + duration * 60 * 60 * 1000);
        }
        
        const [pollResult] = await connection.query(`
            INSERT INTO polls (
                question, 
                description, 
                theme, 
                ends_at, 
                show_results_before_vote,
                allow_multiple_votes,
                status
            ) VALUES (?, ?, ?, ?, ?, ?, 'active')
        `, [question, description, theme, endsAt, showResults, multipleVotes]);
        
        const pollId = pollResult.insertId;
        
        for (let i = 0; i < options.length; i++) {
            await connection.query(`
                INSERT INTO poll_options (
                    poll_id, 
                    option_text, 
                    emoji, 
                    display_order
                ) VALUES (?, ?, ?, ?)
            `, [pollId, options[i].text, options[i].emoji || '📊', i]);
        }
        
        await connection.commit();
        
        res.json({ 
            success: true, 
            pollId,
            message: 'Poll created successfully' 
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error creating poll:', error);
        res.status(500).json({ success: false, error: 'Failed to create poll' });
    } finally {
        connection.release();
    }
});

// Submit vote
app.post('/api/polls/:id/vote', async (req, res) => {
    try {
        const pollId = req.params.id;
        const { optionId, sessionId } = req.body;
        
        if (!optionId || !sessionId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required fields' 
            });
        }
        
        const [polls] = await pool.query(
            'SELECT * FROM polls WHERE id = ? AND status = "active"',
            [pollId]
        );
        
        if (polls.length === 0) {
            return res.status(404).json({ success: false, error: 'Poll not found' });
        }
        
        const poll = polls[0];
        
        if (poll.ends_at && new Date(poll.ends_at) < new Date()) {
            return res.status(400).json({ success: false, error: 'Poll has ended' });
        }
        
        let [users] = await pool.query(
            'SELECT id FROM users WHERE session_id = ?',
            [sessionId]
        );
        
        let userId;
        if (users.length === 0) {
            const [userResult] = await pool.query(
                'INSERT INTO users (session_id) VALUES (?)',
                [sessionId]
            );
            userId = userResult.insertId;
        } else {
            userId = users[0].id;
            
            if (!poll.allow_multiple_votes) {
                const [existingVotes] = await pool.query(
                    'SELECT id FROM votes WHERE poll_id = ? AND user_id = ?',
                    [pollId, userId]
                );
                
                if (existingVotes.length > 0) {
                    return res.status(400).json({ 
                        success: false, 
                        error: 'You have already voted on this poll' 
                    });
                }
            }
        }
        
        await pool.query(`
            INSERT INTO votes (poll_id, option_id, user_id, voted_at)
            VALUES (?, ?, ?, NOW())
        `, [pollId, optionId, userId]);
        
        res.json({ 
            success: true, 
            message: 'Vote recorded successfully' 
        });
    } catch (error) {
        console.error('Error submitting vote:', error);
        res.status(500).json({ success: false, error: 'Failed to submit vote' });
    }
});

// Get global statistics
app.get('/api/stats/global', async (req, res) => {
    try {
        const [stats] = await pool.query(`
            SELECT
                (SELECT COUNT(*) FROM votes WHERE DATE(voted_at) = CURDATE()) as votes_today,
                (SELECT COUNT(DISTINCT user_id) FROM votes WHERE voted_at >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)) as active_users,
                (SELECT COUNT(*) FROM polls WHERE status = 'active') as trending_polls,
                (SELECT COUNT(*) FROM votes WHERE voted_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)) as votes_per_hour
        `);
        
        res.json({ success: true, stats: stats[0] });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch stats' });
    }
});

// Get leaderboard
app.get('/api/leaderboard', async (req, res) => {
    try {
        const { type = 'voters', limit = 10 } = req.query;
        
        let query;
        if (type === 'voters') {
            query = `
                SELECT 
                    u.id,
                    u.username,
                    COUNT(v.id) as total_votes,
                    us.current_streak,
                    COUNT(DISTINCT ub.badge_type) as badges_earned
                FROM users u
                LEFT JOIN votes v ON u.id = v.user_id
                LEFT JOIN user_streaks us ON u.id = us.user_id
                LEFT JOIN user_badges ub ON u.id = ub.user_id
                GROUP BY u.id
                ORDER BY total_votes DESC
                LIMIT ?
            `;
        } else {
            query = `
                SELECT 
                    p.id,
                    p.question,
                    COUNT(v.id) as vote_count,
                    p.created_at
                FROM polls p
                LEFT JOIN votes v ON p.id = v.poll_id
                WHERE p.status = 'active'
                GROUP BY p.id
                ORDER BY vote_count DESC
                LIMIT ?
            `;
        }
        
        const [results] = await pool.query(query, [parseInt(limit)]);
        
        res.json({ success: true, leaderboard: results });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch leaderboard' });
    }
});

// Catch-all for frontend routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
    });
});

// ============================================
// START SERVER
// ============================================

async function startServer() {
    try {
        await testConnection();
        
        app.listen(PORT, () => {
            console.log(`
╔═══════════════════════════════════════╗
║   🎪 PollPulse Server Running        ║
║   Port: ${PORT}                          ║
║   Environment: ${process.env.NODE_ENV || 'development'}            ║
║   Database: Connected                 ║
╚═══════════════════════════════════════╝
            `);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, closing server...');
    const { closePool } = require('./config/database');
    await closePool();
    process.exit(0);
});

module.exports = app;