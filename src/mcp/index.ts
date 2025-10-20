
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { LagrangeContext } from "../core/context";
import type * as Lagrange from '../core/type';
import { Default } from './type';
import * as Tool from './tool';
import * as ExtraTool from './extraTool';

import { atMessagePrompt, atQueryPrompt } from "./prompt";
import { McpLanchOption } from "../core/dto";
import { McpTransport } from "./transport";

export class LagrangeMcpManager {
    constructor(
        private readonly server: McpServer,
        private readonly context: LagrangeContext<Lagrange.Message>,
    ) {
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
                const responseText = await Tool.sendGroupMsg(context, groupId, message);
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

    public registerMemory() {
        // rag
        this.server.registerTool(
            'util_add_memory',
            {
                description: '将重要信息添加到长期记忆中。当用户分享关于自己、他人、事件的重要信息时(例如:姓名、喜好、经历、关系等),应该主动使用此工具记录,以便后续对话中查询使用。',
                inputSchema: {
                    content: z.array(z.string()).describe('需要记忆的内容,每条信息应该是完整、清晰的描述'),
                    groupId: z.string().describe('群号，如果你不知道群号是什么，使用default'),
                    key: z.string().optional().describe('记忆的唯一标识（可选）'),
                },
            },
            async ({ content, groupId, key }) => {
                const responseText = await ExtraTool.addMemory(content, [groupId], key);
                return { content: [{ type: 'text', text: responseText }] };
            }
        );

        this.server.registerTool(
            'util_update_memory',
            {
                description: '更新记忆',
                inputSchema: {
                    groupId: z.string().describe('群号，如果你不知道群号是什么，使用default'),
                    key: z.string().describe('记忆的唯一标识'),
                    content: z.array(z.string()).describe('需要记忆的内容'),
                },
            },
            async ({ groupId, key, content }) => {
                const responseText = await ExtraTool.updateMemory(groupId, key, content);
                return { content: [{ type: 'text', text: responseText }] };
            }
        );


        this.server.registerTool(
            'util_search_memory',
            {
                description: '从长期记忆中查询信息。当用户询问关于特定人物、事件、或之前对话中提到的信息时,应该首先使用此工具搜索相关记忆。例如:用户问"XXX是谁"、"XXX喜欢什么"、"上次说的那件事"等问题时,必须先调用此工具查询。',
                inputSchema: {
                    query: z.string().describe('搜索的关键字,可以是人名、事件名、或相关描述'),
                    groupId: z.string().describe('群号，如果你不知道群号是什么，使用default'),
                },
            },
            async ({ groupId, query }) => {
                const responseText = await ExtraTool.queryMemory(query, [groupId]);
                return { content: [{ type: 'text', text: responseText }] };
            }
        );
    }

    public register(option: McpLanchOption) {
        const {
            enableMemory = true,
            enableWebsearch = true
        } = option;

        this.registerBasic();

        if (enableMemory) {
            this.registerMemory();
        }

        if (enableWebsearch) {
            this.registerWebsearch();
        }
    }
}

export function createMcpServer(
    context: LagrangeContext<Lagrange.Message>,
    option: McpLanchOption = {}
) {
    const mcpServer = new McpServer({
        name: 'lagrange.onebot.v11',
        version: '1.0.10',
    });

    const mcpContainer = new LagrangeMcpManager(mcpServer, context);
    mcpContainer.register(option);

    const {
        host = "localhost",
        port = 3010
    } = option;

    const transport = new McpTransport(mcpServer, host, port);
    transport.start();

    return transport;
}