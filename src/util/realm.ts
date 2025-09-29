import { unpackMultiple } from 'msgpackr';
import Realm from 'realm';
import type { LagrangeContext } from '../core/context';
import type { GroupMessage, PrivateMessage } from '../core/type';
import * as fs from 'fs';
import { DecodedMessage, MessageEntity, QueryMessageDto, QueryMessageItem, RealmConfig, UserInfo } from './realm.dto';
import chalk from 'chalk';

export class RealmService {
    private realm: Realm | null = null;

    constructor(
        private readonly realmConfig: RealmConfig
    ) {
    }

    /**
     * 检查 Realm 文件是否存在
     */
    private checkRealmFileExists(): boolean {
        return fs.existsSync(this.realmConfig.path);
    }

    /**
     * @description 初始化数据库连接
     */
    async connect(): Promise<void> {

        if (!this.checkRealmFileExists()) {
            throw new Error(`Realm数据库文件不存在: ${this.realmConfig.path}`);
        }

        try {
            this.realm = new Realm({
                path: this.realmConfig.path,
                schemaVersion: this.realmConfig.schemaVersion,
                encryptionKey: this.realmConfig.encryptionKey,
                readOnly: true,
            });

            console.log(
                chalk.bold.cyan("📦 Realm Database ") + chalk.green("connected")
            );

        } catch (error: any) {
            console.log(
                chalk.bold.red("📦 Realm Database ") + chalk.red("connect failed")
            );

            throw new Error(`无法打开Realm数据库: ${error.message}`);
        }
    }

    /**
     * @description 关闭数据库连接
     */
    close(): void {
        if (this.realm) {
            this.realm.close();
            this.realm = null;
        }
    }

    /**
     * @description 获取指定群组的最新N条消息
     * @param c Lagrange上下文
     * @param groupId 群组ID
     * @param limit 消息数量限制
     */
    async getLatestGroupMessages(
        c: LagrangeContext<GroupMessage | PrivateMessage>,
        groupId: number,
        limit: number = 10
    ): Promise<QueryMessageDto | undefined> {

        if (!this.realm) {
            throw new Error('数据库未初始化');
        }

        try {
            const messageRecords = this.realm.objects("MessageRecord");
            
            // 初始化用户映射
            const userMap: Record<number, UserInfo> = {};

            const groupMessages = messageRecords
                .filtered(`Type == 0 && ToUin == ${groupId}`)
                .sorted("Time", true) // 按时间倒序排列
                .slice(0, limit); // 取前N条

            // 构建 JSON 数据结构
            const exportData: QueryMessageDto = {
                groupId,
                exportTime: new Date().toLocaleString(),
                messageCount: 0,
                wordCount: 0,
                messages: [],
                // users: {}
            };

            const groupInfo = await c.getGroupInfo(groupId);
            if (!(groupInfo instanceof Error)) {
                exportData.groupName = groupInfo.data?.group_name;
                exportData.memberCount = groupInfo.data?.member_count;
            }
            
            // 处理每条消息
            let messageCount = 0;
            let wordCount = 0;

            for (let i = 0; i < groupMessages.length; i++) {
                const msg: any = groupMessages[i];
                const senderUin = msg.FromUin;

                if (!senderUin) {
                    continue;
                }

                if (userMap[senderUin] === undefined) {
                    const user = await c.getGroupMemberInfo(groupId, senderUin);
                    if (!(user instanceof Error)) {
                        userMap[senderUin] = {
                            name: user.data?.card || user.data?.nickname || (senderUin + ''),
                            qq: senderUin,
                            avatar: `https://q1.qlogo.cn/g?b=qq&nk=${senderUin}&s=640`,
                            messageCount: 0,
                            wordCount: 0
                        };
                    } else {
                        userMap[senderUin] = {
                            name: senderUin + '',
                            qq: senderUin,
                            avatar: `https://q1.qlogo.cn/g?b=qq&nk=${senderUin}&s=640`,
                            messageCount: 0,
                            wordCount: 0
                        };
                    }
                }
                
                const userInfo = userMap[senderUin];

                const payloadBuffer = new Uint8Array(msg.Entities as any);
                const decodeResult = await decodeEntities(c, payloadBuffer);

                if (decodeResult === undefined || decodeResult.text.trim().length === 0) {
                    continue;
                }

                
                const exportMessage: QueryMessageItem = {
                    sender: userInfo?.name || senderUin + '',
                    time: formatTimestamp(msg.Time.getTime()),
                    content: decodeResult.text.trim()
                };

                if (decodeResult.replyName) {
                    exportMessage.replyName = decodeResult.replyName;
                }

                if (decodeResult.replyText) {
                    exportMessage.replyText = decodeResult.replyText;
                }

                userMap[senderUin].messageCount++;
                if (decodeResult.text.startsWith('![') && decodeResult.text.endsWith(')')) {
                    userMap[senderUin].wordCount++;
                    wordCount++;
                } else {
                    userMap[senderUin].wordCount += decodeResult.text.trim().length;
                    wordCount += decodeResult.text.trim().length;
                }

                exportData.messages.push(exportMessage);
                messageCount++;
            }

            // exportData.users = userMap;
            exportData.messageCount = messageCount;
            exportData.wordCount = wordCount;

            return exportData;
        } catch (error) {
            console.error('查询最新消息时出错:', error);
            return undefined;
        }
    }

    /**
     * 获取指定群组某一天的所有消息
     * @param c Lagrange上下文
     * @param groupId 群组ID
     * @param date 指定日期，默认为今天
     */
    async getGroupMessagesByDate(
        c: LagrangeContext<GroupMessage | PrivateMessage>,
        groupId: number,
        date: Date = new Date()
    ): Promise<QueryMessageDto | undefined> {
        if (!this.realm) {
            throw new Error('数据库未初始化');
        }

        try {
            const messageRecords = this.realm.objects("MessageRecord");
            
            // 初始化用户映射
            const userMap: Record<number, UserInfo> = {};

            // 计算指定日期的开始和结束时间戳
            const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);

            const startTimestamp = Math.floor(startOfDay.getTime());
            const endTimestamp = Math.floor(endOfDay.getTime());

            console.log(`查询时间范围: ${formatTimestamp(startTimestamp)} 至 ${formatTimestamp(endTimestamp)}`);

            const groupMessages = messageRecords
                .filtered(
                    `Type == 0 && ToUin == ${groupId} && Time >= $0 && Time < $1`,
                    new Date(startTimestamp),
                    new Date(endTimestamp)
                )
                .sorted("Time", false);

            console.log(`找到 ${groupMessages.length} 条消息`);

            // 构建 JSON 数据结构
            const exportData: QueryMessageDto = {
                groupId,
                exportTime: new Date().toLocaleString(),
                messageCount: 0,
                wordCount: 0,
                messages: [],
            };

            const groupInfo = await c.getGroupInfo(groupId);
            if (!(groupInfo instanceof Error)) {
                exportData.groupName = groupInfo.data?.group_name;
                exportData.memberCount = groupInfo.data?.member_count;
            }
            
            // 处理每条消息
            let messageCount = 0;
            let wordCount = 0;

            for (let i = 0; i < groupMessages.length; i++) {
                const msg: any = groupMessages[i];
                const senderUin = msg.FromUin;

                if (!senderUin) {
                    continue;
                }

                if (userMap[senderUin] === undefined) {
                    const user = await c.getGroupMemberInfo(groupId, senderUin);
                    if (!(user instanceof Error)) {
                        userMap[senderUin] = {
                            name: user.data?.card || user.data?.nickname || (senderUin + ''),
                            qq: senderUin,
                            avatar: `https://q1.qlogo.cn/g?b=qq&nk=${senderUin}&s=640`,
                            messageCount: 0,
                            wordCount: 0
                        };
                    } else {
                        userMap[senderUin] = {
                            name: senderUin + '',
                            qq: senderUin,
                            avatar: `https://q1.qlogo.cn/g?b=qq&nk=${senderUin}&s=640`,
                            messageCount: 0,
                            wordCount: 0
                        };
                    }
                }
                
                const userInfo = userMap[senderUin];

                const payloadBuffer = new Uint8Array(msg.Entities as any);
                const decodeResult = await decodeEntities(c, payloadBuffer);

                if (decodeResult === undefined || decodeResult.text.trim().length === 0) {
                    continue;
                }
                
                const exportMessage: QueryMessageItem = {
                    sender: userInfo?.name || senderUin + '',
                    time: formatTimestamp(msg.Time.getTime()),
                    content: decodeResult.text.trim()
                };

                if (decodeResult.replyName) {
                    exportMessage.replyName = decodeResult.replyName;
                }

                if (decodeResult.replyText) {
                    exportMessage.replyText = decodeResult.replyText;
                }

                userMap[senderUin].messageCount++;
                if (decodeResult.text.startsWith('![') && decodeResult.text.endsWith(')')) {
                    userMap[senderUin].wordCount++;
                    wordCount++;
                } else {
                    userMap[senderUin].wordCount += decodeResult.text.trim().length;
                    wordCount += decodeResult.text.trim().length;
                }

                exportData.messages.push(exportMessage);
                messageCount++;
            }

            // exportData.users = userMap;
            exportData.messageCount = messageCount;
            exportData.wordCount = wordCount;

            return exportData;
        } catch (error) {
            console.error('查询指定日期消息时出错:', error);
            return undefined;
        }
    }
}


/**
 * 解码消息实体内容
 */
async function decodeEntities(c: LagrangeContext<GroupMessage | PrivateMessage>, buffer: Uint8Array): Promise<DecodedMessage | undefined> {
    try {
        const pkgs = unpackMultiple(buffer);
        let rawText = '';
        let payloadText = '';
        let replyName = '';
        let replyText = '';

        for (const pkg of pkgs) {
            // 如果是 Uint8Array，则递归解码
            if (pkg instanceof Uint8Array) {
                const result = await decodeEntities(c, pkg);
                if (result) {
                    payloadText += result.text;
                }
                continue;
            }

            if (Array.isArray(pkg)) {
                continue;
            }

            const entity = pkg as MessageEntity;
            if (entity.Text && (!entity.Text.includes('�') || entity.Text.includes('\\x'))) {
                rawText += entity.Text + '\n';
            } else if (entity.ImageUrl) {
                
                const type = entity.SubType === 0 ? '图片' : '动画表情';
                rawText += `![${type}](${entity.FilePath})\n`;

            } else if (entity.Payload) {
                rawText += entity.Payload + '\n';
            } else if (entity.Uin && entity.Name) {
                const name = entity.Name as string;
                if (name.startsWith('@')) {
                    replyName = name;
                    replyText = payloadText;
                }
            }
        }

        return {
            replyName: replyName.length === 0 ? undefined : replyName,
            replyText: replyText.length === 0 ? undefined : replyText,
            text: rawText.trim()
        };
    } catch (error) {
        return undefined;
    }
}

/**
 * 只需要返回小时，分钟即可
 */
function formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

