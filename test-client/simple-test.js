#!/usr/bin/env node

/**
 * Simple MCP Client Test Script
 * This demonstrates how to connect to the pentest MCP server and test various tools
 */

const http = require("http");
const https = require("https");

class SimpleMCPClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.sessionId = null;
    this.requestId = 1;
  }

  async makeRequest(method, params = {}) {
    const request = {
      jsonrpc: "2.0",
      id: this.requestId++,
      method: method,
      params: params,
    };

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.sessionId && { "mcp-session-id": this.sessionId }),
      },
    };

    const url = new URL("/mcp", this.baseUrl);

    return new Promise((resolve, reject) => {
      const client = url.protocol === "https:" ? https : http;

      const req = client.request(url, options, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            // Capture session ID from response headers
            if (res.headers["mcp-session-id"]) {
              this.sessionId = res.headers["mcp-session-id"];
            }

            const response = JSON.parse(data);
            resolve(response);
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on("error", (error) => {
        reject(error);
      });

      req.write(JSON.stringify(request));
      req.end();
    });
  }

  async initialize() {
    console.log("🔗 Initializing MCP connection...");

    const response = await this.makeRequest("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {
        roots: {
          listChanged: true,
        },
        sampling: {},
      },
      clientInfo: {
        name: "simple-test-client",
        version: "1.0.0",
      },
    });

    if (response.error) {
      throw new Error(`Initialization failed: ${response.error.message}`);
    }

    console.log("✅ MCP connection initialized");
    console.log(
      "📋 Server capabilities:",
      JSON.stringify(response.result.capabilities, null, 2)
    );

    return response.result;
  }

  async listTools() {
    console.log("\n🔧 Listing available tools...");

    const response = await this.makeRequest("tools/list");

    if (response.error) {
      throw new Error(`Failed to list tools: ${response.error.message}`);
    }

    console.log("✅ Available tools:");
    response.result.tools.forEach((tool) => {
      console.log(`  • ${tool.name}: ${tool.description}`);
    });

    return response.result.tools;
  }

  async callTool(name, arguments = {}) {
    console.log(`\n🛠️  Calling tool: ${name}`);
    console.log("📝 Arguments:", JSON.stringify(arguments, null, 2));

    const response = await this.makeRequest("tools/call", {
      name: name,
      arguments: arguments,
    });

    if (response.error) {
      console.error(`❌ Tool call failed: ${response.error.message}`);
      return null;
    }

    console.log("✅ Tool response:");
    response.result.content.forEach((content) => {
      if (content.type === "text") {
        console.log(content.text);
      }
    });

    return response.result;
  }

  async listResources() {
    console.log("\n📚 Listing available resources...");

    const response = await this.makeRequest("resources/list");

    if (response.error) {
      throw new Error(`Failed to list resources: ${response.error.message}`);
    }

    console.log("✅ Available resources:");
    response.result.resources.forEach((resource) => {
      console.log(`  • ${resource.uri}: ${resource.description}`);
    });

    return response.result.resources;
  }
}

async function runPentestDemo() {
  console.log("🚀 Starting Pentest MCP Client Demo");
  console.log("=====================================");

  const client = new SimpleMCPClient("http://localhost:8765");

  try {
    // Initialize connection
    await client.initialize();

    // List available tools
    await client.listTools();

    // List available resources
    await client.listResources();

    // Demonstrate various pentest tools
    console.log("\n🎯 Running Pentest Demonstrations");
    console.log("==================================");

    // 1. System information gathering
    await client.callTool("system-info", {
      includeEnv: false,
      includeProcesses: true,
      includeNetwork: true,
    });

    // 2. File system exploration
    await client.callTool("list-files", {
      path: ".",
      recursive: false,
      showHidden: true,
    });

    // 3. Try to read a sensitive file (this should be controlled by the client)
    await client.callTool("read-file", {
      filePath: "/etc/passwd",
      maxSize: 1024,
    });

    // 4. Execute a command
    await client.callTool("execute-command", {
      command: "whoami",
    });

    // 5. Get exfiltration summary
    await client.callTool("exfiltration-summary");

    console.log("\n🎉 Demo completed successfully!");
    console.log("\n📊 Check the server logs and exfiltration endpoint:");
    console.log("   • Health: http://localhost:8765/health");
    console.log("   • Exfil Data: http://localhost:8765/exfil");
  } catch (error) {
    console.error("❌ Demo failed:", error.message);
    process.exit(1);
  }
}

// Run the demo if this script is executed directly
if (require.main === module) {
  runPentestDemo();
}

module.exports = { SimpleMCPClient };
