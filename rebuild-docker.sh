#!/bin/bash

# Pionts - Docker Rebuild Script
# This script rebuilds Docker images and restarts services

set -e  # Exit on any error

echo "🐳 Pionts - Docker Rebuild Script"
echo "=================================="
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

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    print_error "docker-compose.yml not found!"
    exit 1
fi

# Determine compose files to use
COMPOSE_FILES="-f docker-compose.yml"
if [ -f "docker-compose.prod.yml" ]; then
    COMPOSE_FILES="$COMPOSE_FILES -f docker-compose.prod.yml"
    print_success "Using production override: docker-compose.prod.yml"
fi

echo ""
print_warning "This will rebuild all Docker images and restart services."
print_warning "Current containers will be stopped and recreated."
read -p "Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_error "Rebuild cancelled"
    exit 1
fi

echo ""
print_step "Step 1: Stopping current containers"
docker compose $COMPOSE_FILES down
print_success "Containers stopped"

echo ""
print_step "Step 2: Building backend image (no cache)"
docker compose $COMPOSE_FILES build --no-cache backend
print_success "Backend image built"

echo ""
print_step "Step 3: Starting services"
docker compose $COMPOSE_FILES up -d
print_success "Services started"

echo ""
print_step "Step 4: Waiting for database to be ready"
sleep 5
print_success "Database should be ready"

echo ""
print_step "Step 5: Running database migrations"
docker compose exec backend npx prisma migrate deploy
print_success "Migrations applied"

echo ""
print_success "✨ Docker rebuild complete!"
echo ""
echo "🐳 Running containers:"
docker compose ps
echo ""
echo "📊 Health check:"
sleep 2
HEALTH=$(curl -s http://localhost:3000/health 2>/dev/null || echo "Backend not responding")
echo "$HEALTH"
echo ""
echo "📚 Useful commands:"
echo "   - View logs:          docker compose logs -f backend"
echo "   - Check status:       docker compose ps"
echo "   - Stop services:      docker compose down"
echo "   - Restart:            docker compose restart"
echo "   - Shell access:       docker compose exec backend sh"
echo ""
echo "📖 Documentation:"
echo "   - Full guide:         DEPLOYMENT.md"
echo "   - Quick start:        READY_TO_DEPLOY.md"
echo ""
