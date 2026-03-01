import path from 'path';
import { LagrangeFactory, mapper, LagrangeContext, PrivateMessage } from '..';
import { qq_groups, qq_users } from './global';

/** 仅用于正向 WS 的发送图片/接收消息测试 */
class ForwardWsTestChannel {
    @mapper.onPrivateUser(qq_users.JIN_HUI)
    async handleTestPrivate(c: LagrangeContext<PrivateMessage>) {
        const raw = c.getRawText().trim();
        // 打印收到的消息（含类型与内容，便于查看图片等）
        console.log('[收到私聊] raw_message:', c.message.raw_message);
        console.log('[收到私聊] message 段:', JSON.stringify(c.message.message, null, 2));

        c.finishSession();
    }
}

async function loadEnv() {
    try {
        await import('dotenv/config');
    } catch {
        // dotenv 未安装时跳过，使用系统环境变量
    }
}

async function main() {
    await loadEnv();

    const host = process.env.LAGRANGE_WS_HOST;
    const port = process.env.LAGRANGE_WS_PORT;
    const accessToken = process.env.LAGRANGE_WS_ACCESS_TOKEN;
    const type = (process.env.LAGRANGE_WS_TYPE || 'forward-websocket') as 'forward-websocket' | 'backward-websocket';
    const pathRoute = process.env.LAGRANGE_WS_PATH;

    if (!host || !port) {
        console.error('请配置 LAGRANGE_WS_HOST 和 LAGRANGE_WS_PORT（.env 或环境变量），并确保已安装 dotenv: npm install dotenv');
        process.exit(1);
    }

    const server = LagrangeFactory.create([ForwardWsTestChannel]);

    server.onMounted(async (c) => {
        await c.sendPrivateMsg(qq_users.JIN_HUI, 'Forward WS 已连接，TIP online');
    });    

    server.launch({
        type,
        host,
        port: Number(port),
        ...(accessToken ? { accessToken } : {}),
        ...(type === 'backward-websocket' && pathRoute ? { path: pathRoute } : {}),

        mcpOption: {
            enableMemory: true,
            enableWebsearch: true,
            host: '0.0.0.0',
            port: 3010,
        }
    });
}

main();
