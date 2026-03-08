#!/bin/bash

# Pionts - Complete Rebuild Script
# This script rebuilds the entire application from scratch

set -e  # Exit on any error

echo "🚀 Pionts - Complete Rebuild Script"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${BLUE}>>> $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if .env exists
if [ ! -f ".env" ]; then
    print_error ".env file not found!"
    print_warning "Please create .env from .env.production.example"
    echo ""
    echo "Run: cp .env.production.example .env"
    echo "Then edit .env with your configuration"
    exit 1
fi

print_success ".env file found"
echo ""

# Ask for confirmation
print_warning "This will rebuild the entire application from scratch."
read -p "Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_error "Rebuild cancelled"
    exit 1
fi

echo ""
print_step "Step 1: Cleaning old builds"
rm -rf backend/dist
rm -rf admin-ui/dist
rm -rf client-ui/dist-umd
rm -rf sdk/dist
print_success "Old builds cleaned"

echo ""
print_step "Step 2: Installing backend dependencies"
cd backend
npm ci
print_success "Backend dependencies installed"

echo ""
print_step "Step 3: Generating Prisma client"
npx prisma generate
print_success "Prisma client generated"

echo ""
print_step "Step 4: Building backend"
npm run build
print_success "Backend built"
cd ..

echo ""
print_step "Step 5: Installing admin-ui dependencies"
cd admin-ui
npm ci
print_success "Admin-ui dependencies installed"

echo ""
print_step "Step 6: Building admin dashboard"
npm run build
print_success "Admin dashboard built"
cd ..

echo ""
print_step "Step 7: Installing client-ui dependencies"
cd client-ui
npm ci
print_success "Client-ui dependencies installed"

echo ""
print_step "Step 8: Building widget (UMD)"
npm run build:umd
print_success "Widget built"
cd ..

echo ""
print_step "Step 9: Installing SDK dependencies"
cd sdk
npm ci
print_success "SDK dependencies installed"

echo ""
print_step "Step 10: Building SDK loader"
npm run build
print_success "SDK loader built"
cd ..

echo ""
print_success "All builds completed successfully!"
echo ""

# Check if user wants to run migrations
print_warning "Database migrations need to be applied."
read -p "Run migrations now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    print_step "Running database migrations"
    cd backend
    npx prisma migrate deploy
    print_success "Migrations applied"
    cd ..
else
    print_warning "Skipped migrations. Run manually with: cd backend && npx prisma migrate deploy"
fi

echo ""
print_success "✨ Rebuild complete!"
echo ""
echo "📦 Build artifacts:"
echo "   - Backend:       backend/dist/"
echo "   - Admin:         admin-ui/dist/"
echo "   - Widget:        client-ui/dist-umd/"
echo "   - SDK:           sdk/dist/"
echo ""
echo "🚀 Next steps:"
echo "   1. Start backend:     cd backend && npm run start:prod"
echo "   2. Or use Docker:     docker compose up -d --build"
echo ""
echo "📚 Documentation:"
echo "   - Deployment:         DEPLOYMENT.md"
echo "   - Ready to Deploy:    READY_TO_DEPLOY.md"
echo "   - Partner Features:   PARTNER_FORM_VALIDATION.md"
echo "   - Profile Features:   PROFILE_REQUIRED_FIELDS.md"
echo "   - Shopify Setup:      SHOPIFY_SETUP_GUIDE.md"
echo ""
