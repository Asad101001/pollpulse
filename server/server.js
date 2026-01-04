const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { pool, testConnection } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Admin credentials and session storage
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'asad';
const adminSessions = new Map();

// Admin authentication middleware
function requireAdmin(req, res, next) {
    const sessionId = req.headers['x-admin-session'];
    
    if (!sessionId || !adminSessions.has(sessionId)) {
        return res.status(401).json({ 
            success: false, 
            error: 'Unauthorized - Admin access required' 
        });
    }
    
    const session = adminSessions.get(sessionId);
    if (Date.now() - session.timestamp > 24 * 60 * 60 * 1000) {
        adminSessions.delete(sessionId);
        return res.status(401).json({ 
            success: false, 
            error: 'Session expired' 
        });
    }
    
    session.timestamp = Date.now();
    next();
}

// ============================================
// HEALTH & STATUS
// ============================================

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: pool ? 'connected' : 'disconnected'
    });
});

// ============================================
// ADMIN AUTHENTICATION
// ============================================

app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        const sessionId = 'admin_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        adminSessions.set(sessionId, {
            username,
            timestamp: Date.now()
        });
        
        res.json({
            success: true,
            sessionId,
            message: 'Login successful'
        });
    } else {
        res.status(401).json({
            success: false,
            error: 'Invalid credentials'
        });
    }
});

app.post('/api/admin/logout', (req, res) => {
    const sessionId = req.headers['x-admin-session'];
    if (sessionId) {
        adminSessions.delete(sessionId);
    }
    res.json({ success: true, message: 'Logged out' });
});

app.get('/api/admin/check', requireAdmin, (req, res) => {
    res.json({ success: true, authenticated: true });
});

// ============================================
// ADMIN POLL MANAGEMENT
// ============================================

// Get all polls (admin - includes ended polls)
app.get('/api/admin/polls', requireAdmin, async (req, res) => {
    try {
        const [polls] = await pool.query(`
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
            GROUP BY p.id
            ORDER BY p.created_at DESC
        `);
        
        res.json({ success: true, polls });
    } catch (error) {
        console.error('Error fetching admin polls:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch polls' });
    }
});

// Get voters for a specific poll (admin only)
app.get('/api/admin/polls/:id/voters', requireAdmin, async (req, res) => {
    try {
        const pollId = req.params.id;
        
        const [voters] = await pool.query(`
            SELECT 
                v.id as vote_id,
                v.voted_at,
                COALESCE(u.username, 'Anonymous') as username,
                u.session_id,
                po.option_text,
                po.emoji,
                u.ip_address
            FROM votes v
            JOIN users u ON v.user_id = u.id
            JOIN poll_options po ON v.option_id = po.id
            WHERE v.poll_id = ?
            ORDER BY v.voted_at DESC
        `, [pollId]);
        
        res.json({ success: true, voters });
    } catch (error) {
        console.error('Error fetching voters:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch voters' });
    }
});

// Delete poll (admin only)
app.delete('/api/admin/polls/:id', requireAdmin, async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        const pollId = req.params.id;
        
        const [polls] = await connection.query(
            'SELECT id FROM polls WHERE id = ?',
            [pollId]
        );
        
        if (polls.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Poll not found' 
            });
        }
        
        await connection.beginTransaction();
        
        await connection.query('DELETE FROM votes WHERE poll_id = ?', [pollId]);
        await connection.query('DELETE FROM poll_options WHERE poll_id = ?', [pollId]);
        await connection.query('DELETE FROM polls WHERE id = ?', [pollId]);
        
        await connection.commit();
        
        console.log(`Admin deleted poll ${pollId}`);
        
        res.json({ 
            success: true, 
            message: 'Poll deleted successfully' 
        });
        
    } catch (error) {
        await connection.rollback();
        console.error('Error deleting poll:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to delete poll' 
        });
    } finally {
        connection.release();
    }
});

// Update poll status (admin only)
app.patch('/api/admin/polls/:id/status', requireAdmin, async (req, res) => {
    try {
        const pollId = req.params.id;
        const { status } = req.body;
        
        if (!['active', 'ended'].includes(status)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid status' 
            });
        }
        
        await pool.query(
            'UPDATE polls SET status = ? WHERE id = ?',
            [status, pollId]
        );
        
        console.log(`Admin updated poll ${pollId} status to ${status}`);
        
        res.json({ 
            success: true, 
            message: 'Poll status updated' 
        });
        
    } catch (error) {
        console.error('Error updating poll status:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to update poll status' 
        });
    }
});

// ============================================
// PUBLIC POLL ENDPOINTS
// ============================================

// Get all polls (public - active only)
app.get('/api/polls', async (req, res) => {
    try {
        const { filter = 'all', search = '', limit = 50 } = req.query;
        
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
            'SELECT * FROM polls WHERE id = ?',
            [pollId]
        );
        
        if (polls.length === 0) {
            return res.status(404).json({ success: false, error: 'Poll not found' });
        }
        
        const poll = polls[0];
        
        // Check if poll has ended
        if (poll.ends_at && new Date(poll.ends_at) < new Date()) {
            poll.status = 'ended';
        }
        
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

// Submit vote (with username support)
app.post('/api/polls/:id/vote', async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        const pollId = req.params.id;
        const { optionId, sessionId, username = 'Anonymous' } = req.body;
        
        if (!optionId || !sessionId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required fields' 
            });
        }
        
        const [polls] = await connection.query(
            'SELECT * FROM polls WHERE id = ?',
            [pollId]
        );
        
        if (polls.length === 0) {
            return res.status(404).json({ success: false, error: 'Poll not found' });
        }
        
        const poll = polls[0];
        
        if (poll.ends_at && new Date(poll.ends_at) < new Date()) {
            return res.status(400).json({ success: false, error: 'Poll has ended' });
        }
        
        await connection.beginTransaction();
        
        // Get or create user with username
        let [users] = await connection.query(
            'SELECT id FROM users WHERE session_id = ?',
            [sessionId]
        );
        
        let userId;
        const cleanUsername = (username || 'Anonymous').trim().substring(0, 50);
        
        if (users.length === 0) {
            const [userResult] = await connection.query(
                'INSERT INTO users (session_id, username, created_at) VALUES (?, ?, NOW())',
                [sessionId, cleanUsername]
            );
            userId = userResult.insertId;
        } else {
            userId = users[0].id;
            
            // Update username if provided
            await connection.query(
                'UPDATE users SET username = ? WHERE id = ?',
                [cleanUsername, userId]
            );
            
            if (!poll.allow_multiple_votes) {
                const [existingVotes] = await connection.query(
                    'SELECT id FROM votes WHERE poll_id = ? AND user_id = ?',
                    [pollId, userId]
                );
                
                if (existingVotes.length > 0) {
                    await connection.rollback();
                    return res.status(400).json({ 
                        success: false, 
                        error: 'You have already voted on this poll' 
                    });
                }
            }
        }
        
        await connection.query(`
            INSERT INTO votes (poll_id, option_id, user_id, voted_at)
            VALUES (?, ?, ?, NOW())
        `, [pollId, optionId, userId]);
        
        await connection.commit();
        
        res.json({ 
            success: true, 
            message: 'Vote recorded successfully',
            username: cleanUsername
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error submitting vote:', error);
        res.status(500).json({ success: false, error: 'Failed to submit vote' });
    } finally {
        connection.release();
    }
});

// ============================================
// STATISTICS ENDPOINTS
// ============================================

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

// Get top voters (with usernames)
app.get('/api/stats/top-voters', async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        
        const [voters] = await pool.query(`
            SELECT 
                u.id,
                COALESCE(u.username, 'Anonymous') as username,
                u.created_at,
                COUNT(v.id) as total_votes
            FROM users u
            LEFT JOIN votes v ON u.id = v.user_id
            GROUP BY u.id
            HAVING total_votes > 0
            ORDER BY total_votes DESC
            LIMIT ?
        `, [parseInt(limit)]);
        
        res.json({ success: true, voters });
    } catch (error) {
        console.error('Error fetching top voters:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch top voters' });
    }
});

// Get leaderboard (polls only for now)
app.get('/api/leaderboard', async (req, res) => {
    try {
        const { type = 'polls', limit = 10 } = req.query;
        
        if (type === 'polls') {
            const [polls] = await pool.query(`
                SELECT 
                    p.id,
                    p.question,
                    p.created_at,
                    COUNT(v.id) as vote_count
                FROM polls p
                LEFT JOIN votes v ON p.id = v.poll_id
                WHERE p.status = 'active'
                GROUP BY p.id
                ORDER BY vote_count DESC, p.created_at DESC
                LIMIT ?
            `, [parseInt(limit)]);
            
            res.json({ success: true, leaderboard: polls });
        } else {
            res.json({ success: true, leaderboard: [] });
        }
        
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch leaderboard' 
        });
    }
});

// ============================================
// ERROR HANDLING & CATCH-ALL
// ============================================

// Catch-all for frontend routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
    });
});

// ============================================
// SERVER STARTUP
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
║   Features:                           ║
║   ✓ Username Support                  ║
║   ✓ Admin Dashboard                   ║
║   ✓ Voter Details                     ║
║   ✓ Real-time Stats                   ║
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