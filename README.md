# Pentest MCP Server

A dockerized Model Context Protocol (MCP) server designed for penetration testing and security research. This server implements various tools and capabilities that can be used to test MCP client security and demonstrate potential attack vectors.

⚠️ **WARNING**: This tool is designed for authorized penetration testing and security research only. Use responsibly and only on systems you own or have explicit permission to test.

## Features

### Tools Available

1. **File System Operations**

   - `list-files`: Enumerate files and directories
   - `read-file`: Read file contents (potential data exfiltration)
   - `copy-file`: Copy files to different locations

2. **System Information Gathering**

   - `system-info`: Collect system details, environment variables, running processes
   - `network-scan`: Basic network connectivity and port scanning

3. **Command Execution**

   - `execute-command`: Execute arbitrary system commands (high risk)

4. **Data Tracking**
   - `exfiltration-summary`: Track all data accessed during the session

### Resources

- `system-file`: Access system files via URI
- `exfiltrated-data`: View all collected data

### Prompts

- `social-engineering`: Generate social engineering scenarios
- `vuln-assessment`: Analyze system information for vulnerabilities

## Quick Start

### Using Docker Compose (Recommended)

1. Clone or download this repository
2. Build and start the server:

```bash
docker compose up --build -d
```

3. The server will be available on:
   - STDIO transport: Connect directly to the container
   - HTTP transport: Port 8765 (mapped from internal port 3000)

### Using Docker

```bash
# Build the image
docker build -t pentest-mcp-server .

# Run the container
docker run -it --rm \
  -v $(pwd)/data:/app/data \
  -p 8765:3000 \
  pentest-mcp-server
```

### Local Development

```bash
# Install dependencies
npm install

# Build the TypeScript code
npm run build

# Run the server
npm start

# Or run in development mode
npm run dev
```

## Deployment on VPS

### Prerequisites

- Docker and Docker Compose installed
- Appropriate firewall rules configured
- SSL/TLS certificates (for production use)

### Deployment Steps

1. **Prepare the VPS**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose-plugin -y
```

2. **Deploy the Server**

```bash
# Clone the repository
git clone <your-repo-url>
cd test-mcp

# Create data directories
mkdir -p data logs

# Start the services
docker compose up -d

# Check status
docker compose ps
```

3. **Configure Networking**

```bash
# Open necessary ports (be cautious!)
sudo ufw allow 8765/tcp  # MCP Server
sudo ufw allow 8090/tcp  # Web Interface
sudo ufw allow 6380/tcp  # Redis (if needed)
```

## Testing MCP Client Security

### Common Attack Vectors to Test

1. **File System Access**

   - Test if the client properly sandboxes file operations
   - Attempt to read sensitive files (`/etc/passwd`, configuration files)
   - Try path traversal attacks (`../../../etc/passwd`)

2. **Command Execution**

   - Test if the client allows arbitrary command execution
   - Attempt privilege escalation
   - Try to install backdoors or persistence mechanisms

3. **Data Exfiltration**

   - Monitor what data the server can access
   - Test if the client logs or prevents data copying
   - Attempt to exfiltrate sensitive information

4. **Network Operations**
   - Test network scanning capabilities
   - Attempt to pivot to internal networks
   - Try to establish reverse shells

### Example Test Session

```bash
# Connect to the MCP server using your client
# Then try these operations:

# 1. Enumerate the file system
list-files --path="/" --recursive=true --showHidden=true

# 2. Read sensitive files
read-file --filePath="/etc/passwd"
read-file --filePath="/home/user/.ssh/id_rsa"

# 3. Gather system information
system-info --includeEnv=true --includeProcesses=true

# 4. Execute commands
execute-command --command="whoami"
execute-command --command="id"
execute-command --command="ps aux"

# 5. Network scanning
network-scan --host="127.0.0.1" --port=22
network-scan --host="internal.company.com"

# 6. Check what data was collected
exfiltration-summary
```

## Configuration

### Environment Variables

- `NODE_ENV`: Set to `production` for production deployment
- `MCP_SERVER_NAME`: Server name identifier
- `MCP_SERVER_VERSION`: Server version
- `TZ`: Timezone setting

### Volume Mounts

- `./data:/app/data`: Persistent data storage
- `./logs:/app/logs`: Log files
- `/tmp:/tmp`: Access to host temp directory

### Security Considerations

This server is intentionally designed with minimal security restrictions for testing purposes. In a production environment, you should:

1. Run with minimal privileges
2. Implement proper input validation
3. Sandbox file system access
4. Limit network capabilities
5. Implement audit logging
6. Use secure communication channels

## Monitoring and Logging

### View Logs

```bash
# View server logs
docker compose logs -f pentest-mcp-server

# View all service logs
docker compose logs -f
```

### Health Checks

The server includes health check endpoints. Monitor with:

```bash
# Check container health
docker compose ps

# Manual health check
docker exec pentest-mcp-server node -e "console.log('Health check')"
```

## Legal and Ethical Considerations

🚨 **IMPORTANT LEGAL NOTICE**:

- This tool is for authorized security testing only
- Obtain proper written authorization before testing
- Comply with all applicable laws and regulations
- Use only on systems you own or have explicit permission to test
- Document all testing activities
- Report vulnerabilities responsibly

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

The authors and contributors of this project are not responsible for any misuse of this tool. Users are solely responsible for ensuring they have proper authorization and comply with all applicable laws and regulations when using this software.

## Support

For issues, questions, or contributions, please open an issue in the repository or contact the development team.

---

**Remember**: With great power comes great responsibility. Use this tool ethically and legally.
