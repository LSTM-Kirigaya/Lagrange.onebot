import path from 'path';
import { LagrangeFactory } from '..';
import { qq_groups, qq_users } from './global';
import { TestChannel } from './test-channel';
import type { QueryMessageDto, UserInfo } from '../util/realm.dto';
import type { LagrangeContext } from '../core/context';
import * as fs from 'fs';
import { GetMsgResponse } from '../core/type';

/**
 * 获取指定群组当天的消息
 */
async function getTodaysGroupMessages(
    context: LagrangeContext<any>,
    groupId: number,
    chunkSize = 50,
    limit = 3000,
): Promise<QueryMessageDto> {

    const now = Date.now() / 1000;           // 当前时间（毫秒）
    const startTime = now - 24 * 60 * 60;

    let messageId: number | undefined = undefined;

    const allMessages: GetMsgResponse[] = [];
    const seenMessageIds = new Set<number>();

    let stopLoop = false;

    while (!stopLoop) {
        const res = await context.getGroupMsgHistory(
            groupId,
            messageId,
            chunkSize,
            true
        );

        if (res instanceof Error || !res.data?.messages?.length) {
            break;
        }

        const batchMessages = res.data.messages;

        for (const msg of batchMessages) {
            // 去重
            if (seenMessageIds.has(msg.message_id)) {
                continue;
            }
            seenMessageIds.add(msg.message_id);

            // 超出今天 → 直接停止
            if (msg.time < startTime) {
                console.log((new Date(msg.time * 1000)).toLocaleString());
                console.log((new Date(startTime * 1000)).toLocaleString());

                stopLoop = true;
            } else {
                allMessages.push(msg);
            }
        }

        // 下一页：用“最早”的那条 message_id
        const oldest = batchMessages[0];
        messageId = oldest?.message_id;

        // 防止死循环
        if (!messageId) {
            break;
        }

        if (allMessages.length >= limit) {
            break;
        }
    }

    const userMap: Record<number, UserInfo> = {};
    const queryMessageDto: QueryMessageDto = {
        groupId,
        exportTime: new Date().toISOString(),
        messageCount: 0,
        wordCount: 0,
        messages: [],
    };

    const groupInfo = await context.getGroupInfo(groupId);
    if (!(groupInfo instanceof Error)) {
        queryMessageDto.groupName = groupInfo.data?.group_name;
        queryMessageDto.memberCount = groupInfo.data?.member_count;
    }

    let messageCount = 0;
    let wordCount = 0;

    allMessages.sort((a, b) => a.time - b.time);

    for (const msg of allMessages) {
        const senderUin = msg.sender.user_id;

        if (!userMap[senderUin]) {
            const user = await context.getGroupMemberInfo(groupId, senderUin);
            userMap[senderUin] = {
                name: !(user instanceof Error)
                    ? user.data?.card || user.data?.nickname || String(senderUin)
                    : String(senderUin),
                qq: senderUin,
                avatar: `https://q1.qlogo.cn/g?b=qq&nk=${senderUin}&s=640`,
                messageCount: 0,
                wordCount: 0
            };
        }

        let content = '';
        if (typeof msg.message === 'string') {
            content = msg.message;
        } else if (Array.isArray(msg.message)) {
            content = msg.message.map(seg => {
                if (seg.type === 'text') return seg.data.text;
                if (seg.type === 'image') return '[图片]';
                if (seg.type === 'at') return '[at]';
                return '';
            }).join('');
        }

        if (!content.trim()) continue;

        userMap[senderUin].messageCount++;
        userMap[senderUin].wordCount += content.length;

        wordCount += content.length;
        messageCount++;

        queryMessageDto.messages.push({
            sender: userMap[senderUin].name,
            time: new Date(msg.time * 1000).toLocaleString(),
            content: content.trim()
        });
    }

    queryMessageDto.users = userMap;
    queryMessageDto.messageCount = messageCount;
    queryMessageDto.wordCount = wordCount;

    console.log('message Count', messageCount);
    console.log('word Count', wordCount);

    return queryMessageDto;
}


const server = LagrangeFactory.create([
    TestChannel
]);

server.onMounted(async c => {
    await c.sendPrivateMsg(qq_users.JIN_HUI, 'Successfully Login, TIP online');

    // 原有代码保留作参考
    const res = await c.getGroupMsgHistory(qq_groups.OPENMCP_DEV, undefined, 20);
    for (const msg of res.data.messages) {
        const actualTime = new Date(msg.time * 1000);
    }
});

server.launch({
    configPath: path.join(
        process.env['LAGRANGE_CORE_HOME'] || '',
        'appsettings.json'
    ),

    mcp: true,
    mcpOption: {
        enableMemory: true,
        enableWebsearch: true,
        host: '0.0.0.0',
        port: 3010
    }
});