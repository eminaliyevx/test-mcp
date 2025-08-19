# Port Configuration

This document outlines the port configuration for the Pentest MCP Server to avoid conflicts with existing services.

## 🔌 Port Mapping

### Default Ports (Updated to Avoid Conflicts)

| Service       | Internal Port | External Port | Purpose                     |
| ------------- | ------------- | ------------- | --------------------------- |
| MCP Server    | 3000          | **8765**      | Main MCP server endpoint    |
| Web Interface | 80            | **8090**      | Browser-based control panel |
| Redis         | 6379          | **6380**      | Session storage (optional)  |

### Previous vs New Configuration

#### Before (Potential Conflicts)

```yaml
ports:
  - "3000:3000" # MCP Server
  - "8080:80" # Web Interface
  - "6379:6379" # Redis
```

#### After (Conflict-Free)

```yaml
ports:
  - "8765:3000" # MCP Server
  - "8090:80" # Web Interface
  - "6380:6379" # Redis
```

## 🔄 How to Change Ports

### Option 1: Edit docker-compose.yml

```yaml
services:
  pentest-mcp-server:
    ports:
      - "YOUR_PORT:3000" # Change YOUR_PORT to any available port
```

### Option 2: Use Environment Variables

```bash
# Set custom ports
export MCP_PORT=9999
export WEB_PORT=9998
export REDIS_PORT=9997

# Update docker-compose.yml to use environment variables
ports:
  - "${MCP_PORT:-8765}:3000"
  - "${WEB_PORT:-8090}:80"
  - "${REDIS_PORT:-6380}:6379"
```

### Option 3: Docker Run with Custom Ports

```bash
docker run -it --rm \
  -v $(pwd)/data:/app/data \
  -p 9999:3000 \
  pentest-mcp-server
```

## 🌐 Updated Service URLs

After deployment with the new ports:

- **MCP Server**: http://localhost:8765
- **Health Check**: http://localhost:8765/health
- **Exfiltration Data**: http://localhost:8765/exfil
- **Web Interface**: http://localhost:8090
- **Redis**: localhost:6380

## 🔧 Testing with New Ports

### Test Client Configuration

The test client is automatically configured for the new ports:

```javascript
const client = new SimpleMCPClient("http://localhost:8765");
```

### Manual Testing

```bash
# Health check
curl http://localhost:8765/health

# Exfiltration data
curl http://localhost:8765/exfil

# Web interface
open http://localhost:8090
```

## 🚨 Firewall Configuration

If deploying on a VPS, update firewall rules:

```bash
# Allow new ports
sudo ufw allow 8765/tcp  # MCP Server
sudo ufw allow 8090/tcp  # Web Interface
sudo ufw allow 6380/tcp  # Redis

# Remove old rules (if they exist)
sudo ufw delete allow 3000/tcp
sudo ufw delete allow 8080/tcp
sudo ufw delete allow 6379/tcp
```

## 🔍 Port Conflict Detection

### Check for Port Conflicts

```bash
# Check if ports are in use
netstat -tulpn | grep -E ':(8765|8090|6380)'
lsof -i :8765
lsof -i :8090
lsof -i :6380

# Alternative using ss command
ss -tulpn | grep -E ':(8765|8090|6380)'
```

### Find Available Ports

```bash
# Find available ports in a range
for port in {8000..9000}; do
  if ! netstat -tuln | grep -q ":$port "; then
    echo "Port $port is available"
    break
  fi
done
```

## 🔄 Dynamic Port Assignment

For completely dynamic port assignment, you can use:

```yaml
services:
  pentest-mcp-server:
    ports:
      - "0:3000" # Docker will assign a random available port
```

Then find the assigned port with:

```bash
docker compose port pentest-mcp-server 3000
```

## 📝 Notes

- **Internal ports** (right side of mapping) should not be changed unless you also update the application code
- **External ports** (left side of mapping) can be changed freely to avoid conflicts
- Always verify ports are available before deployment
- Document any custom port changes for your team

## 🎯 Quick Reference

### Start with Custom Ports

```bash
# Method 1: Environment variables
MCP_PORT=9001 WEB_PORT=9002 REDIS_PORT=9003 docker compose up -d

# Method 2: Override file
# Create docker-compose.override.yml with custom ports

# Method 3: Direct edit
# Edit docker-compose.yml ports section
```

### Verify Deployment

```bash
# Check all services are running
docker compose ps

# Test connectivity
curl http://localhost:8765/health
curl http://localhost:8090
```

This configuration should now avoid conflicts with your existing services!
