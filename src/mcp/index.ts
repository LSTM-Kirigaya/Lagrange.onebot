import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { LagrangeContext } from "../core/context";
import type * as Lagrange from "../core/type";
import type { Memory } from "./memory";
import { atMessagePrompt, atQueryPrompt, EXECUTE_TASK_GUIDE } from "./prompt";
import { McpLanchOption } from "../core/dto";
import { McpTransport } from "./transport";
import { runTaskCode, type TaskSandbox } from "./executor";
import chalk from "chalk";
import ora from "ora";

export class LagrangeMcpManager {
    private mem: Memory | null = null;
    private _mcpOption: McpLanchOption = {};

    constructor(
        private readonly server: McpServer,
        private readonly context: LagrangeContext<Lagrange.Message>
    ) { }

    private async getMem(): Promise<Memory | null> {
        if (!this.mem) {
            console.log(
                `  ${chalk.yellow('⚠️')}  ${chalk.bold('Memory ')} ${chalk.yellow('检测到实例未就绪，正在触发自动初始化...')}`
            );
            await this.initMemory(this._mcpOption);
        }
        return this.mem;
    }

    public async initMemory(option: McpLanchOption = {}) {
        if (this.mem) return;

        const spinner = ora({
            text: chalk.cyan('Memory 正在加载模型组件 (下载/加载/预热)...'),
            color: 'magenta',
            spinner: 'bouncingBall',
        }).start();

        try {
            const { Memory: MemoryClass } = await import("./memory");

            this.mem = await MemoryClass.create({
                DB_DIR: ".data/memory",
                cacheDir: ".cache/transformers",
                warmupText: "你好",
                ...(option.proxy != null ? { proxy: option.proxy } : {}),
            });

            spinner.succeed(chalk.green(' 记忆系统成功启动'));

            // 打印一行精致的配置摘要
            console.log(
                `  ${chalk.magenta('🧠')} ${chalk.bold('Storage')}  ${chalk.gray('.data/memory')}`
            );
        } catch (err) {
            spinner.fail(chalk.red('Memory 初始化失败'));
            console.error(`  ${chalk.red('✘')} ${chalk.gray(err.message)}`);
            throw err;
        }
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
                description: EXECUTE_TASK_GUIDE,
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

        this.server.registerPrompt("at-message", {
            description: "当用户 @ 你时的 system prompt",
            argsSchema: {
                groupId: z.string().describe("群号"),
                userName: z.string().describe("提问用户的昵称"),
                atUserId: z.string().optional().describe("@机器人 的用户的 QQ 号"),
                atUserContent: z.string().optional().describe("@机器人 的用户发言内容"),
            },
        }, async ({ groupId, userName, atUserId, atUserContent }) => ({
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: await atMessagePrompt(context, parseInt(groupId), userName, atUserId, atUserContent),
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
