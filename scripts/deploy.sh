#!/bin/bash

# Pentest MCP Server Deployment Script
# Usage: ./deploy.sh [production|staging|local]

set -e

ENVIRONMENT=${1:-local}
PROJECT_NAME="pentest-mcp-server"

echo "🚀 Deploying $PROJECT_NAME in $ENVIRONMENT environment"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_success "Docker and Docker Compose are available"
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    mkdir -p data logs web
    print_success "Directories created"
}

# Set up environment-specific configuration
setup_environment() {
    print_status "Setting up $ENVIRONMENT environment..."
    
    case $ENVIRONMENT in
        production)
            export NODE_ENV=production
            export MCP_SERVER_NAME="pentest-mcp-server-prod"
            print_warning "🚨 PRODUCTION DEPLOYMENT - Ensure you have proper authorization!"
            ;;
        staging)
            export NODE_ENV=staging
            export MCP_SERVER_NAME="pentest-mcp-server-staging"
            ;;
        local)
            export NODE_ENV=development
            export MCP_SERVER_NAME="pentest-mcp-server-local"
            ;;
        *)
            print_error "Invalid environment: $ENVIRONMENT"
            echo "Valid options: production, staging, local"
            exit 1
            ;;
    esac
    
    print_success "Environment configured for $ENVIRONMENT"
}

# Build and start services
deploy_services() {
    print_status "Building and starting services..."
    
    # Stop existing services
    docker compose down --remove-orphans
    
    # Build and start services
    docker compose up --build -d
    
    # Wait for services to be healthy
    print_status "Waiting for services to be healthy..."
    sleep 10
    
    # Check service status
    if docker compose ps | grep -q "Up"; then
        print_success "Services are running"
    else
        print_error "Services failed to start"
        docker compose logs
        exit 1
    fi
}

# Display deployment information
show_deployment_info() {
    print_success "🎉 Deployment completed successfully!"
    echo ""
    echo "📋 Service Information:"
echo "  • MCP Server: http://localhost:8765"
echo "  • Health Check: http://localhost:8765/health"
echo "  • Exfiltration Data: http://localhost:8765/exfil"
echo "  • Web Interface: http://localhost:8090"
echo "  • Redis: localhost:6380"
    echo ""
    echo "🔧 Management Commands:"
    echo "  • View logs: docker compose logs -f"
    echo "  • Stop services: docker compose down"
    echo "  • Restart services: docker compose restart"
    echo "  • Update services: docker compose pull && docker compose up -d"
    echo ""
    echo "📊 Current Status:"
    docker compose ps
}

# Security reminder
security_reminder() {
    echo ""
    print_warning "🚨 SECURITY REMINDER:"
    echo "  • This tool is for authorized penetration testing only"
    echo "  • Ensure you have proper written authorization"
    echo "  • Use only on systems you own or have explicit permission to test"
    echo "  • Monitor all activities and document findings"
    echo "  • Report vulnerabilities responsibly"
    echo ""
}

# Main deployment flow
main() {
    echo "==============================================="
    echo "🔒 Pentest MCP Server Deployment"
    echo "==============================================="
    
    check_docker
    create_directories
    setup_environment
    deploy_services
    show_deployment_info
    security_reminder
}

# Run main function
main

print_success "Deployment script completed!"
