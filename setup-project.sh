#!/bin/bash

# PollPulse Project Setup Script
# Run this to create complete folder structure

echo "🎪 Setting up PollPulse project structure..."

# Create main directories
mkdir -p pollpulse
cd pollpulse

# Create subdirectories
mkdir -p docs/{images,diagrams}
mkdir -p database/migrations
mkdir -p server/{config,routes,controllers,models,services,utils}
mkdir -p public/{css,js,assets/{images,icons,fonts}}
mkdir -p infrastructure/{cloudformation,scripts}
mkdir -p tests/{unit,integration}

# Create empty files for documentation
touch docs/architecture.md
touch docs/database-schema.md
touch docs/api-documentation.md
touch docs/deployment-guide.md
touch docs/user-manual.md
touch docs/visual-design.md

# Create database files
touch database/schema.sql
touch database/seed-data.sql
touch database/stored-procedures.sql

# Create server files
touch server/package.json
touch server/server.js
touch server/config/database.js
touch server/config/constants.js
touch server/routes/polls.js
touch server/routes/votes.js
touch server/routes/stats.js
touch server/controllers/pollController.js
touch server/controllers/voteController.js
touch server/controllers/statsController.js
touch server/models/Poll.js
touch server/models/Vote.js
touch server/models/User.js
touch server/services/realtimeService.js
touch server/services/analyticsService.js
touch server/utils/validators.js
touch server/utils/logger.js

# Create frontend files
touch public/index.html
touch public/explore.html
touch public/create.html
touch public/vote.html
touch public/results.html
touch public/leaderboard.html
touch public/css/main.css
touch public/css/animations.css
touch public/css/components.css
touch public/css/themes.css
touch public/js/app.js
touch public/js/api.js
touch public/js/realtime.js
touch public/js/charts.js
touch public/js/animations.js
touch public/js/voting.js
touch public/js/stats.js

# Create infrastructure files
touch infrastructure/cloudformation/vpc.yaml
touch infrastructure/cloudformation/ec2.yaml
touch infrastructure/cloudformation/rds.yaml
touch infrastructure/cloudformation/s3.yaml
touch infrastructure/scripts/setup-ec2.sh
touch infrastructure/scripts/deploy.sh
touch infrastructure/scripts/backup.sh

# Create config files
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
package-lock.json

# Environment variables
.env
.env.local
.env.production

# Logs
logs/
*.log
npm-debug.log*

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/

# AWS
*.pem
*.key

# Temporary files
tmp/
temp/
*.tmp

# Build output
dist/
build/

# Database
*.sql.backup
EOF

cat > .env.example << 'EOF'
# Database Configuration
DB_HOST=your-rds-endpoint.amazonaws.com
DB_PORT=3306
DB_NAME=pollpulse
DB_USER=pollpulse_app
DB_PASSWORD=your_secure_password

# Server Configuration
NODE_ENV=production
PORT=3000
SESSION_SECRET=your_session_secret_here

# AWS Configuration
AWS_REGION=us-east-1
S3_BUCKET_NAME=pollpulse-assets

# Application Settings
MAX_POLL_OPTIONS=10
VOTE_RATE_LIMIT=10
ENABLE_ANALYTICS=true
EOF

cat > server/.eslintrc.json << 'EOF'
{
  "env": {
    "node": true,
    "es2021": true
  },
  "extends": "eslint:recommended",
  "parserOptions": {
    "ecmaVersion": 12
  },
  "rules": {
    "no-console": "off",
    "no-unused-vars": "warn"
  }
}
EOF

# Create README placeholders
cat > docs/README.md << 'EOF'
# Documentation

This folder contains all project documentation:

- `architecture.md` - System architecture and design decisions
- `database-schema.md` - Complete database schema documentation
- `api-documentation.md` - REST API endpoints and usage
- `deployment-guide.md` - Step-by-step AWS deployment
- `user-manual.md` - End-user documentation
- `visual-design.md` - UI/UX design system

## Quick Links

- [Project Proposal](project-proposal.md)
- [Implementation Plan](implementation-plan.md)
- [Security Report](security-report.md)
EOF

# Initialize Git
git init

echo ""
echo "✅ Project structure created successfully!"
echo ""
echo "📁 Directory structure:"
tree -L 2 -I 'node_modules' || ls -R

echo ""
echo "🎯 Next steps:"
echo "1. cd pollpulse"
echo "2. Copy artifacts into respective files"
echo "3. git add ."
echo "4. git commit -m '🎪 feat: initial project structure'"
echo "5. Create GitHub repo and push"
echo ""
echo "🚀 Ready to start building!"