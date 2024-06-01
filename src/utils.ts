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