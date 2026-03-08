# Pionts Deployment Guide

## 🚀 What's New in This Build

### Latest Features (March 2026)

1. **Partner Application System**
   - IBAN validation (MOD-97 algorithm)
   - Social media URL validation (Instagram, TikTok, YouTube, Twitter, Facebook)
   - Address and personal information collection
   - Application approval workflow
   - See: [PARTNER_FORM_VALIDATION.md](PARTNER_FORM_VALIDATION.md)

2. **Required Profile Fields**
   - Full birth date collection (YYYY-MM-DD format, changed from MM-DD)
   - Age verification (minimum 13 years, 18+ for partners)
   - Blocking profile completion page
   - Pre-fill partner application from profile data
   - See: [PROFILE_REQUIRED_FIELDS.md](PROFILE_REQUIRED_FIELDS.md)

3. **Shopify Auto-Apply Discount**
   - One-click "Apply & Checkout" button
   - Automatic discount code application in Shopify cart
   - Configurable via `shopify_domain` setting
   - See: [SHOPIFY_SETUP_GUIDE.md](SHOPIFY_SETUP_GUIDE.md)

4. **Multi-language Support (i18n)**
   - English and German locales
   - Language detection from browser settings
   - Translatable UI components
   - Easy to add more languages

---

## 📋 Prerequisites

### Required Software
- Node.js 20+ (LTS)
- PostgreSQL 17+
- Docker & Docker Compose (for production)
- Nginx (for reverse proxy)
- Git

### Required Services
- SMTP server (for email OTP and notifications)
- Shopify store (optional, for discount integration)
- SSL certificate (Let's Encrypt recommended)

---

## 🔧 Environment Configuration

### Step 1: Copy Environment Template

```bash
# For production deployment
cp .env.production.example .env

# Or for local development
cp backend/.env.example backend/.env
```

### Step 2: Configure Required Variables

Edit `.env` and set these **REQUIRED** fields:

#### Database
```bash
DATABASE_URL=postgresql://pionts_user:STRONG_PASSWORD@postgres:5432/pionts_db
POSTGRES_USER=pionts_user
POSTGRES_PASSWORD=STRONG_PASSWORD  # Generate with: openssl rand -hex 32
POSTGRES_DB=pionts_db
```

#### URLs
```bash
FRONTEND_URL=https://yourdomain.com
ADMIN_URL=https://yourdomain.com/admin
BACKEND_URL=https://yourdomain.com
```

#### Auth Secrets
Generate strong secrets:
```bash
openssl rand -hex 32  # For JWT_SECRET
openssl rand -hex 32  # For JWT_REFRESH_SECRET
openssl rand -hex 32  # For SESSION_SECRET
```

Then set:
```bash
JWT_SECRET=<generated-secret-1>
JWT_REFRESH_SECRET=<generated-secret-2>
SESSION_SECRET=<generated-secret-3>
```

#### SMTP (Required for OTP login)
```bash
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASS=your-password
SMTP_FROM_EMAIL=no-reply@yourdomain.com
```

**Example SMTP Providers:**
- Gmail: `smtp.gmail.com` (requires App Password)
- SendGrid: `smtp.sendgrid.net`
- Mailgun: `smtp.mailgun.org`
- MXroute: `heracles.mxrouting.net`

#### Admin Password
```bash
ADMIN_PASSWORD=STRONG_ADMIN_PASSWORD  # For dashboard login
```

### Step 3: Configure Optional Features

#### Shopify Integration (Optional)
If you want to create discount codes in Shopify:

```bash
SHOPIFY_STORE=your-store.myshopify.com
SHOPIFY_API_KEY=your-api-key
SHOPIFY_API_SECRET=your-api-secret
SHOPIFY_ACCESS_TOKEN=your-access-token
WEBHOOK_SECRET=your-webhook-secret
```

Then configure `shopify_domain` setting in database:
```sql
INSERT INTO settings (project_id, key, value)
VALUES (1, 'shopify_domain', 'your-store.myshopify.com')
ON CONFLICT (project_id, key)
DO UPDATE SET value = 'your-store.myshopify.com';
```

#### Google OAuth (Optional)
To enable Google login:

```bash
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://yourdomain.com/auth/google/callback
```

**Leave empty to disable** - users will use email OTP instead.

---

## 🏗️ Build & Deploy

### Option 1: Docker Compose (Recommended for Production)

```bash
# 1. Build images
docker compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache

# 2. Start services
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 3. Run database migrations
docker compose exec backend npx prisma migrate deploy

# 4. (Optional) Seed initial data
docker compose exec backend npm run seed
```

### Option 2: Manual Build

```bash
# 1. Install dependencies
cd backend && npm ci && cd ..
cd admin-ui && npm ci && cd ..
cd client-ui && npm ci && cd ..
cd sdk && npm ci && cd ..

# 2. Build backend
cd backend
npx prisma generate
npm run build
cd ..

# 3. Build admin dashboard
cd admin-ui
npm run build
cd ..

# 4. Build widget (UMD)
cd client-ui
npm run build:umd
cd ..

# 5. Build SDK loader
cd sdk
npm run build
cd ..

# 6. Run migrations
cd backend
npx prisma migrate deploy
cd ..

# 7. Start backend
cd backend
npm run start:prod
```

---

## 🗄️ Database Setup

### Run Migrations

```bash
# Production
npx prisma migrate deploy

# Development
npx prisma migrate dev
```

### Seed Initial Data (Optional)

```bash
npm run seed
```

This creates:
- 1 organization
- 2 users (admin and member)
- 1 project with API keys
- 10 test customers
- Referral relationships
- Points transactions
- Settings configuration

---

## 🌐 Nginx Configuration

Create `/etc/nginx/sites-available/yourdomain.com`:

```nginx
# Backend API
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /admin {
        alias /path/to/admin-ui/dist;
        try_files $uri $uri/ /index.html;
    }

    location /sdk {
        alias /path/to/sdk/dist;
        add_header Access-Control-Allow-Origin *;
        add_header Cache-Control "public, max-age=31536000";
    }

    location /widget {
        alias /path/to/client-ui/dist-umd;
        add_header Access-Control-Allow-Origin *;
        add_header Cache-Control "public, max-age=31536000";
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/yourdomain.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### SSL Certificate (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## ✅ Post-Deployment Checklist

### 1. Verify Backend is Running

```bash
curl http://localhost:3000/health
# Expected: {"status":"ok","database":"connected"}
```

### 2. Test Email OTP

```bash
# Try logging into widget - should receive OTP email
# Check backend logs for email delivery
docker compose logs backend | grep SMTP
```

### 3. Configure Project Settings

```sql
-- Connect to PostgreSQL
psql postgresql://pionts_user:PASSWORD@localhost:5432/pionts_db

-- Set Shopify domain (if using)
INSERT INTO settings (project_id, key, value)
VALUES (1, 'shopify_domain', 'your-store.myshopify.com');

-- Enable leaderboard (optional)
INSERT INTO settings (project_id, key, value)
VALUES (1, 'leaderboard_enabled', 'true');

-- Set widget colors
INSERT INTO settings (project_id, key, value)
VALUES (1, 'widget_primary_color', '#ff3c00');

INSERT INTO settings (project_id, key, value)
VALUES (1, 'widget_brand_name', 'Your Brand Name');
```

### 4. Test Widget Integration

Create a test HTML file:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Widget Test</title>
</head>
<body>
    <h1>Test Page</h1>

    <script src="https://yourdomain.com/sdk/loyalty.js"></script>
    <script>
      Loyalty.init({
        projectKey: 'pk_live_...',  // Your public API key
        mode: 'floating'
      });
    </script>
</body>
</html>
```

### 5. Test Partner Application

1. Login to widget
2. Complete profile (name + birthdate)
3. Click "Become a Partner"
4. Fill partner application form
5. Verify IBAN and social media validation works
6. Submit application
7. Check database: `SELECT * FROM partner_applications;`

### 6. Test Shopify Auto-Apply

1. Redeem points for discount code
2. Click "Apply & Checkout" button
3. Verify redirect to: `https://your-store.myshopify.com/discount/CODE`
4. Verify discount applied in Shopify cart

---

## 📊 Monitoring & Logs

### View Backend Logs

```bash
# Docker Compose
docker compose logs -f backend

# PM2 (if using)
pm2 logs pionts-backend

# System logs
tail -f /var/log/pionts/backend.log
```

### View Database Logs

```bash
# Docker Compose
docker compose logs -f postgres

# System PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-17-main.log
```

### Health Check

```bash
# Backend health
curl https://yourdomain.com/health

# Database connection
docker compose exec postgres pg_isready -U pionts_user
```

---

## 🔄 Updating to New Version

```bash
# 1. Pull latest code
git pull origin main

# 2. Install new dependencies
cd backend && npm ci && cd ..
cd admin-ui && npm ci && cd ..
cd client-ui && npm ci && cd ..

# 3. Run new migrations
cd backend && npx prisma migrate deploy && cd ..

# 4. Rebuild images
docker compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache

# 5. Restart services
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 6. Verify health
curl https://yourdomain.com/health
```

---

## 🐛 Troubleshooting

### Backend Won't Start

**Error: Missing required environment variables**

Solution: Check `.env` file has all required fields (see Step 2 above)

**Error: Cannot connect to database**

Solution:
```bash
# Check PostgreSQL is running
docker compose ps postgres

# Check connection string
docker compose exec backend env | grep DATABASE_URL

# Test connection manually
psql $DATABASE_URL
```

### Migrations Failing

**Error: Migration already applied**

Solution:
```bash
# Check migration status
npx prisma migrate status

# If stuck, mark as applied
# DELETE FROM _prisma_migrations WHERE migration_name = 'problematic_migration';
```

### Widget Not Loading

**Error: CORS issues**

Solution: Check `FRONTEND_URL`, `ADMIN_URL`, `BACKEND_URL` match your actual domain

**Error: 401 Unauthorized**

Solution: Verify API key is correct and matches project

### Email OTP Not Sending

**Error: Connection refused**

Solution:
```bash
# Test SMTP connection
curl -v telnet://smtp.yourprovider.com:587

# Check backend logs
docker compose logs backend | grep SMTP

# Verify credentials
docker compose exec backend env | grep SMTP
```

---

## 📚 Additional Documentation

- [Partner Application Validation](PARTNER_FORM_VALIDATION.md)
- [Profile Requirements](PROFILE_REQUIRED_FIELDS.md)
- [Shopify Auto-Apply Setup](SHOPIFY_SETUP_GUIDE.md)
- [Shopify Discount Integration](SHOPIFY_DISCOUNT_INTEGRATION.md)
- [Development Guide](DEVELOPMENT.md)
- [Platform Admin (Phase 6)](PHASE6-PLATFORM-ADMIN.md)

---

## 🆘 Support

For issues or questions:
1. Check troubleshooting section above
2. Review error logs: `docker compose logs backend`
3. Check database migrations: `npx prisma migrate status`
4. Verify environment variables: `docker compose exec backend env`

---

## 🎯 Quick Start Summary

```bash
# 1. Configure environment
cp .env.production.example .env
# Edit .env with your values

# 2. Build & start
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# 3. Run migrations
docker compose exec backend npx prisma migrate deploy

# 4. Configure project settings
psql $DATABASE_URL
# INSERT INTO settings (project_id, key, value) VALUES ...

# 5. Test
curl http://localhost:3000/health
```

Done! Your Pionts platform is now running with all the latest features. 🎉
