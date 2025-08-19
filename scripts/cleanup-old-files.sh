#!/bin/bash

# Cleanup script for removing old problematic source files
# This script removes the broken index.ts and http-server.ts files

echo "🧹 Cleaning up old problematic source files..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_success() {
    echo -e "${GREEN}[REMOVED]${NC} $1"
}

print_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

# Remove problematic source files
if [ -f "src/index.ts" ]; then
    rm src/index.ts
    print_success "src/index.ts"
else
    print_info "src/index.ts already removed"
fi

if [ -f "src/http-server.ts" ]; then
    rm src/http-server.ts
    print_success "src/http-server.ts"
else
    print_info "src/http-server.ts already removed"
fi

# Clean up any old build artifacts
if [ -d "dist" ]; then
    rm -rf dist
    print_success "dist/ directory"
else
    print_info "dist/ directory already clean"
fi

# Verify only simple-server.ts remains
echo ""
echo "📋 Remaining source files:"
if [ -d "src" ]; then
    ls -la src/
else
    echo "No src/ directory found"
fi

echo ""
echo "✅ Cleanup completed!"
echo "💡 You can now run: docker compose build --no-cache"
