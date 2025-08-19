#!/bin/sh

# Resilient startup script for the MCP server
# This script tries multiple ways to start the server

echo "🚀 Starting Pentest MCP Server..."

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
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if a file exists and is executable
check_file() {
    if [ -f "$1" ]; then
        print_status "Found: $1"
        return 0
    else
        print_warning "Not found: $1"
        return 1
    fi
}

# Function to try running a command
try_start() {
    local method="$1"
    local command="$2"
    
    print_status "Attempting to start with: $method"
    print_status "Command: $command"
    
    if eval "$command"; then
        print_success "Server started successfully with: $method"
        return 0
    else
        print_error "Failed to start with: $method"
        return 1
    fi
}

# Show environment info
print_status "Environment: ${NODE_ENV:-development}"
print_status "Working directory: $(pwd)"
print_status "Node version: $(node --version 2>/dev/null || echo 'Node not found')"

# Check available files
print_status "Checking available files..."
check_file "dist/simple-server.js"
check_file "src/simple-server.ts"
check_file "src/simple-server.js"

# Try different startup methods in order of preference
print_status "Trying startup methods..."

# Method 1: Compiled JavaScript
if try_start "Compiled JS" "node dist/simple-server.js"; then
    exit 0
fi

# Method 2: ts-node with TypeScript
if command -v ts-node >/dev/null 2>&1; then
    if try_start "ts-node" "ts-node src/simple-server.ts"; then
        exit 0
    fi
else
    print_warning "ts-node not available"
fi

# Method 3: npx ts-node (if ts-node is not globally available)
if try_start "npx ts-node" "npx ts-node src/simple-server.ts"; then
    exit 0
fi

# Method 4: Direct Node.js (if TypeScript was copied as .js)
if try_start "Direct Node" "node src/simple-server.js"; then
    exit 0
fi

# Method 5: Try to run TypeScript file directly (some setups support this)
if try_start "Node with TS" "node src/simple-server.ts"; then
    exit 0
fi

# Method 6: Last resort - try any .js file in dist
if [ -d "dist" ] && [ "$(ls -A dist/*.js 2>/dev/null)" ]; then
    for js_file in dist/*.js; do
        if [ -f "$js_file" ]; then
            if try_start "Fallback JS: $(basename $js_file)" "node $js_file"; then
                exit 0
            fi
        fi
    done
fi

# If all methods failed
print_error "❌ All startup methods failed!"
print_error "Available files:"
ls -la dist/ 2>/dev/null || echo "No dist directory"
ls -la src/ 2>/dev/null || echo "No src directory"

print_error "💡 Debugging information:"
echo "Node.js version: $(node --version 2>/dev/null || echo 'Not available')"
echo "npm version: $(npm --version 2>/dev/null || echo 'Not available')"
echo "Working directory: $(pwd)"
echo "Environment variables:"
env | grep -E "(NODE|MCP)" || echo "No relevant env vars"

print_error "🔧 Possible solutions:"
echo "1. Check if TypeScript compilation succeeded"
echo "2. Verify source files are present"
echo "3. Check if dependencies are installed"
echo "4. Try running: npm install && npm run build"

exit 1
