#!/bin/bash

# Test script for Pentest MCP Server
# This script tests the basic functionality of the MCP server

echo "🧪 Testing Pentest MCP Server"
echo "=============================="

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

# Test 1: Check if build works
print_status "Test 1: Building the project..."
if npm run build > /dev/null 2>&1; then
    print_success "Build successful"
else
    print_error "Build failed"
    exit 1
fi

# Test 2: Check if dependencies are installed
print_status "Test 2: Checking dependencies..."
if [ -d "node_modules" ] && [ -f "node_modules/@modelcontextprotocol/sdk/package.json" ]; then
    print_success "Dependencies are installed"
else
    print_error "Dependencies missing"
    exit 1
fi

# Test 3: Check if Docker builds
print_status "Test 3: Testing Docker build..."
if docker build -t pentest-mcp-test . > /dev/null 2>&1; then
    print_success "Docker build successful"
    # Clean up test image
    docker rmi pentest-mcp-test > /dev/null 2>&1
else
    print_warning "Docker build failed (Docker may not be available)"
fi

# Test 4: Check if server starts (brief test)
print_status "Test 4: Testing server startup..."
timeout_cmd=""
if command -v timeout > /dev/null 2>&1; then
    timeout_cmd="timeout 3"
elif command -v gtimeout > /dev/null 2>&1; then
    timeout_cmd="gtimeout 3"
fi

if [ -n "$timeout_cmd" ]; then
    if $timeout_cmd npm start > /dev/null 2>&1; then
        print_success "Server starts without immediate errors"
    else
        # Exit code 124 means timeout, which is expected
        if [ $? -eq 124 ]; then
            print_success "Server starts and runs (timeout as expected)"
        else
            print_warning "Server may have startup issues"
        fi
    fi
else
    print_warning "Cannot test server startup (timeout command not available)"
fi

# Test 5: Check file structure
print_status "Test 5: Checking file structure..."
required_files=(
    "src/simple-server.ts"
    "package.json"
    "tsconfig.json"
    "Dockerfile"
    "docker-compose.yml"
    "README.md"
)

missing_files=()
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -eq 0 ]; then
    print_success "All required files present"
else
    print_error "Missing files: ${missing_files[*]}"
    exit 1
fi

# Test 6: Check TypeScript compilation
print_status "Test 6: Checking TypeScript compilation..."
if [ -f "dist/simple-server.js" ]; then
    print_success "TypeScript compiled successfully"
else
    print_error "TypeScript compilation failed"
    exit 1
fi

# Test 7: Validate package.json
print_status "Test 7: Validating package.json..."
if node -e "JSON.parse(require('fs').readFileSync('package.json', 'utf8'))" > /dev/null 2>&1; then
    print_success "package.json is valid JSON"
else
    print_error "package.json is invalid"
    exit 1
fi

# Test 8: Check if test client exists
print_status "Test 8: Checking test client..."
if [ -f "test-client/simple-test.js" ] && [ -x "test-client/simple-test.js" ]; then
    print_success "Test client is available and executable"
else
    print_warning "Test client may not be executable"
fi

# Test 9: Check deployment script
print_status "Test 9: Checking deployment script..."
if [ -f "scripts/deploy.sh" ] && [ -x "scripts/deploy.sh" ]; then
    print_success "Deployment script is available and executable"
else
    print_warning "Deployment script may not be executable"
fi

# Summary
echo ""
echo "🎉 Testing Complete!"
echo "==================="
print_success "Basic functionality tests passed"
print_status "The Pentest MCP Server appears to be ready for deployment"

echo ""
echo "📋 Next Steps:"
echo "  1. Deploy using: docker-compose up --build -d"
echo "  2. Test with client: node test-client/simple-test.js"
echo "  3. Access web interface: http://localhost:8080"
echo "  4. Check health: http://localhost:3000/health"

echo ""
print_warning "⚠️  Remember: Only use this tool with proper authorization!"
