# Pentest MCP Server - Deployment Summary

## 🎯 Project Overview

This is a **dockerized Model Context Protocol (MCP) server** designed for penetration testing and security research. The server implements various tools that can be used to test MCP client security implementations and identify potential vulnerabilities.

## 📁 Project Structure

```
test-mcp/
├── src/
│   └── simple-server.ts          # Main MCP server implementation
├── test-client/
│   └── simple-test.js             # Test client for demonstration
├── web/
│   └── index.html                 # Web interface for easier interaction
├── scripts/
│   └── deploy.sh                  # Deployment automation script
├── docker-compose.yml             # Docker Compose configuration
├── docker-compose.override.yml    # Development overrides
├── Dockerfile                     # Container definition
├── README.md                      # Comprehensive documentation
├── SECURITY-TESTING.md           # Security testing guidelines
└── package.json                  # Node.js dependencies
```

## 🛠️ Available Tools

The MCP server provides the following pentesting tools:

1. **`list-files`** - Enumerate files and directories
2. **`read-file`** - Read file contents (potential data exfiltration)
3. **`system-info`** - Gather system information including processes
4. **`execute-command`** - Execute arbitrary system commands
5. **`exfiltration-summary`** - Track all data accessed during session

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# Build and start the server
docker-compose up --build -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f pentest-mcp-server
```

### Option 2: Local Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Start the server
npm start

# Or run in development mode
npm run dev
```

## 🔧 Testing the Server

### Using the Test Client

```bash
# Run the JavaScript test client
node test-client/simple-test.js
```

### Manual Testing with MCP Client

Connect your MCP client to the server and try these commands:

```bash
# List available tools
tools/list

# Test file enumeration
tools/call --name="list-files" --arguments='{"path": "/", "recursive": true}'

# Attempt to read sensitive files
tools/call --name="read-file" --arguments='{"filePath": "/etc/passwd"}'

# Execute system commands
tools/call --name="execute-command" --arguments='{"command": "whoami"}'

# Get exfiltration summary
tools/call --name="exfiltration-summary"
```

## 🐳 Docker Deployment

### VPS Deployment

1. **Prepare the VPS:**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose-plugin -y
```

2. **Deploy the Server:**

```bash
# Clone the repository
git clone <your-repo-url>
cd test-mcp

# Use the deployment script
./scripts/deploy.sh production

# Or manually
docker-compose up --build -d
```

3. **Configure Networking:**

```bash
# Open necessary ports (be cautious!)
sudo ufw allow 8765/tcp  # MCP Server
sudo ufw allow 8090/tcp  # Web Interface
sudo ufw allow 6380/tcp  # Redis (if needed)
```

## 🔍 Security Testing Scenarios

### Test Client File System Access

```bash
# Test path traversal
tools/call --name="read-file" --arguments='{"filePath": "../../../etc/passwd"}'

# Test directory enumeration
tools/call --name="list-files" --arguments='{"path": "/", "recursive": true, "showHidden": true}'
```

### Test Command Execution Prevention

```bash
# Test basic commands
tools/call --name="execute-command" --arguments='{"command": "id"}'

# Test privilege escalation
tools/call --name="execute-command" --arguments='{"command": "sudo -l"}'

# Test network operations
tools/call --name="execute-command" --arguments='{"command": "netstat -tulpn"}'
```

### Monitor Data Exfiltration

```bash
# Check what data was accessed
tools/call --name="exfiltration-summary"

# View exfiltrated data resource
resources/read --uri="exfil://data"
```

## 📊 Web Interface

Access the web interface at `http://localhost:8080` for easier interaction:

- **Server Status**: Monitor server health and active sessions
- **Quick Tools**: Execute common pentesting tools
- **File Operations**: Read files and list directories
- **Command Execution**: Run system commands
- **Activity Log**: View real-time activity

## ⚠️ Security Warnings

### Legal Compliance

- **ONLY** use on systems you own or have explicit written authorization to test
- Comply with all applicable laws and regulations
- Document all testing activities
- Report vulnerabilities responsibly

### Operational Security

- Run in isolated environments when possible
- Monitor for suspicious activity
- Implement proper access controls
- Maintain detailed audit logs

## 🔧 Customization

### Adding New Tools

Edit `src/simple-server.ts` and add new tools to the `ListToolsRequestSchema` handler and implement corresponding handlers in the `CallToolRequestSchema` handler.

### Modifying Docker Configuration

Edit `docker-compose.yml` to:

- Change port mappings
- Add volume mounts
- Modify resource limits
- Configure networking

### Environment Variables

- `NODE_ENV`: Environment (development/production)
- `MCP_SERVER_NAME`: Server identifier
- `MCP_SERVER_VERSION`: Version string

## 🐛 Troubleshooting

### Server Won't Start

```bash
# Check logs
docker-compose logs pentest-mcp-server

# Rebuild from scratch
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Connection Issues

```bash
# Check if server is listening
netstat -tulpn | grep 3000

# Test connectivity
curl http://localhost:3000/health
```

### Permission Errors

```bash
# Check file permissions
ls -la data/ logs/

# Fix ownership
sudo chown -R $USER:$USER data/ logs/
```

## 📈 Monitoring and Logging

### Health Checks

- HTTP: `http://localhost:8765/health`
- Docker: `docker-compose ps`

### Log Locations

- Container logs: `docker-compose logs -f`
- Application logs: `./logs/` directory
- Audit logs: Stored in exfiltration data

### Metrics

- Active sessions count
- Tools execution frequency
- Data exfiltration volume
- Error rates

## 🔄 Updates and Maintenance

### Updating the Server

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up --build -d
```

### Backup and Recovery

```bash
# Backup data
tar -czf backup-$(date +%Y%m%d).tar.gz data/ logs/

# Restore data
tar -xzf backup-YYYYMMDD.tar.gz
```

## 📞 Support

For issues, questions, or contributions:

1. Check the documentation in `README.md`
2. Review security testing guidelines in `SECURITY-TESTING.md`
3. Open an issue in the repository
4. Contact the development team

## ✅ Deployment Checklist

- [ ] Server builds successfully (`npm run build`)
- [ ] Docker containers start without errors
- [ ] Health check endpoint responds
- [ ] Test client can connect and execute tools
- [ ] Web interface is accessible
- [ ] Logs are being generated
- [ ] Security warnings are understood
- [ ] Legal authorization obtained
- [ ] Monitoring is in place

---

**Remember**: This tool is designed for authorized security testing only. Use responsibly and ethically!
