#!/bin/bash

# ============================================
# POLLPULSE - AUTOMATED DEPLOYMENT SCRIPT
# Deploys all updates to EC2 server
# ============================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SERVER_IP="44.211.7.10"
KEY_PATH="$HOME/.ssh/pollpulse-key.pem"
SERVER_USER="ubuntu"
LOCAL_PROJECT_PATH="$HOME/pollpulse"
REMOTE_PROJECT_PATH="/home/ubuntu/pollpulse"
DB_HOST="pollpulse-db.c6neuowq6ifc.us-east-1.rds.amazonaws.com"
DB_USER="admin"

echo "🎪 PollPulse Deployment Script"
echo "================================"
echo ""

# Step 1: Validate local files exist
echo -e "${YELLOW}Step 1: Validating local files...${NC}"
REQUIRED_FILES=(
    "public/index.html"
    "public/vote.html"
    "public/leaderboard.html"
    "public/css/components.css"
    "server/server.js"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$LOCAL_PROJECT_PATH/$file" ]; then
        echo -e "${RED}Error: $file not found!${NC}"
        echo "Please ensure all updated files are in place."
        exit 1
    fi
done
echo -e "${GREEN}✓ All local files found${NC}"
echo ""

# Step 2: Create backup on server
echo -e "${YELLOW}Step 2: Creating backup on server...${NC}"
BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"
ssh -i "$KEY_PATH" "$SERVER_USER@$SERVER_IP" << EOF
    cd $REMOTE_PROJECT_PATH
    mkdir -p backups/$BACKUP_DIR
    cp -r public backups/$BACKUP_DIR/
    cp server/server.js backups/$BACKUP_DIR/
    echo "Backup created: backups/$BACKUP_DIR"
EOF
echo -e "${GREEN}✓ Backup created${NC}"
echo ""

# Step 3: Upload frontend files
echo -e "${YELLOW}Step 3: Uploading frontend files...${NC}"
scp -i "$KEY_PATH" "$LOCAL_PROJECT_PATH/public/index.html" "$SERVER_USER@$SERVER_IP:$REMOTE_PROJECT_PATH/public/"
scp -i "$KEY_PATH" "$LOCAL_PROJECT_PATH/public/vote.html" "$SERVER_USER@$SERVER_IP:$REMOTE_PROJECT_PATH/public/"
scp -i "$KEY_PATH" "$LOCAL_PROJECT_PATH/public/leaderboard.html" "$SERVER_USER@$SERVER_IP:$REMOTE_PROJECT_PATH/public/"
scp -i "$KEY_PATH" "$LOCAL_PROJECT_PATH/public/css/components.css" "$SERVER_USER@$SERVER_IP:$REMOTE_PROJECT_PATH/public/css/"
echo -e "${GREEN}✓ Frontend files uploaded${NC}"
echo ""

# Step 4: Upload backend files
echo -e "${YELLOW}Step 4: Uploading backend files...${NC}"
scp -i "$KEY_PATH" "$LOCAL_PROJECT_PATH/server/server.js" "$SERVER_USER@$SERVER_IP:$REMOTE_PROJECT_PATH/server/"
echo -e "${GREEN}✓ Backend files uploaded${NC}"
echo ""

# Step 5: Update database schema
echo -e "${YELLOW}Step 5: Updating database schema...${NC}"
read -sp "Enter MySQL password: " DB_PASSWORD
echo ""

ssh -i "$KEY_PATH" "$SERVER_USER@$SERVER_IP" << EOF
    mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD pollpulse << 'SQLEOF'
-- Add username column if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(50) DEFAULT 'Anonymous';

-- Update existing users
UPDATE users SET username = 'Anonymous' WHERE username IS NULL OR username = '';

-- Add index
CREATE INDEX IF NOT EXISTS idx_username ON users(username);

-- Create view for leaderboard
CREATE OR REPLACE VIEW v_leaderboard_voters AS
SELECT 
    u.id,
    COALESCE(u.username, 'Anonymous') as username,
    COUNT(v.id) as total_votes,
    u.created_at
FROM users u
LEFT JOIN votes v ON u.id = v.user_id
GROUP BY u.id
HAVING total_votes > 0
ORDER BY total_votes DESC;

-- Verify
SELECT 'Database schema updated successfully' as status;
SQLEOF
EOF
echo -e "${GREEN}✓ Database schema updated${NC}"
echo ""

# Step 6: Restart application
echo -e "${YELLOW}Step 6: Restarting application...${NC}"
ssh -i "$KEY_PATH" "$SERVER_USER@$SERVER_IP" << EOF
    cd $REMOTE_PROJECT_PATH/server
    pm2 restart pollpulse
    sleep 2
    pm2 status
EOF
echo -e "${GREEN}✓ Application restarted${NC}"
echo ""

# Step 7: Verify deployment
echo -e "${YELLOW}Step 7: Verifying deployment...${NC}"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://$SERVER_IP/api/health)
if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ Server is responding (HTTP $HTTP_STATUS)${NC}"
else
    echo -e "${RED}⚠ Warning: Server returned HTTP $HTTP_STATUS${NC}"
fi
echo ""

# Step 8: Display logs
echo -e "${YELLOW}Step 8: Recent logs:${NC}"
ssh -i "$KEY_PATH" "$SERVER_USER@$SERVER_IP" << EOF
    pm2 logs pollpulse --lines 10 --nostream
EOF
echo ""

# Success message
echo -e "${GREEN}╔═══════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✅ Deployment Completed!           ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════╝${NC}"
echo ""
echo "🌐 Visit: http://$SERVER_IP"
echo "🔐 Admin: http://$SERVER_IP/admin-login.html"
echo ""
echo "📝 Test Checklist:"
echo "  1. Homepage layout"
echo "  2. Vote with username"
echo "  3. Leaderboard tabs"
echo "  4. Admin dashboard"
echo "  5. Copy link feature"
echo ""
echo "📊 Monitor logs: ssh -i $KEY_PATH $SERVER_USER@$SERVER_IP 'pm2 logs pollpulse'"
echo ""