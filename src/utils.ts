import { exec } from 'node:child_process';

import Logger from '@ptkdev/logger';
import axios from 'axios';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import * as Lagrange from './type';
import { LagrangeContext } from './context';

export const logger = new Logger();

export function command(cmd: string) {
    return new Promise<string>((resolve, reject) => {
        exec(cmd, (error, stdout, stderr) => {
            if (error) {  
                logger.error(`exec error: ${error}`);  
                return reject(error);  
            }  
            if (stderr) {  
                logger.error(`stderr: ${stderr}`);  
            }  
            resolve(stdout);
        });
    });
}

export class SizedQueue<T> {
    public items: T[] = [];
    private maxSize: number;

    constructor(maxSize: number) {
        this.maxSize = maxSize;
    }

    // 入队
    enqueue(item: T): void {
        if (this.items.length >= this.maxSize) {
            this.items.shift(); // 如果队列已满，移除队首元素
        }
        this.items.push(item);
    }

    // 出队
    dequeue(): T | undefined {
        return this.items.shift();
    }

    // 查看队首元素
    peek(): T | undefined {
        return this.items[0];
    }

    // 判断队列是否为空
    isEmpty(): boolean {
        return this.items.length === 0;
    }

    // 获取队列长度
    size(): number {
        return this.items.length;
    }

    // 获取队列最大容量
    getMaxSize(): number {
        return this.maxSize;
    }

    clear() {
        this.items.length = 0;
    }
}


export function getConfigurationPath(...segments: string[]) {
    const home = path.join(os.homedir(), '.lagrange-onebot');
    return path.join(home, ...segments);
}

export function getPrivateMessageImagePath(userId: number, subType: number, fileName: string) {
    const folder = getConfigurationPath(userId.toString(), subType === 0 ? 'images' : 'stickers');
    return path.join(folder, fileName);
}

export function getGroupMessageImagePath(groupId: number, subType: number, fileName: string) {
    const folder = getConfigurationPath(groupId.toString(), subType === 0 ? 'images' : 'stickers');
    return path.join(folder, fileName);
}

export function handleAutoDownloadImage(c: LagrangeContext<Lagrange.GroupMessage | Lagrange.PrivateMessage>) {
    const messages = c.message.message;
    let domain = '';

    if (c.message.message_type === 'private') {
        domain = c.message.user_id.toString();
    } else if (c.message.message_type === 'group') {
        domain = c.message.group_id.toString();
    }

    for (const msg of messages) {
        if (msg.type === 'image') {
            const url = msg.data.url || msg.data.file;
            const filename = msg.data.filename;

            const folder = getConfigurationPath(domain, msg.data.subType === 0 ? 'images' : 'stickers');
            if (!fs.existsSync(folder)) {
                fs.mkdirSync(folder, { recursive: true });
            }

            const imagePath = path.join(folder, filename);

            if (!fs.existsSync(imagePath)) {
                axios.get(url, {
                    responseType: 'arraybuffer',
                    timeout: 10000
                }).then(res => {
                    fs.writeFileSync(imagePath, res.data);
                })
            }
        }
    }
}

export async function getUserAvatarPath(user_id: number, no_cache: boolean = false): Promise<string> {
    const avatarDir = getConfigurationPath('avatar');
    const avatarPath = path.join(avatarDir, `${user_id}.jpg`);

    // 如果不强制刷新且文件已存在，则直接返回路径
    if (!no_cache && fs.existsSync(avatarPath)) {
        return avatarPath;
    }

    // 确保目录存在
    fs.mkdirSync(avatarDir, { recursive: true });

    // 获取头像
    const res = await axios.get(`https://q1.qlogo.cn/g?b=qq&nk=${user_id}&s=640`, {
        responseType: 'arraybuffer',
        validateStatus: () => true, // 防止非200状态抛错
    });

    if (res.status === 200) {
        fs.writeFileSync(avatarPath, res.data);
        return avatarPath;
    } else {
        throw new Error(`头像下载失败，状态码: ${res.status}`);
    }
}