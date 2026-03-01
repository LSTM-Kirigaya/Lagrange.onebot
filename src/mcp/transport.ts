import { randomUUID } from "node:crypto";

import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js"
import express, { Request, Response } from 'express';
import chalk from "chalk";
import { Server } from "node:http";
import { getLocalIP } from "../util/network";
import { getGrad } from "../util/banner";


export class McpTransport {
    private app = express();
    private transports: Record<string, StreamableHTTPServerTransport> = {};
    private expressServer?: Server;

    constructor(
        private readonly server: McpServer,
        private readonly hostname: string = "localhost",
        private readonly port: number = 3010
    ) {
        this.app.use(express.json());
        this.setupRoutes();
    }

    private setupRoutes() {
        // POST: client → server
        this.app.post("/mcp", async (req, res) => {
            try {
                const transport = new StreamableHTTPServerTransport({
                    sessionIdGenerator: undefined,
                    enableJsonResponse: true
                });

                res.on('close', () => {
                    transport.close();
                });

                await this.server.connect(transport);
                await transport.handleRequest(req, res, req.body);
            } catch (error) {
                console.error('Error handling MCP request:', error);
                if (!res.headersSent) {
                    res.status(500).json({
                        jsonrpc: '2.0',
                        error: {
                            code: -32603,
                            message: 'Internal server error'
                        },
                        id: null
                    });
                }
            }
        });

        // GET/DELETE: server → client
        const handleSessionRequest = async (req: Request, res: Response) => {
            const sessionId = req.headers["mcp-session-id"] as string | undefined;
            if (!sessionId || !this.transports[sessionId]) {
                res.status(400).send("Invalid or missing session ID");
                return;
            }
            const transport = this.transports[sessionId];
            await transport.handleRequest(req, res);
        };

        this.app.get("/mcp", handleSessionRequest);
        this.app.get('/', (req, res) => {
            res.send('Hello World!');
        })
        this.app.delete("/mcp", handleSessionRequest);
    }
    public start() {
        this.expressServer = this.app.listen(this.port, this.hostname, () => {
            const grad = getGrad(); // 复用渐变
            const localIP = getLocalIP();
            const url = `http://${this.hostname}:${this.port}/mcp`;

            // 1. 打印标题：使用渐变色装饰器
            console.log(`\n  ${grad('🚀')} ${chalk.bold.cyan('MCP HTTP Server')} ${chalk.green('ready')}\n`);

            // 2. 打印访问入口
            console.log(`  ${chalk.bold('➜')}  ${chalk.bold('Local:  ')}   ${chalk.cyan(url)}`);

            // 3. 处理局域网 IP 展示逻辑
            if (localIP) {
                const isListeningAll = this.hostname === "0.0.0.0" || this.hostname === "::";
                const networkUrl = `http://${localIP}:${this.port}/mcp`;

                console.log(
                    `  ${chalk.bold('➜')}  ${chalk.bold('Network: ')} ${isListeningAll
                        ? chalk.cyan(networkUrl)
                        : chalk.gray('use --host to expose')
                    }`
                );
            }

            // 4. 打印一个底部收尾，让布局更稳重
            console.log(`\n  ${chalk.gray('press ')}${chalk.bold.white('Ctrl+C')}${chalk.gray(' to stop')}\n`);
        });
    }
    public close() {
        this.expressServer?.close();
        this.server.close();
    }
}