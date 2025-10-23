
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { LagrangeContext } from "../core/context";
import type * as Lagrange from '../core/type';
import { Default } from './type';
import * as Tool from './tool';
import * as ExtraTool from './extraTool';
import { Memory } from "./memory";

import { atMessagePrompt, atQueryPrompt } from "./prompt";
import { McpLanchOption } from "../core/dto";
import { McpTransport } from "./transport";

export class LagrangeMcpManager {
    private mem: Memory | null = null; 
    constructor(
        private readonly server: McpServer,
        private readonly context: LagrangeContext<Lagrange.Message>,
    ) {
    }
    private async getMem(): Promise<Memory> {
        if (!this.mem) {
            console.warn("[Memory] 警告：Memory 实例应当在启动MCPServer之前初始化，但实际上尚未初始化，正在自动初始化...");
            await this.initMemory();
        }
        return this.mem as Memory;
    }
    public async initMemory() {
        if (this.mem) return;
        console.log("[Memory] 模型初始化开始：下载/加载/预热…");
        this.mem = await Memory.create({
            DB_DIR: ".data/memory",
            cacheDir: ".cache/transformers",
            warmupText: "你好",
        });
        console.log("[Memory] 模型初始化完成。");
    }


    public registerBasic() {
        const context = this.context;

        // 发送群消息
        this.server.registerTool(
            'qq_send_message',
            {
                description: '发送群消息',
                inputSchema: {
                    groupId: z.number().describe('群号'),
                    message: z.array(Default).describe('要发送的内容')
                },
            },
            async ({ groupId, message }) => {
                const responseText = await Tool.sendGroupMsg(context, groupId, message as Lagrange.Send.Default[]);
                return {
                    content: [{ type: 'text', text: responseText }]
                }
            });

        // 发送图片
        this.server.registerTool(
            'qq_send_image',
            {
                description: '发送图片',
                inputSchema: {
                    groupId: z.number().describe('群号'),
                    url: z.string().describe('图片的 url'),
                },
            },
            async ({ groupId, url }) => {
                const cqMessages = [{
                    type: 'image',
                    data: {
                        file: url
                    }
                }] as Lagrange.Send.Default[];

                const responseText = await Tool.sendGroupMsg(context, groupId, cqMessages);
                return { content: [{ type: 'text', text: responseText }] }
            }
        )

        // 获取群信息
        this.server.registerTool(
            'qq_get_group_info',
            {
                description: '获取群信息',
                inputSchema: {
                    groupId: z.number().describe('群号')
                }
            },
            async ({ groupId }) => {
                const responseText = await Tool.getGroupInfo(context, groupId);
                return { content: [{ type: 'text', text: responseText }] };
            }
        );

        // 获取群成员列表
        this.server.registerTool(
            'qq_get_group_member_list',
            {
                description: '获取群成员列表',
                inputSchema: {
                    groupId: z.number().describe('群号'),
                },
            },
            async ({ groupId }) => {
                const responseText = await Tool.getGroupMemberList(context, groupId);
                return { content: [{ type: 'text', text: responseText }] };
            }
        );

        // 获取群成员信息
        this.server.registerTool(
            'qq_get_group_member_info',
            {
                description: '获取群成员信息',
                inputSchema: {
                    groupId: z.number().describe('群号'),
                    user_id: z.number().describe('用户 QQ 号'),
                },
            },
            async ({ groupId, user_id }) => {
                const responseText = await Tool.getGroupMemberInfo(context, groupId, user_id);
                return { content: [{ type: 'text', text: responseText }] };
            }
        );

        // 上传群文件
        this.server.registerTool(
            'qq_upload_group_file',
            {
                description: '上传群文件',
                inputSchema: {
                    groupId: z.number().describe('群号'),
                    file: z.string().describe('文件绝对路径'),
                    name: z.string().describe('文件名称'),
                },
            },
            async ({ groupId, file, name }) => {
                const responseText = await Tool.uploadGroupFile(context, groupId, file, name);
                return { content: [{ type: 'text', text: responseText }] };
            }
        );

        // 发送群公告
        this.server.registerTool(
            'qq_send_group_notice',
            {
                description: '发送群公告',
                inputSchema: {
                    groupId: z.number().describe('群号'),
                    content: z.string().describe('公告内容'),
                },
            },
            async ({ groupId, content }) => {
                const responseText = await Tool.sendGroupNotice(context, groupId, content);
                return { content: [{ type: 'text', text: responseText }] };
            }
        );


        this.server.registerTool(
            "qq_get_latest_messages",
            {
                description: "获取最近的若干条群聊消息",
                inputSchema: {
                    groupId: z.number().describe('群号'),
                    messageCount: z.number().describe('获取最近几条消息'),
                },
            },
            async ({ groupId, messageCount }) => {
                const responseText = await Tool.getLatestMessages(context, groupId, messageCount);
                return { content: [{ type: 'text', text: responseText }] };
            }
        );


        // @ 时的 prompt
        this.server.registerPrompt(
            "at-message",
            {
                description: "当用户 @ 你时的 system prompt",
                argsSchema: {
                    groupId: z.string().describe('群号')
                }
            },
            async ({ groupId }) => ({
                messages: [{
                    role: "user",
                    content: {
                        type: "text",
                        text: await atMessagePrompt(context, parseInt(groupId))
                    }
                }]
            })
        );

        this.server.registerPrompt(
            "at-query",
            {
                description: "当用户 @ 你时的 query prompt",
                argsSchema: {
                    content: z.string().describe('查询内容'),
                    reference: z.string().optional().describe('参考内容'),
                }
            },
            async ({ content, reference = '无' }) => ({
                messages: [{
                    role: "user",
                    content: {
                        type: "text",
                        text: await atQueryPrompt(content, reference)
                    }
                }]
            })
        )

    }


    public registerWebsearch() {
        const context = this.context;

        // 发送群公告
        this.server.registerTool(
            'util_websearch',
            {
                description: '获取网页内容',
                inputSchema: {
                    url: z.string().describe('url'),
                },
            },
            async ({ url }) => {
                const responseText = await ExtraTool.websearch(url);
                return { content: [{ type: 'text', text: responseText }] };
            }
        );
    }

    public async registerMemory() {
        if (!this.mem) {
            // 如果外部忘记调用 initMemory，这里兜底确保阻塞等待
            await this.initMemory();
        }

        // 1) 添加记忆
        this.server.registerTool(
            "util_add_memory",
            {
                description:
                    "将重要信息添加到【长期记忆】中。\n" +
                    "当用户分享关于自己、他人、事件的重要事实（如：姓名、喜好、习惯、背景、关系、地点、时间等）时，应调用此工具进行存储，供后续检索与引用。\n" +
                    "注意：每条 content 应是完整、明确、可读的一句话；避免含糊/碎片描述。",
                inputSchema: {
                    content: z
                        .array(
                            z
                                .string()
                                .trim()
                                .min(1, "每条记忆内容不能为空")
                                .max(2000, "单条记忆不应超过 2000 字符")
                                .describe("需要记忆的内容。建议一句一条，表达清晰、原子化。"),
                        )
                        .min(1, "至少提供一条记忆内容")
                        .max(100, "单次添加不应超过 100 条")
                        .describe("需要记忆的内容数组"),
                    groupId: z
                        .string()
                        .trim()
                        .default("default")
                        .describe("命名空间，即当前群聊 ID。未知则使用 default"),
                    key: z
                        .string()
                        .trim()
                        .optional()
                        .describe("记忆的唯一标识（可选）。不传或空将自动生成 UUID"),
                },
            },
            async ({ content, groupId, key }) => {
                const mem = await this.getMem();
                const responseText = await mem.addMemory(content, [groupId], key);
                return { content: [{ type: "text", text: responseText }] };
            }
        );

        // 2) 更新记忆
        this.server.registerTool(
            "util_update_memory",
            {
                description:
                    "更新【长期记忆】中指定 key 的内容（以命名空间 + key 为定位）。\n" +
                    "该操作会先删除同 (namespace,key) 的旧记录，再写入新的 content 列表。",
                inputSchema: {
                    groupId: z
                        .string()
                        .trim()
                        .default("default")
                        .describe("命名空间，即当前群聊 ID。未知则使用 default"),
                    key: z
                        .string()
                        .trim()
                        .min(1, "必须提供 key")
                        .describe("记忆唯一标识（插入时由你指定，或系统自动生成）"),
                    content: z
                        .array(
                            z
                                .string()
                                .trim()
                                .min(1, "每条记忆内容不能为空")
                                .max(2000, "单条记忆不应超过 2000 字符"),
                        )
                        .min(1, "至少提供一条新内容")
                        .max(100, "单次更新不应超过 100 条")
                        .describe("用于替换旧内容的新记忆内容数组"),
                },
            },
            async ({ groupId, key, content }) => {
                const mem = await this.getMem();
                const responseText = await mem.updateMemory(groupId, key, content);
                return { content: [{ type: "text", text: responseText }] };
            }
        );

        // 3) 查询记忆
        this.server.registerTool(
            "util_search_memory",
            {
                description:
                    "从【长期记忆】中做语义搜索。\n" +
                    "当用户询问与人物、事件、偏好、历史对话相关的问题（如“XXX 是谁”“他喜欢什么”“上次说的那件事是什么”），应优先调用本工具检索再作答。\n" +
                    "检索基于语义相似度（非关键词），能找到表达不同但含义相近的记忆。",
                inputSchema: {
                    query: z
                        .string()
                        .trim()
                        .min(1, "查询内容不能为空")
                        .max(2000, "查询不应超过 2000 字符")
                        .describe("查询文本（自然语言描述即可）"),
                    groupId: z
                        .string()
                        .trim()
                        .default("default")
                        .describe("命名空间，即当前群聊 ID。未知则使用 default"),
                    topK: z
                        .number()
                        .int()
                        .min(1)
                        .max(50)
                        .default(5)
                        .describe("返回条数上限（默认 5，最大 50）"),
                },
            },
            async ({ groupId, query, topK, }) => {
                const mem = await this.getMem();
                const responseText = await mem.queryMemory(query, [groupId], topK);
                return { content: [{ type: "text", text: responseText }] };
            }
        );

        // 4) 删除记忆
        this.server.registerTool(
            "util_delete_memory",
            {
                description:
                    "从【长期记忆】中删除指定 (命名空间, key) 的所有记录。\n" +
                    "用于撤回/更正错误记忆，或用户要求删除其个人信息时的合规清理。",
                inputSchema: {
                    groupId: z
                        .string()
                        .trim()
                        .default("default")
                        .describe("命名空间/群组 ID。未知则使用 default"),
                    key: z
                        .string()
                        .trim()
                        .min(1, "必须提供 key")
                        .describe("记忆唯一标识"),
                },
            },
            async ({ groupId, key }) => {
                const mem = await this.getMem();
                const responseText = await mem.deleteMemory(groupId, key);
                return { content: [{ type: "text", text: responseText }] };
            }
        );
    }

    public async register(option: McpLanchOption) {
        const {
            enableMemory = true,
            enableWebsearch = true
        } = option;

        this.registerBasic();

        if (enableMemory) {
            await this.registerMemory();
        }

        if (enableWebsearch) {
            this.registerWebsearch();
        }
    }
}

export async function createMcpServer(
    context: LagrangeContext<Lagrange.Message>,
    option: McpLanchOption = {}
) {
    const mcpServer = new McpServer({
        name: 'lagrange.onebot.v11',
        version: '1.0.10',
    });

    const mcpContainer = new LagrangeMcpManager(mcpServer, context);
    await mcpContainer.register(option);

    const {
        host = "localhost",
        port = 3010
    } = option;

    const transport = new McpTransport(mcpServer, host, port);
    transport.start();

    return transport;
}