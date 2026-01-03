# 🎪 PollPulse - Interactive Voting Platform

**Cloud Computing Capstone Project 2024**

Live Demo: http://44.211.7.10

![PollPulse Banner](https://via.placeholder.com/1200x400/ff0044/ffffff?text=PollPulse)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Folder Structure](#folder-structure)
- [Installation](#installation)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Admin Guide](#admin-guide)
- [Contributing](#contributing)

---

## 🎯 Overview

PollPulse is a real-time interactive polling platform built as a Cloud Computing capstone project. It enables users to create beautiful polls, vote anonymously, share via QR codes, and watch results update in real-time.

**Key Highlights:**
- ✅ Real-time voting with live result updates
- ✅ Anonymous voting (no registration required)
- ✅ QR code generation for easy sharing
- ✅ Activity tracking and leaderboards
- ✅ Admin dashboard for poll management
- ✅ Deployed on AWS (EC2 + RDS)
- ✅ Production-ready with PM2 process manager

---

## ✨ Features

### User Features
- **Create Polls**: Custom questions, emojis, themes, expiration times
- **Vote Anonymously**: No login required, session-based voting
- **Share Anywhere**: QR codes, Twitter, Facebook, WhatsApp, direct links
- **Real-time Results**: Watch vote counts update live
- **Activity Dashboard**: See voting activity and statistics
- **Leaderboard**: Top voters and popular polls
- **Mobile Responsive**: Works on all devices

### Admin Features
- **Poll Management**: View, delete, and manage all polls
- **Activity Monitoring**: See all user activity in real-time
- **Statistics Dashboard**: Active users, vote rates, trends
- **Secure Access**: Password-protected admin panel

---

## 🛠️ Tech Stack

### Frontend
- **HTML5/CSS3**: Modern, responsive UI
- **Vanilla JavaScript**: No frameworks, lightweight
- **Glassmorphism Design**: Beautiful modern UI aesthetic
- **QRCode.js**: QR code generation

### Backend
- **Node.js**: v18+
- **Express.js**: RESTful API server
- **MySQL**: Relational database
- **PM2**: Process manager for production

### Cloud Infrastructure
- **AWS EC2**: t2.micro instance (Ubuntu)
- **AWS RDS**: MySQL 8.0 (db.t3.micro)
- **AWS VPC**: Custom networking with public/private subnets
- **Elastic IP**: Static IP address (44.211.7.10)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Internet Users                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Elastic IP: 44.211.7.10                     │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  Internet Gateway                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   VPC (10.0.0.0/16)                      │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Public Subnet (10.0.0.0/24)                      │  │
│  │  ┌──────────────────────────────────────────────┐ │  │
│  │  │  EC2 Instance (t2.micro)                     │ │  │
│  │  │  - Node.js + Express                         │ │  │
│  │  │  - NGINX (optional)                          │ │  │
│  │  │  - PM2 Process Manager                       │ │  │
│  │  │  - Static Files (HTML/CSS/JS)                │ │  │
│  │  └──────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────┘  │
│                       │                                  │
│                       │ Private Connection               │
│                       ▼                                  │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Private Subnet (10.0.1.0/24)                     │  │
│  │  ┌──────────────────────────────────────────────┐ │  │
│  │  │  RDS MySQL (db.t3.micro)                     │ │  │
│  │  │  - Database: pollpulse                       │ │  │
│  │  │  - Tables: polls, poll_options, votes        │ │  │
│  │  │  - No public access                          │ │  │
│  │  └──────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 Folder Structure

```
pollpulse/
├── docs/                           # Documentation files
│   ├── IMPLEMENTATION-GUIDE.md     # Step-by-step setup
│   ├── AWS-SETUP.md                # AWS infrastructure setup
│   ├── README.md                   # This file
│   ├── visual-design.md            # UI/UX design decisions
│   ├── user-manual.md              # End-user guide
│   ├── deployment-guide.md         # Deployment instructions
│   ├── database-schema.md          # Database design
│   ├── architecture.md             # System architecture
│   └── api-documentation.md        # API endpoints reference
│
├── public/                         # Frontend files (served statically)
│   ├── index.html                  # Homepage
│   ├── explore.html                # Browse all polls
│   ├── create.html                 # Create new poll
│   ├── vote.html                   # Vote on a poll
│   ├── leaderboard.html            # Top voters & polls
│   ├── activity.html               # Activity dashboard
│   ├── manage.html                 # Admin poll management
│   ├── admin-login.html            # Admin login page
│   │
│   ├── css/                        # Stylesheets
│   │   ├── main.css                # Main styles
│   │   ├── animations.css          # Animation effects
│   │   └── components.css          # Reusable components
│   │
│   └── js/                         # JavaScript files
│       ├── app.js                  # Main application logic
│       └── api.js                  # API helper functions
│
├── server/                         # Backend code
│   ├── server.js                   # Main Express server
│   └── config/
│       └── database.js             # Database configuration
│
├── database/                       # Database scripts
│   ├── schema.sql                  # Database schema
│   └── seed.sql                    # Sample data (optional)
│
├── .env                            # Environment variables (not in repo)
├── .gitignore                      # Git ignore rules
├── package.json                    # Node.js dependencies
└── README.md                       # This file
```

### 📄 File Purposes

#### Frontend Pages
- **index.html**: Landing page with features, trending polls, and CTAs
- **explore.html**: Browse all polls with search and filters
- **create.html**: Form to create new polls with themes and options
- **vote.html**: Cast votes and see results with QR codes
- **leaderboard.html**: Top voters and most popular polls
- **activity.html**: Real-time activity feed and statistics
- **manage.html**: Admin dashboard to manage polls (requires login)
- **admin-login.html**: Admin authentication page

#### Backend Files
- **server.js**: Express server with all API routes
- **database.js**: MySQL connection pool and configuration

#### CSS Files
- **main.css**: Base styles, colors, typography, layout
- **animations.css**: Fade-ins, transitions, loading states
- **components.css**: Buttons, cards, forms, modals

#### JavaScript Files
- **app.js**: Global functions, utilities, confetti effects
- **api.js**: Helper functions for API calls (if needed)

---

## 🚀 Installation

### Prerequisites
- Node.js v18+ and npm
- MySQL 8.0+
- AWS Account (for deployment)
- Git

### Local Development Setup

1. **Clone the repository:**
```bash
git clone https://github.com/Asad101001/pollpulse.git
cd pollpulse
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment:**
```bash
cp .env.example .env
nano .env
```

Add these values:
```env
# Database
DB_HOST=your-rds-endpoint.rds.amazonaws.com
DB_USER=admin
DB_PASSWORD=your_password
DB_NAME=pollpulse
DB_PORT=3306

# Server
PORT=3000
NODE_ENV=production

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password
```

4. **Create database tables:**
```bash
mysql -h your-rds-endpoint -u admin -p pollpulse < database/schema.sql
```

5. **Start development server:**
```bash
npm run dev
# Or for production:
npm start
```

6. **Access the application:**
```
http://localhost:3000
```

---

## 📡 API Documentation

### Public Endpoints

#### `GET /api/health`
Health check endpoint
```json
Response: {
  "status": "ok",
  "timestamp": "2024-01-03T10:30:00Z",
  "uptime": 123456,
  "database": "connected"
}
```

#### `GET /api/polls`
Get all polls
```bash
Query params: ?limit=20&filter=all&search=query
Response: {
  "success": true,
  "polls": [...]
}
```

#### `GET /api/polls/:id`
Get single poll with options
```json
Response: {
  "success": true,
  "poll": {
    "id": 1,
    "question": "...",
    "options": [...],
    "total_votes": 123
  }
}
```

#### `POST /api/polls`
Create new poll
```json
Request: {
  "question": "Your question?",
  "description": "Optional description",
  "options": [
    {"text": "Option 1", "emoji": "😊"},
    {"text": "Option 2", "emoji": "👍"}
  ],
  "theme": "default",
  "duration": 0,
  "showResults": true,
  "multipleVotes": false
}
Response: {
  "success": true,
  "pollId": 123
}
```

#### `POST /api/polls/:id/vote`
Submit a vote
```json
Request: {
  "optionId": 5,
  "sessionId": "session_xxx"
}
Response: {
  "success": true,
  "message": "Vote recorded"
}
```

### Admin Endpoints (Require Authentication)

#### `POST /api/admin/login`
Admin login
```json
Request: {
  "username": "admin",
  "password": "password"
}
Response: {
  "success": true,
  "sessionId": "admin_xxx"
}
```

#### `DELETE /api/admin/polls/:id`
Delete poll (admin only)
```bash
Headers: X-Admin-Session: admin_xxx
Response: {"success": true}
```

#### `GET /api/admin/activity`
Get all user activity
```bash
Headers: X-Admin-Session: admin_xxx
Response: {
  "success": true,
  "logs": [...]
}
```

For complete API documentation, see [api-documentation.md](docs/api-documentation.md)

---

## 🌐 Deployment

### AWS Deployment Steps

1. **Launch EC2 Instance:**
   - Ubuntu 22.04 LTS
   - t2.micro (free tier)
   - Security group: ports 22, 80, 443, 3000

2. **Setup RDS Database:**
   - MySQL 8.0
   - db.t3.micro (free tier)
   - Private subnet (no public access)

3. **SSH into EC2:**
```bash
ssh -i ~/.ssh/pollpulse-key.pem ubuntu@44.211.7.10
```

4. **Install dependencies:**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install MySQL client
sudo apt install -y mysql-client
```

5. **Clone and setup:**
```bash
git clone https://github.com/Asad101001/pollpulse.git
cd pollpulse
npm install
```

6. **Configure environment:**
```bash
nano .env
# Add your configuration
```

7. **Start with PM2:**
```bash
pm2 start server/server.js --name pollpulse
pm2 save
pm2 startup
```

8. **Setup NGINX (optional):**
```bash
sudo apt install -y nginx
sudo nano /etc/nginx/sites-available/pollpulse
# Configure reverse proxy
sudo systemctl restart nginx
```

For detailed deployment guide, see [deployment-guide.md](docs/deployment-guide.md)

---

## 🔐 Admin Guide

### Accessing Admin Dashboard

1. Go to: `http://44.211.7.10/admin-login.html`
2. Login with credentials from `.env`
3. Access management at: `http://44.211.7.10/manage.html`

### Admin Capabilities

- **View All Polls**: See every poll created
- **Delete Polls**: Remove inappropriate or test polls
- **Monitor Activity**: Real-time user activity logs
- **View Statistics**: Active users, vote counts, trends

### Changing Admin Password

```bash
ssh ubuntu@44.211.7.10
cd ~/pollpulse
nano .env
# Update ADMIN_PASSWORD
pm2 restart pollpulse
```

---

## 🧪 Testing

### Manual Testing Checklist

- [ ] Create a new poll
- [ ] Vote on a poll
- [ ] Share poll via QR code
- [ ] Test all share buttons (Twitter, Facebook, WhatsApp, Copy)
- [ ] View activity dashboard
- [ ] Check leaderboard
- [ ] Login as admin
- [ ] Delete a poll
- [ ] Verify poll is gone

### Load Testing (Optional)

```bash
# Install Apache Bench
sudo apt install apache2-utils

# Test homepage
ab -n 1000 -c 10 http://44.211.7.10/

# Test API
ab -n 500 -c 5 http://44.211.7.10/api/polls
```

---

## 🐛 Troubleshooting

### Common Issues

**Issue**: PM2 not starting
```bash
# Check logs
pm2 logs pollpulse

# Restart
pm2 restart pollpulse

# Delete and restart
pm2 delete pollpulse
pm2 start server/server.js --name pollpulse
```

**Issue**: Database connection failed
```bash
# Test connection
mysql -h your-rds-endpoint -u admin -p pollpulse

# Check security group allows EC2 → RDS
# Check .env has correct credentials
```

**Issue**: QR code not showing
- Check browser console for errors
- Ensure QRCode.js loads from CDN
- Hard refresh: Ctrl+Shift+R

---

## 📊 Database Schema

```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(30) NULL,
    avatar VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE polls (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question VARCHAR(500) NOT NULL,
    description TEXT,
    theme VARCHAR(50) DEFAULT 'default',
    ends_at TIMESTAMP NULL,
    show_results_before_vote BOOLEAN DEFAULT true,
    allow_multiple_votes BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE poll_options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    poll_id INT NOT NULL,
    option_text VARCHAR(200) NOT NULL,
    emoji VARCHAR(10),
    display_order INT DEFAULT 0,
    FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE
);

CREATE TABLE votes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    poll_id INT NOT NULL,
    option_id INT NOT NULL,
    user_id INT NOT NULL,
    voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE,
    FOREIGN KEY (option_id) REFERENCES poll_options(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action VARCHAR(50) NOT NULL,
    poll_id INT NULL,
    details TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE SET NULL
);
```
