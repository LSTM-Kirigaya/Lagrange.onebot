import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { LagrangeContext } from "../core/context";
import type * as Lagrange from "../core/type";
import type { Memory } from "./memory";
import { atMessagePrompt, atQueryPrompt, executeTaskGuidePrompt } from "./prompt";
import { McpLanchOption } from "../core/dto";
import { McpTransport } from "./transport";
import { runTaskCode, type TaskSandbox } from "./executor";

/** 工具简短描述，完整说明见 prompt execute-task-guide */
const EXECUTE_TASK_DESCRIPTION =
    "执行 TS/JS 代码完成任务，可访问 context、memory、util。完整说明见 prompt execute-task-guide。";

export class LagrangeMcpManager {
    private mem: Memory | null = null;
    private _mcpOption: McpLanchOption = {};

    constructor(
        private readonly server: McpServer,
        private readonly context: LagrangeContext<Lagrange.Message>
    ) {}

    private async getMem(): Promise<Memory | null> {
        if (!this.mem) {
            console.warn(
                "[Memory] 警告：Memory 实例应当在启动 MCPServer 之前初始化，但实际上尚未初始化，正在自动初始化…"
            );
            await this.initMemory(this._mcpOption);
        }
        return this.mem;
    }

    public async initMemory(option: McpLanchOption = {}) {
        if (this.mem) return;
        console.log("[Memory] 模型初始化开始：下载/加载/预热…");
        const { Memory: MemoryClass } = await import("./memory");
        this.mem = await MemoryClass.create({
            DB_DIR: ".data/memory",
            cacheDir: ".cache/transformers",
            warmupText: "你好",
            ...(option.proxy != null ? { proxy: option.proxy } : {}),
        });
        console.log("[Memory] 模型初始化完成。");
    }

    /**
     * 只注册一个工具：execute_task。AI 根据用户意图生成 TS/JS 代码，在此执行并拿到结果。
     */
    public registerExecuteTask(option: McpLanchOption) {
        const context = this.context;
        const enableMemory = option.enableMemory !== false;
        const enableWebsearch = option.enableWebsearch === true;

        this.server.registerTool(
            "execute_task",
            {
                description: EXECUTE_TASK_DESCRIPTION,
                inputSchema: {
                    code: z
                        .string()
                        .min(1, "代码不能为空")
                        .describe(
                            "要执行的 TypeScript 或 JavaScript 代码。应为 async 函数体或同步代码，可 return 结果。"
                        ),
                },
            },
            async ({ code }) => {
                const memory = enableMemory ? await this.getMem() : null;
                const sandbox: TaskSandbox = {
                    context,
                    memory: memory ?? undefined,
                    websearch: enableWebsearch,
                };
                const resultText = await runTaskCode(code, sandbox);
                return { content: [{ type: "text", text: resultText }] };
            }
        );
    }

    /**
     * 注册 prompt（不占工具 token）
     */
    public registerPrompts() {
        const context = this.context;

        this.server.registerPrompt(
            "execute-task-guide",
            {
                description: "execute_task 工具的完整使用说明（context、memory、util 等）",
                argsSchema: {},
            },
            async () => ({
                messages: [
                    {
                        role: "user",
                        content: {
                            type: "text",
                            text: executeTaskGuidePrompt(),
                        },
                    },
                ],
            })
        );

        this.server.registerPrompt("at-message", {
            description: "当用户 @ 你时的 system prompt",
            argsSchema: {
                groupId: z.string().describe("群号"),
            },
        }, async ({ groupId }) => ({
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: await atMessagePrompt(context, parseInt(groupId)),
                    },
                },
            ],
        }));

        this.server.registerPrompt("at-query", {
            description: "当用户 @ 你时的 query prompt",
            argsSchema: {
                content: z.string().describe("查询内容"),
                reference: z.string().optional().describe("参考内容"),
            },
        }, async ({ content, reference = "无" }) => ({
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: await atQueryPrompt(content, reference),
                    },
                },
            ],
        }));
    }

    public async register(option: McpLanchOption) {
        this._mcpOption = option;
        const { enableMemory = true } = option;

        if (enableMemory) {
            await this.initMemory(option);
        }

        this.registerExecuteTask(option);
        this.registerPrompts();
    }
}

export async function createMcpServer(
    context: LagrangeContext<Lagrange.Message>,
    option: McpLanchOption = {}
) {
    const mcpServer = new McpServer({
        name: "L.Bot MCP",
        version: "1.0.10",
    });

    const mcpContainer = new LagrangeMcpManager(mcpServer, context);
    await mcpContainer.register(option);

    const { host = "localhost", port = 3010 } = option;

    const transport = new McpTransport(mcpServer, host, port);
    transport.start();

    return transport;
}
