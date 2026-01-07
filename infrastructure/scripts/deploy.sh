#!/bin/bash

# ============================================
# POLLPULSE - DEPLOYMENT SCRIPT
# Quick deploy updates to EC2
# ============================================

echo "🚀 Deploying PollPulse updates..."

# Pull latest changes
echo "📥 Pulling latest code..."
git pull origin main

# Install/update dependencies
echo "📦 Installing dependencies..."
cd server
npm install

# Restart PM2
echo "🔄 Restarting application..."
pm2 restart pollpulse

# Show status
pm2 status

echo ""
echo "✅ Deployment complete!"
echo "   View logs: pm2 logs pollpulse"
echo "   Check status: pm2 status
