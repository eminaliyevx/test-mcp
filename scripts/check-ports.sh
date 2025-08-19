#!/bin/bash

# Port Conflict Checker for Pentest MCP Server
# This script checks if the configured ports are available

echo "🔍 Checking Port Availability"
echo "============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[AVAILABLE]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[IN USE]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Default ports from docker-compose.yml
MCP_PORT=8765
WEB_PORT=8090
REDIS_PORT=6380

# Function to check if a port is in use
check_port() {
    local port=$1
    local service=$2
    
    # Check using netstat (more portable)
    if command -v netstat > /dev/null 2>&1; then
        if netstat -tuln 2>/dev/null | grep -q ":$port "; then
            print_warning "Port $port ($service) is already in use"
            return 1
        fi
    # Fallback to lsof
    elif command -v lsof > /dev/null 2>&1; then
        if lsof -i :$port > /dev/null 2>&1; then
            print_warning "Port $port ($service) is already in use"
            return 1
        fi
    # Fallback to ss
    elif command -v ss > /dev/null 2>&1; then
        if ss -tuln | grep -q ":$port "; then
            print_warning "Port $port ($service) is already in use"
            return 1
        fi
    else
        print_error "No port checking tools available (netstat, lsof, ss)"
        return 2
    fi
    
    print_success "Port $port ($service) is available"
    return 0
}

# Function to find an alternative port
find_alternative_port() {
    local start_port=$1
    local service=$2
    
    print_status "Looking for alternative port for $service..."
    
    for ((port=start_port; port<=start_port+100; port++)); do
        if ! netstat -tuln 2>/dev/null | grep -q ":$port " && \
           ! lsof -i :$port > /dev/null 2>&1; then
            print_success "Alternative port found: $port ($service)"
            return $port
        fi
    done
    
    print_error "No alternative port found for $service"
    return 0
}

# Check current configuration
echo "🔍 Checking current port configuration..."
echo ""

conflicts=0

# Check MCP Server port
if ! check_port $MCP_PORT "MCP Server"; then
    conflicts=$((conflicts + 1))
    find_alternative_port 8700 "MCP Server"
fi

# Check Web Interface port
if ! check_port $WEB_PORT "Web Interface"; then
    conflicts=$((conflicts + 1))
    find_alternative_port 8000 "Web Interface"
fi

# Check Redis port
if ! check_port $REDIS_PORT "Redis"; then
    conflicts=$((conflicts + 1))
    find_alternative_port 6300 "Redis"
fi

echo ""

# Summary
if [ $conflicts -eq 0 ]; then
    print_success "✅ All ports are available! You can proceed with deployment."
    echo ""
    echo "📋 Current Configuration:"
    echo "  • MCP Server: http://localhost:$MCP_PORT"
    echo "  • Web Interface: http://localhost:$WEB_PORT"
    echo "  • Redis: localhost:$REDIS_PORT"
    echo ""
    echo "🚀 Deploy with: docker-compose up --build -d"
else
    print_warning "⚠️  $conflicts port(s) are already in use."
    echo ""
    echo "🔧 To fix port conflicts:"
    echo "  1. Use the suggested alternative ports above"
    echo "  2. Edit docker-compose.yml to change the external ports"
    echo "  3. Or stop the conflicting services temporarily"
    echo ""
    echo "📝 Example docker-compose.yml port configuration:"
    echo "    ports:"
    echo "      - \"NEW_PORT:3000\"  # Change NEW_PORT to an available port"
fi

echo ""
echo "💡 Pro Tip: Use 'docker-compose port SERVICE_NAME INTERNAL_PORT' to find assigned ports"
echo "   Example: docker-compose port pentest-mcp-server 3000"
