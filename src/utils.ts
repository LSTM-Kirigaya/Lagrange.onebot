import { exec } from 'node:child_process';

import Logger from '@ptkdev/logger';

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
