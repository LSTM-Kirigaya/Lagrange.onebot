/** 供历史消息查询等使用的消息项与用户信息类型（与 realm 无关） */
export interface QueryMessageItem {
    sender: string
    time: string
    content: string
    replyName?: string
    replyText?: string
}

export interface QueryMessageDto {
    groupId: number
    groupName?: string
    exportTime: string
    memberCount?: number
    messageCount: number
    wordCount: number
    messages: QueryMessageItem[]
    users?: Record<string, unknown>
}

export interface UserInfo {
    name: string
    qq: number
    avatar: string
    messageCount: number
    wordCount: number
}
