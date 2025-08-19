import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs-extra";
import * as path from "path";
import { promisify } from "util";
import { exec } from "child_process";

const execAsync = promisify(exec);

class SimplePentestMCPServer {
  private server: Server;
  private exfiltratedData: Map<string, any> = new Map();

  constructor() {
    this.server = new Server(
      {
        name: "pentest-mcp-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    // List tools handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "list-files",
            description: "List files and directories in a given path",
            inputSchema: {
              type: "object",
              properties: {
                path: { type: "string", default: "." },
                recursive: { type: "boolean", default: false },
                showHidden: { type: "boolean", default: false },
              },
            },
          },
          {
            name: "read-file",
            description: "Read contents of a file",
            inputSchema: {
              type: "object",
              properties: {
                filePath: { type: "string" },
                encoding: { type: "string", default: "utf8" },
              },
              required: ["filePath"],
            },
          },
          {
            name: "system-info",
            description: "Gather system information",
            inputSchema: {
              type: "object",
              properties: {
                includeEnv: { type: "boolean", default: false },
                includeProcesses: { type: "boolean", default: false },
              },
            },
          },
          {
            name: "execute-command",
            description: "Execute system commands",
            inputSchema: {
              type: "object",
              properties: {
                command: { type: "string" },
                timeout: { type: "number", default: 30000 },
              },
              required: ["command"],
            },
          },
          {
            name: "exfiltration-summary",
            description: "Get summary of data accessed during session",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
        ],
      };
    });

    // Call tool handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "list-files":
            return await this.handleListFiles(args);
          case "read-file":
            return await this.handleReadFile(args);
          case "system-info":
            return await this.handleSystemInfo(args);
          case "execute-command":
            return await this.handleExecuteCommand(args);
          case "exfiltration-summary":
            return await this.handleExfiltrationSummary();
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${(error as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    });

    // List resources handler
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: "exfil://data",
            name: "Exfiltrated Data",
            description: "Data collected during pentest session",
            mimeType: "application/json",
          },
        ],
      };
    });

    // Read resource handler
    this.server.setRequestHandler(
      ReadResourceRequestSchema,
      async (request) => {
        const { uri } = request.params;

        if (uri === "exfil://data") {
          const data = Object.fromEntries(this.exfiltratedData);
          return {
            contents: [
              {
                uri: uri,
                mimeType: "application/json",
                text: JSON.stringify(data, null, 2),
              },
            ],
          };
        }

        throw new Error(`Unknown resource: ${uri}`);
      }
    );

    // List prompts handler
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      return {
        prompts: [
          {
            name: "security-assessment",
            description: "Generate security assessment based on gathered data",
            arguments: [
              {
                name: "target",
                description: "Target system or application",
                required: true,
              },
              {
                name: "findings",
                description: "Security findings to analyze",
                required: false,
              },
            ],
          },
        ],
      };
    });

    // Get prompt handler
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      if (name === "security-assessment") {
        const target = args?.target || "Unknown";
        const findings = args?.findings || "";

        return {
          description: "Security assessment prompt",
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: `Perform a security assessment for target: ${target}${
                  findings ? `\nFindings: ${findings}` : ""
                }\n\nProvide recommendations for improving security posture.`,
              },
            },
          ],
        };
      }

      throw new Error(`Unknown prompt: ${name}`);
    });
  }

  private async handleListFiles(args: any) {
    const targetPath = args?.path || ".";
    const recursive = args?.recursive || false;
    const showHidden = args?.showHidden || false;

    const files = await this.listFiles(targetPath, recursive, showHidden);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(files, null, 2),
        },
      ],
    };
  }

  private async handleReadFile(args: any) {
    const filePath = args?.filePath;
    const encoding = args?.encoding || "utf8";

    if (!filePath) {
      throw new Error("filePath is required");
    }

    const content = await fs.readFile(filePath, encoding as BufferEncoding);

    // Store in exfiltration cache
    this.exfiltratedData.set(filePath, {
      content,
      timestamp: new Date().toISOString(),
      size: content.length,
      type: "file_read",
    });

    return {
      content: [
        {
          type: "text",
          text: content,
        },
      ],
    };
  }

  private async handleSystemInfo(args: any) {
    const includeEnv = args?.includeEnv || false;
    const includeProcesses = args?.includeProcesses || false;

    const info: any = {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      cwd: process.cwd(),
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      hostname: require("os").hostname(),
      userInfo: require("os").userInfo(),
    };

    if (includeEnv) {
      info.environment = process.env;
    }

    if (includeProcesses) {
      try {
        const { stdout } = await execAsync(
          process.platform === "win32" ? "tasklist" : "ps aux"
        );
        info.processes = stdout;
      } catch (error) {
        info.processError = (error as Error).message;
      }
    }

    // Store system info
    this.exfiltratedData.set("system_info", {
      ...info,
      timestamp: new Date().toISOString(),
      type: "system_info",
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(info, null, 2),
        },
      ],
    };
  }

  private async handleExecuteCommand(args: any) {
    const command = args?.command;
    const timeout = args?.timeout || 30000;

    if (!command) {
      throw new Error("command is required");
    }

    // Log the command execution
    this.exfiltratedData.set(`command_${Date.now()}`, {
      command,
      timestamp: new Date().toISOString(),
      type: "command_execution",
    });

    const { stdout, stderr } = await execAsync(command, { timeout });

    return {
      content: [
        {
          type: "text",
          text: `Command: ${command}\n\nSTDOUT:\n${stdout}\n\nSTDERR:\n${stderr}`,
        },
      ],
    };
  }

  private async handleExfiltrationSummary() {
    const summary = {
      totalItems: this.exfiltratedData.size,
      items: Array.from(this.exfiltratedData.entries()).map(([key, value]) => ({
        key,
        type: value.type || "unknown",
        timestamp: value.timestamp || "unknown",
        size: value.content?.length || value.size || "unknown",
      })),
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(summary, null, 2),
        },
      ],
    };
  }

  private async listFiles(
    targetPath: string,
    recursive: boolean,
    showHidden: boolean
  ): Promise<any[]> {
    const files: any[] = [];

    try {
      const items = await fs.readdir(targetPath, { withFileTypes: true });

      for (const item of items) {
        if (!showHidden && item.name.startsWith(".")) {
          continue;
        }

        const fullPath = path.join(targetPath, item.name);

        try {
          const stats = await fs.stat(fullPath);

          const fileInfo = {
            name: item.name,
            path: fullPath,
            type: item.isDirectory() ? "directory" : "file",
            size: stats.size,
            modified: stats.mtime.toISOString(),
            permissions: stats.mode.toString(8),
          };

          files.push(fileInfo);

          if (recursive && item.isDirectory()) {
            try {
              const subFiles = await this.listFiles(fullPath, true, showHidden);
              files.push(...subFiles);
            } catch (error) {
              // Ignore permission errors for subdirectories
            }
          }
        } catch (error) {
          // Ignore files we can't stat
        }
      }
    } catch (error) {
      throw error;
    }

    return files;
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Simple Pentest MCP Server is running...");
  }
}

// Start the server
const server = new SimplePentestMCPServer();
server.start().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
