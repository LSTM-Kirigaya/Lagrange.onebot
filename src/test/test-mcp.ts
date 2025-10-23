/**
 * @description 测试 MCP Server 启动
 * @author 测试文件
 * 
 * 这个文件用于测试 MCP Server 的启动，不需要真实的 Lagrange 连接
 */

import { createMcpServer } from '../mcp';
import { LagrangeContext } from '../core/context';
import lagrangeServer from '../core/context';
import type * as Lagrange from '../core/type';
import WebSocket from 'ws';

// 主函数 - 直接启动 MCP Server
async function startMcpServer() {
    console.log('=================================');
    console.log('启动 MCP Server (测试模式)');
    console.log('=================================\n');

    try {
        // 初始化 lagrangeServer 的 ws 属性以通过检查
        // 创建一个 mock WebSocket
        const mockWs = {
            send: (data: any, callback?: (err?: Error) => void) => {
                console.log('[Mock] 发送消息:', JSON.stringify(data).substring(0, 100));
                if (callback) callback();
            },
            on: () => {},
            onmessage: null,
            readyState: 1
        } as any as WebSocket;

        // 设置 lagrangeServer 的 ws
        (lagrangeServer as any).ws = mockWs;
        (lagrangeServer as any).qq = 123456789;

        // 创建一个简单的 mock context (只需要满足基本类型)
        const mockMessage = {
            post_type: 'message',
            message_type: 'group',
            sub_type: 'normal',
            message_id: 12345,
            group_id: 123456789,
            user_id: 987654321,
            anonymous: null,
            message: [{ type: 'text', data: { text: 'test' } }],
            raw_message: 'test',
            font: 0,
            time: Date.now(),
            self_id: 123456789
        } as Lagrange.GroupMessage;

        const mockContext = new LagrangeContext(mockMessage);

        // 配置 MCP 选项
        const mcpOption = {
            host: 'localhost',
            port: 3010,
            enableMemory: true,     // 简化测试,关闭内存功能
            enableWebsearch: true   // 简化测试,关闭网页搜索功能
        };

        console.log('配置:', JSON.stringify(mcpOption, null, 2));
        console.log('\n启动 MCP Server...\n');
        
        // 创建并启动 MCP server
        const transport = await createMcpServer(mockContext, mcpOption);
        
        console.log('✓ MCP Server 启动成功!');
        console.log(`✓ 服务地址: http://${mcpOption.host}:${mcpOption.port}`);
        console.log('\n=================================');
        console.log('MCP Server 正在运行...');
        console.log('按 Ctrl+C 停止服务');
        console.log('=================================\n');

        // 保持进程运行
        process.on('SIGINT', () => {
            console.log('\n\n正在关闭 MCP Server...');
            transport.close();
            console.log('MCP Server 已关闭');
            process.exit(0);
        });

    } catch (error) {
        console.error('✗ 启动失败:', error);
        process.exit(1);
    }
}

// 如果直接运行这个文件
if (require.main === module) {
    startMcpServer().catch(console.error);
}

export { startMcpServer };
