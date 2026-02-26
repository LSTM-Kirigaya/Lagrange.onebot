import { LagrangeContext } from '../core/context';
import type * as Lagrange from '../core/type';

/** 单条历史消息的搜索结果 */
export interface HistoryMessageResult {
    /** 消息发送者 QQ 号 */
    senderId: number;
    /** 消息发送者昵称 */
    senderName?: string;
    /** 消息发送时间戳 */
    time: number;
    /** 消息内容（纯文本） */
    content: string;
    /** 消息 ID */
    messageId: number;
    /** 消息序号 */
    messageSeq?: number;
}

/** 搜索历史消息的选项 */
export interface SearchHistoryOptions {
    /** 搜索关键词（支持多个，空格分隔） */
    keywords: string;
    /** 群组 ID */
    groupId: number;
    /** 最大搜索消息数，默认 500 */
    maxMessages?: number;
    /** 返回结果数量，默认 20 */
    limit?: number;
    /** 是否区分大小写，默认 false */
    caseSensitive?: boolean;
    /** 是否匹配完整单词，默认 false */
    matchWholeWord?: boolean;
}

/**
 * 从消息对象中提取纯文本内容
 */
function extractMessageContent(message: string | Lagrange.Send.Default[]): string {
    if (typeof message === 'string') {
        return message;
    }
    
    if (Array.isArray(message)) {
        return message
            .filter(seg => seg.type === 'text')
            .map(seg => {
                const data = seg.data as any;
                return (data?.text || '') as string;
            })
            .join('');
    }
    
    return '';
}

/**
 * 检查文本是否匹配关键词
 */
function matchesKeyword(
    text: string,
    keywords: string[],
    caseSensitive: boolean,
    matchWholeWord: boolean
): boolean {
    if (!text) return false;
    
    const searchText = caseSensitive ? text : text.toLowerCase();
    const searchKeywords = caseSensitive ? keywords : keywords.map(k => k.toLowerCase());
    
    // 所有关键词都必须匹配
    return searchKeywords.every(keyword => {
        if (matchWholeWord) {
            // 完整单词匹配（使用单词边界）
            const regex = new RegExp(`\\b${escapeRegExp(keyword)}\\b`, caseSensitive ? 'g' : 'gi');
            return regex.test(searchText);
        } else {
            // 子串匹配
            return searchText.includes(keyword);
        }
    });
}

/**
 * 转义正则表达式特殊字符
 */
function escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 搜索群聊历史消息
 * 
 * @param context Lagrange 上下文
 * @param options 搜索选项
 * @returns 匹配的消息列表
 */
export async function searchGroupMsgHistory(
    context: LagrangeContext<Lagrange.Message>,
    options: SearchHistoryOptions
): Promise<HistoryMessageResult[]> {
    const {
        keywords,
        groupId,
        maxMessages = 500,
        limit = 20,
        caseSensitive = false,
        matchWholeWord = false,
    } = options;

    // 解析关键词（支持空格分隔多个关键词）
    const keywordList = keywords.trim().split(/\s+/).filter(k => k.length > 0);
    
    if (keywordList.length === 0) {
        return [];
    }

    // 批量获取历史消息，每次 100 条
    const batchSize = 100;
    const allMessages: Lagrange.GetMsgResponse[] = [];
    let fetchedCount = 0;
    let lastMessageId: number | undefined;

    while (fetchedCount < maxMessages) {
        const currentBatchSize = Math.min(batchSize, maxMessages - fetchedCount);
        
        const params: any = {
            group_id: groupId,
            count: currentBatchSize,
        };
        
        // 如果有上次的 message_id，继续往前获取
        if (lastMessageId !== undefined) {
            params.message_id = lastMessageId;
        }

        try {
            const response = await context.getGroupMsgHistory(params);
            const messages = response?.data?.messages ?? [];
            
            if (messages.length === 0) {
                break;
            }

            allMessages.push(...messages);
            fetchedCount += messages.length;
            
            // 更新最后一条消息的 ID，用于下一轮获取
            const lastMsg = messages[messages.length - 1];
            lastMessageId = lastMsg?.message_id;
            
            // 如果返回的消息少于请求的数量，说明已经到头了
            if (messages.length < currentBatchSize) {
                break;
            }
        } catch (error) {
            console.error('[searchGroupMsgHistory] 获取历史消息失败:', error);
            break;
        }
    }

    // 过滤匹配的消息
    const results: HistoryMessageResult[] = [];
    
    for (const msg of allMessages) {
        const content = extractMessageContent(msg.message);
        
        if (matchesKeyword(content, keywordList, caseSensitive, matchWholeWord)) {
            results.push({
                senderId: msg.sender?.user_id || 0,
                senderName: msg.sender?.nickname || msg.sender?.card || undefined,
                time: msg.time || 0,
                content,
                messageId: msg.message_id,
            });
            
            // 达到限制数量就停止
            if (results.length >= limit) {
                break;
            }
        }
    }

    return results;
}

/**
 * 搜索好友历史消息
 * 
 * @param context Lagrange 上下文
 * @param options 搜索选项
 * @returns 匹配的消息列表
 */
export async function searchFriendMsgHistory(
    context: LagrangeContext<Lagrange.Message>,
    options: Omit<SearchHistoryOptions, 'groupId'> & { userId: number }
): Promise<HistoryMessageResult[]> {
    const {
        keywords,
        userId,
        maxMessages = 500,
        limit = 20,
        caseSensitive = false,
        matchWholeWord = false,
    } = options;

    // 解析关键词
    const keywordList = keywords.trim().split(/\s+/).filter(k => k.length > 0);
    
    if (keywordList.length === 0) {
        return [];
    }

    // 批量获取历史消息
    const batchSize = 100;
    const allMessages: Lagrange.GetMsgResponse[] = [];
    let fetchedCount = 0;
    let lastMessageId: number | undefined;

    while (fetchedCount < maxMessages) {
        const currentBatchSize = Math.min(batchSize, maxMessages - fetchedCount);
        
        const params: any = {
            user_id: userId,
            count: currentBatchSize,
        };
        
        if (lastMessageId !== undefined) {
            params.message_id = lastMessageId;
        }

        try {
            const response = await context.getFriendMsgHistory(params);
            const messages = response?.data?.messages ?? [];
            
            if (messages.length === 0) {
                break;
            }

            allMessages.push(...messages);
            fetchedCount += messages.length;
            
            const lastMsg = messages[messages.length - 1];
            lastMessageId = lastMsg?.message_id;
            
            if (messages.length < currentBatchSize) {
                break;
            }
        } catch (error) {
            console.error('[searchFriendMsgHistory] 获取历史消息失败:', error);
            break;
        }
    }

    // 过滤匹配的消息
    const results: HistoryMessageResult[] = [];
    
    for (const msg of allMessages) {
        const content = extractMessageContent(msg.message);
        
        if (matchesKeyword(content, keywordList, caseSensitive, matchWholeWord)) {
            results.push({
                senderId: msg.sender?.user_id || 0,
                senderName: msg.sender?.nickname || undefined,
                time: msg.time || 0,
                content,
                messageId: msg.message_id,
            });
            
            if (results.length >= limit) {
                break;
            }
        }
    }

    return results;
}
