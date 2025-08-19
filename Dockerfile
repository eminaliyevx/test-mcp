# Use Node.js 20 LTS as base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install system dependencies for potential pentesting tools
RUN apk add --no-cache \
    curl \
    wget \
    netcat-openbsd \
    nmap \
    bind-tools \
    openssh-client \
    git \
    python3 \
    py3-pip \
    bash

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/

# Build the TypeScript code
RUN npm run build

# Create a non-root user for security (though this is a pentest tool)
RUN addgroup -g 1001 -S mcpuser && \
    adduser -S mcpuser -u 1001 -G mcpuser

# Set up directories with appropriate permissions
RUN mkdir -p /app/data /app/logs && \
    chown -R mcpuser:mcpuser /app

# Switch to non-root user
USER mcpuser

# Expose port for HTTP transport (if needed)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "console.log('MCP Server Health Check')" || exit 1

# Set environment variables
ENV NODE_ENV=production
ENV MCP_SERVER_NAME=pentest-mcp-server
ENV MCP_SERVER_VERSION=1.0.0

# Default command - can be overridden
CMD ["node", "dist/simple-server.js"]

# Labels for documentation
LABEL maintainer="pentest-team"
LABEL description="Dockerized MCP Server for Penetration Testing"
LABEL version="1.0.0"
LABEL org.opencontainers.image.source="https://github.com/pentest-team/mcp-server"
