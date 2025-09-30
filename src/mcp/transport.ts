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
            const sessionId = req.headers["mcp-session-id"] as string | 'default-session-id';
            let transport: StreamableHTTPServerTransport;

            if (sessionId && this.transports[sessionId]) {
                // 复用已有会话
                transport = this.transports[sessionId];
            } else if (isInitializeRequest(req.body)) {
                // 新建会话
                transport = new StreamableHTTPServerTransport({
                    sessionIdGenerator: () => randomUUID(),
                    onsessioninitialized: (sid) => {
                        this.transports[sid] = transport;
                    },
                });

                // 清理逻辑
                transport.onclose = () => {
                    if (transport.sessionId) {
                        delete this.transports[transport.sessionId];
                    }
                };

                const server = this.server;
                await server.connect(transport);
            } else {
                res.status(400).json({
                    jsonrpc: "2.0",
                    error: {
                        code: -32000,
                        message: "Bad Request: No valid session ID provided",
                    },
                    id: null,
                });
                return;
            }

            // 处理请求
            await transport.handleRequest(req, res, req.body);
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
            const url = `http://${this.hostname}:${this.port}/mcp`;

            // 获取当前的局域网 IP 地址
            const localIP = getLocalIP();


            console.log(
                "🚀 MCP HTTP Server" +
                " running at"
            );

            console.log(
                "  🌐 Local   ➜  " +
                chalk.gray(url)
            );
            
            // 如果获取到了局域网IP，则也显示局域网访问地址
            if (localIP) {
                const networkUrl = `http://${localIP}:${this.port}/mcp`;
                console.log(
                    "  🌐 Network ➜  " +
                    chalk.gray(this.hostname === "0.0.0.0" ? networkUrl : 'Not available')
                );
            }

        });
    }

    public close() {
        this.expressServer?.close();
        this.server.close();
    }
}