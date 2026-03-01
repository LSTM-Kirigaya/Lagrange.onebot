/**
 * 正向 WebSocket 连接测试
 * 通过 .env 配置 host / port / token，不依赖 appsettings.json
 *
 * 使用方式：
 * 1. 复制 .env.example 为 .env，填写 LAGRANGE_WS_HOST、LAGRANGE_WS_PORT、LAGRANGE_WS_ACCESS_TOKEN 等
 * 2. 无配置文件时：可设置 LAGRANGE_CORE_HOME 指向含 appsettings 的目录
 * 3. 执行: npx tsx src/test/main-forward-ws.ts
 *
 * 若未安装 dotenv，会跳过加载 .env，请先执行 npm install dotenv 以支持 .env 文件。
 *
 * 测试说明：
 * - 启动后会自动向 JIN_HUI 发送一条文本和一张图片（hello.jpg）
 * - 启动后会拉取好友 JIN_HUI 与群 OPENMCP_DEV 的最近历史消息并打印到控制台
 * - 私聊发送「发图」：机器人回复一张图片
 * - 私聊发送任意消息：控制台打印收到的消息内容（含图片等）
 */
import path from 'path';
import { LagrangeFactory, mapper, LagrangeContext, PrivateMessage } from '..';
import { qq_groups, qq_users } from './global';

/** 获取测试用图片的 file:// URL（以项目根为 cwd 时 src/test/hello.jpg） */
function getTestImageFileUrl(): string {
    const p = path.join(process.cwd(), 'src', 'test', 'hello.jpg').replace(/\\/g, '/');
    return p.startsWith('/') ? `file://${p}` : `file:///${p}`;
}

/** 仅用于正向 WS 的发送图片/接收消息测试 */
class ForwardWsTestChannel {
    @mapper.onPrivateUser(qq_users.JIN_HUI)
    async handleTestPrivate(c: LagrangeContext<PrivateMessage>) {
        const raw = c.getRawText().trim();
        // 打印收到的消息（含类型与内容，便于查看图片等）
        console.log('[收到私聊] raw_message:', c.message.raw_message);
        console.log('[收到私聊] message 段:', JSON.stringify(c.message.message, null, 2));

        if (raw === '发图' || raw === '测试发图') {
            const fileUrl = getTestImageFileUrl();
            console.log(await c.canSendImage());
            c.sendPrivateMsg(qq_users.JIN_HUI, [{ type: 'image', data: { file: 'https://uhlqribpagvklpqmcqvo.supabase.co/storage/v1/object/public/chat-images/05f52245-50fc-443f-8bca-e1a8aabbc6d3/1770743634926_07310331-b32f-4072-a19a-d60274c1deca.gif' } }]);
            console.log('[测试] 已发送图片:', fileUrl);
        } else {
            
            await c.sendPrivateMsg(qq_users.JIN_HUI, `已收到你的消息（${raw.length} 字），类型: ${c.message.message?.map((m: any) => m.type).join(', ') || 'unknown'}`);
        }
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
        // 测试发送图片：启动后发一张 hello.jpg
        const imageUrl = getTestImageFileUrl();
        await c.sendPrivateMsg(qq_users.JIN_HUI, [{ type: 'image', data: { file: imageUrl } }]);
        console.log('[测试] 已发送启动图片:', imageUrl);

        // 获取好友 JIN_HUI 的历史消息
        const friendHistory = await c.getFriendMsgHistory({ user_id: qq_users.JIN_HUI, count: 10 });
        if (friendHistory instanceof Error || !friendHistory.data?.messages?.length) {
            console.log('[历史消息] 好友 JIN_HUI: 无数据或请求失败', friendHistory instanceof Error ? friendHistory.message : '');
        } else {
            console.log('[历史消息] 好友 JIN_HUI 最近', friendHistory.data.messages.length, '条:');
            friendHistory.data.messages.slice(0, 5).forEach((msg, i) => {
                const content = typeof msg.message === 'string' ? msg.message : msg.message?.map((s: any) => s.type === 'text' ? s.data?.text : `[${s.type}]`).join(' ') ?? '';
                console.log(`  ${i + 1}. [${new Date(msg.time * 1000).toISOString()}] ${content.slice(0, 60)}${content.length > 60 ? '...' : ''}`);
            });
        }

        // 获取群聊 OPENMCP_DEV 的历史消息
        const groupHistory = await c.getGroupMsgHistory({ group_id: qq_groups.OPENMCP_DEV, count: 10 });
        if (groupHistory instanceof Error || !groupHistory.data?.messages?.length) {
            console.log('[历史消息] 群 OPENMCP_DEV: 无数据或请求失败', groupHistory instanceof Error ? groupHistory.message : '');
        } else {
            console.log('[历史消息] 群 OPENMCP_DEV 最近', groupHistory.data.messages.length, '条:');
            groupHistory.data.messages.slice(0, 5).forEach((msg, i) => {
                const content = typeof msg.message === 'string' ? msg.message : msg.message?.map((s: any) => s.type === 'text' ? s.data?.text : `[${s.type}]`).join(' ') ?? '';
                const sender = msg.sender?.nickname ?? msg.sender?.user_id ?? '?';
                console.log(`  ${i + 1}. [${new Date(msg.time * 1000).toISOString()}] ${sender}: ${content.slice(0, 50)}${content.length > 50 ? '...' : ''}`);
            });
        }
    });

    server.launch({
        type,
        host,
        port: Number(port),
        ...(accessToken ? { accessToken } : {}),
        ...(type === 'backward-websocket' && pathRoute ? { path: pathRoute } : {}),
    });
}

main();
