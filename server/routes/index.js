// ============================================
// ROUTE REGISTRATION
// ============================================

const express = require('express');
const router = express.Router();

// Import route modules (we'll create these)
// const pollsRouter = require('./polls');
// const votesRouter = require('./votes');
// const statsRouter = require('./stats');

// Health check
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV
    });
});

// Register routes
// router.use('/polls', pollsRouter);
// router.use('/votes', votesRouter);
// router.use('/stats', statsRouter);

module.exports = router;