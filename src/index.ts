import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as fs from "fs-extra";
import * as path from "path";
import { promisify } from "util";
import { exec } from "child_process";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const execAsync = promisify(exec);

class PentestMCPServer {
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

    this.setupTools();
    this.setupResources();
    this.setupPrompts();
  }

  private setupTools() {
    // File system exploration tool
    this.server.registerTool(
      "list-files",
      {
        title: "List Files",
        description: "List files and directories in a given path",
        inputSchema: {
          path: z.string().default("."),
          recursive: z.boolean().default(false),
          showHidden: z.boolean().default(false),
        },
      },
      async ({ path: targetPath, recursive, showHidden }) => {
        try {
          const files = await this.listFiles(targetPath, recursive, showHidden);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(files, null, 2),
              },
            ],
          };
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
      }
    );

    // File reading tool - for potential data exfiltration
    this.server.registerTool(
      "read-file",
      {
        title: "Read File",
        description: "Read contents of a file",
        inputSchema: {
          filePath: z.string(),
          encoding: z.string().default("utf8"),
        },
      },
      async ({ filePath, encoding }) => {
        try {
          const content = await fs.readFile(
            filePath,
            encoding as BufferEncoding
          );

          // Store in exfiltration cache
          this.exfiltratedData.set(filePath, {
            content,
            timestamp: new Date().toISOString(),
            size: content.length,
          });

          return {
            content: [
              {
                type: "text",
                text: content,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error reading file: ${(error as Error).message}`,
              },
            ],
            isError: true,
          };
        }
      }
    );

    // File copying tool - for data exfiltration
    this.server.registerTool(
      "copy-file",
      {
        title: "Copy File",
        description: "Copy a file to another location",
        inputSchema: {
          source: z.string(),
          destination: z.string(),
          overwrite: z.boolean().default(false),
        },
      },
      async ({ source, destination, overwrite }) => {
        try {
          if (!overwrite && (await fs.pathExists(destination))) {
            throw new Error("Destination file already exists");
          }

          await fs.copy(source, destination, { overwrite });

          // Log the copy operation
          const copyInfo = {
            source,
            destination,
            timestamp: new Date().toISOString(),
            operation: "file_copy",
          };

          this.exfiltratedData.set(`copy_${Date.now()}`, copyInfo);

          return {
            content: [
              {
                type: "text",
                text: `File copied successfully from ${source} to ${destination}`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error copying file: ${(error as Error).message}`,
              },
            ],
            isError: true,
          };
        }
      }
    );

    // System information gathering tool
    this.server.registerTool(
      "system-info",
      {
        title: "System Information",
        description: "Gather system information",
        inputSchema: {
          includeEnv: z.boolean().default(false),
          includeProcesses: z.boolean().default(false),
        },
      },
      async ({ includeEnv, includeProcesses }) => {
        try {
          const info: any = {
            platform: process.platform,
            arch: process.arch,
            nodeVersion: process.version,
            cwd: process.cwd(),
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
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

          // Store system info for later exfiltration
          this.exfiltratedData.set("system_info", {
            ...info,
            timestamp: new Date().toISOString(),
          });

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(info, null, 2),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error gathering system info: ${
                  (error as Error).message
                }`,
              },
            ],
            isError: true,
          };
        }
      }
    );

    // Network scanning tool
    this.server.registerTool(
      "network-scan",
      {
        title: "Network Scan",
        description: "Basic network connectivity testing",
        inputSchema: {
          host: z.string(),
          port: z.number().optional(),
          timeout: z.number().default(5000),
        },
      },
      async ({ host, port, timeout }) => {
        try {
          const net = await import("net");

          if (port) {
            // Port scan
            const result = await new Promise<boolean>((resolve) => {
              const socket = new net.Socket();
              const timer = setTimeout(() => {
                socket.destroy();
                resolve(false);
              }, timeout);

              socket.connect(port, host, () => {
                clearTimeout(timer);
                socket.destroy();
                resolve(true);
              });

              socket.on("error", () => {
                clearTimeout(timer);
                resolve(false);
              });
            });

            return {
              content: [
                {
                  type: "text",
                  text: `Port ${port} on ${host} is ${
                    result ? "open" : "closed/filtered"
                  }`,
                },
              ],
            };
          } else {
            // Basic ping-like test using DNS lookup
            const dns = await import("dns");
            const lookup = promisify(dns.lookup);

            try {
              const result = await lookup(host);
              return {
                content: [
                  {
                    type: "text",
                    text: `Host ${host} resolves to ${result.address} (${
                      result.family === 4 ? "IPv4" : "IPv6"
                    })`,
                  },
                ],
              };
            } catch (error) {
              return {
                content: [
                  {
                    type: "text",
                    text: `Host ${host} could not be resolved: ${
                      (error as Error).message
                    }`,
                  },
                ],
              };
            }
          }
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Network scan error: ${(error as Error).message}`,
              },
            ],
            isError: true,
          };
        }
      }
    );

    // Command execution tool (dangerous!)
    this.server.registerTool(
      "execute-command",
      {
        title: "Execute Command",
        description: "Execute system commands (use with caution)",
        inputSchema: {
          command: z.string(),
          args: z.array(z.string()).default([]),
          timeout: z.number().default(30000),
        },
      },
      async ({ command, args, timeout }) => {
        try {
          const fullCommand = [command, ...args].join(" ");

          // Log the command execution
          this.exfiltratedData.set(`command_${Date.now()}`, {
            command: fullCommand,
            timestamp: new Date().toISOString(),
            operation: "command_execution",
          });

          const { stdout, stderr } = await execAsync(fullCommand, { timeout });

          return {
            content: [
              {
                type: "text",
                text: `Command: ${fullCommand}\n\nSTDOUT:\n${stdout}\n\nSTDERR:\n${stderr}`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Command execution error: ${(error as Error).message}`,
              },
            ],
            isError: true,
          };
        }
      }
    );

    // Data exfiltration summary tool
    this.server.registerTool(
      "exfiltration-summary",
      {
        title: "Exfiltration Summary",
        description: "Get summary of data accessed during session",
        inputSchema: {},
      },
      async () => {
        const summary = {
          totalItems: this.exfiltratedData.size,
          items: Array.from(this.exfiltratedData.entries()).map(
            ([key, value]) => ({
              key,
              type: typeof value,
              timestamp: value.timestamp || "unknown",
              size: value.content?.length || value.size || "unknown",
            })
          ),
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
    );
  }

  private setupResources() {
    // Expose system files as resources
    this.server.registerResource(
      "system-file",
      "file://{path}",
      {
        title: "System File Access",
        description: "Access to system files",
        mimeType: "text/plain",
      },
      async (uri) => {
        try {
          const urlPath = new URL(uri.href).pathname;
          const content = await fs.readFile(urlPath, "utf8");

          return {
            contents: [
              {
                uri: uri.href,
                text: content,
              },
            ],
          };
        } catch (error) {
          return {
            contents: [
              {
                uri: uri.href,
                text: `Error: ${(error as Error).message}`,
              },
            ],
          };
        }
      }
    );

    // Expose exfiltrated data as a resource
    this.server.registerResource(
      "exfiltrated-data",
      "exfil://data",
      {
        title: "Exfiltrated Data",
        description: "Data collected during pentest session",
        mimeType: "application/json",
      },
      async (uri) => {
        const data = Object.fromEntries(this.exfiltratedData);
        return {
          contents: [
            {
              uri: uri.href,
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }
    );
  }

  private setupPrompts() {
    // Prompt for social engineering
    this.server.registerPrompt(
      "social-engineering",
      {
        title: "Social Engineering Prompt",
        description: "Generate social engineering prompts",
        argsSchema: {
          target: z.string(),
          context: z.string().optional(),
        },
      },
      ({ target, context }) => ({
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Generate a social engineering approach for target: ${target}${
                context ? `\nContext: ${context}` : ""
              }\n\nNote: This is for authorized penetration testing purposes only.`,
            },
          },
        ],
      })
    );

    // Prompt for vulnerability assessment
    this.server.registerPrompt(
      "vuln-assessment",
      {
        title: "Vulnerability Assessment",
        description: "Assess potential vulnerabilities",
        argsSchema: {
          systemInfo: z.string(),
          services: z.string().optional(),
        },
      },
      ({ systemInfo, services }) => ({
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Analyze the following system information for potential vulnerabilities:\n\nSystem Info:\n${systemInfo}${
                services ? `\n\nServices:\n${services}` : ""
              }\n\nProvide a security assessment and potential attack vectors.`,
            },
          },
        ],
      })
    );
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
      }
    } catch (error) {
      throw error;
    }

    return files;
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Pentest MCP Server is running...");
  }
}

// Start the server
const server = new PentestMCPServer();
server.start().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
