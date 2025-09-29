import { z } from 'zod';

const QueryMessageItemSchema = z.object({
    sender: z.string(),
    time: z.string(),
    content: z.string(),
    replyName: z.string().optional(),
    replyText: z.string().optional(),
});

const QueryMessageDtoSchema = z.object({
    groupId: z.number(),
    groupName: z.string().optional(),
    exportTime: z.string(),
    memberCount: z.number().optional(),
    messageCount: z.number(),
    wordCount: z.number(),
    messages: z.array(QueryMessageItemSchema),
    users: z.record(z.string(), z.any()).optional(),
});

export type QueryMessageItem = z.infer<typeof QueryMessageItemSchema>;
export type QueryMessageDto = z.infer<typeof QueryMessageDtoSchema>;

export interface RealmConfig {
    path: string;
    schemaVersion: number;
    encryptionKey?: Uint8Array;
}

export interface MessageRecord {
    Type: number;
    ToUin: number;
    FromUin: number;
    Time: Date;
    Entities: ArrayBuffer;
}

export interface UserInfo {
    name: string;
    qq: number;
    avatar: string;
    messageCount: number;
    wordCount: number;
}

export interface GroupMessagesExport {
    groupId: number;
    groupName?: string;
    exportTime: string;
    memberCount?: number;
    messageCount: number;
    wordCount: number;
    messages: QueryMessageItem[];
    users: Record<number, UserInfo>;
}

export interface DecodedMessage {
    replyName?: string;
    replyText?: string;
    text: string;
}

export interface MessageEntity {
    Text?: string;
    ImageUrl?: string;
    SubType?: number;
    FilePath?: string;
    Payload?: string;
    Uin?: number;
    Name?: string;
}
