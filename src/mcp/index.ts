import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp";
import { z } from "zod";
import { LagrangeContext } from "../core/context";
import type * as Lagrange from '../core/type';
import { Default } from './type';
import * as Tool from './tool';
import * as ExtraTool from './extraTool';

import { atMessagePrompt } from "./prompt";

export class LagrangeMcpServer {
    constructor(
        private readonly server: McpServer,
        private readonly transport: StreamableHTTPServerTransport,
        private readonly context: LagrangeContext<Lagrange.Message>,
    ) {
    }


    public registerCommunicationTools() {
        const context = this.context;

        // 发送群消息
        this.server.registerTool(
            'qq_send_message',
            {
                description: '发送群消息',
                inputSchema: {
                    group_id: z.number().describe('群号'),
                    message: z.array(Default).describe('要发送的内容')
                },
            },
            async ({ group_id, message }) => {
                const responseText = await Tool.sendGroupMsg(context, group_id, message);
                return {
                    content: [{ type: 'text', text: responseText }]
                }
            });

        // 获取群信息
        this.server.registerTool(
            'qq_get_group_info',
            {
                description: '获取群信息',
                inputSchema: {
                    group_id: z.number().describe('群号')
                }
            },
            async ({ group_id }) => {
                const responseText = await Tool.getGroupInfo(context, group_id);
                return { content: [{ type: 'text', text: responseText }] };
            }
        );

        // 获取群成员列表
        this.server.registerTool(
            'qq_get_group_member_list',
            {
                description: '获取群成员列表',
                inputSchema: {
                    group_id: z.number().describe('群号'),
                },
            },
            async ({ group_id }) => {
                const responseText = await Tool.getGroupMemberList(context, group_id);
                return { content: [{ type: 'text', text: responseText }] };
            }
        );

        // 获取群成员信息
        this.server.registerTool(
            'qq_get_group_member_info',
            {
                description: '获取群成员信息',
                inputSchema: {
                    group_id: z.number().describe('群号'),
                    user_id: z.number().describe('用户 QQ 号'),
                },
            },
            async ({ group_id, user_id }) => {
                const responseText = await Tool.getGroupMemberInfo(context, group_id, user_id);
                return { content: [{ type: 'text', text: responseText }] };
            }
        );

        // 上传群文件
        this.server.registerTool(
            'qq_upload_group_file',
            {
                description: '上传群文件',
                inputSchema: {
                    group_id: z.number().describe('群号'),
                    file: z.string().describe('文件绝对路径'),
                    name: z.string().describe('文件名称'),
                },
            },
            async ({ group_id, file, name }) => {
                const responseText = await Tool.uploadGroupFile(context, group_id, file, name);
                return { content: [{ type: 'text', text: responseText }] };
            }
        );

        // 发送群公告
        this.server.registerTool(
            'qq_send_group_notice',
            {
                description: '发送群公告',
                inputSchema: {
                    group_id: z.number().describe('群号'),
                    content: z.string().describe('公告内容'),
                },
            },
            async ({ group_id, content }) => {
                const responseText = await Tool.sendGroupNotice(context, group_id, content);
                return { content: [{ type: 'text', text: responseText }] };
            }
        );

    }


    public registerFunctionalityTools() {
        const context = this.context;

        // 发送群公告
        this.server.registerTool(
            'util_websearch',
            {
                description: '发送群公告',
                inputSchema: {
                    url: z.string().describe('url'),
                },
            },
            async ({ url }) => {
                const responseText = await ExtraTool.websearch(url);
                return { content: [{ type: 'text', text: responseText }] };
            }
        );


        // rag

    }

    public registerBasicPrompts() {
        const context = this.context;

        this.server.registerPrompt(
            "at-message",
            {
                description: "当用户 @ 你时的输入",
                argsSchema: {
                    group_id: z.string().describe('群号')
                }
            },
            async ({ group_id }) => ({
                messages: [{
                    role: "user",
                    content: {
                        type: "text",
                        text: await atMessagePrompt(context, parseInt(group_id))
                    }
                }]
            })
        )
    }
}