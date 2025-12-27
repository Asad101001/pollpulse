#!/bin/bash

# ============================================
# POLLPULSE - EC2 SETUP SCRIPT
# Run this on your EC2 instance
# ============================================

echo "🎪 Setting up PollPulse on EC2..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
echo "📦 Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MySQL client
echo "📦 Installing MySQL client..."
sudo apt install -y mysql-client

# Install Git
echo "📦 Installing Git..."
sudo apt install -y git

# Install PM2
echo "📦 Installing PM2 process manager..."
sudo npm install -g pm2

# Install NGINX
echo "📦 Installing NGINX..."
sudo apt install -y nginx

# Verify installations
echo ""
echo "✅ Installation complete!"
echo "   Node version: $(node --version)"
echo "   NPM version: $(npm --version)"
echo "   PM2 version: $(pm2 --version)"
echo "   NGINX version: $(nginx -v 2>&1)"
echo ""
echo "📝 Next steps:"
echo "   1. Clone your repository: git clone https://github.com/YOUR_USERNAME/pollpulse.git"
echo "   2. Navigate to server: cd pollpulse/server"
echo "   3. Install dependencies: npm install"
echo "   4. Create .env file with your RDS credentials"
echo "   5. Import database schema"
echo "   6. Start application with PM2"