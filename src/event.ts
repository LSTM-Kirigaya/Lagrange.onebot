import lagrangeMapper from './lagrange-mapping';

import type * as Lagrange from './type';
import { LagrangeContext, LagrangeServer } from './context';
import { logger } from './utils';

class Pipe {
    server: LagrangeServer;

    public registerServer(server: LagrangeServer) {
        this.server = server;
    }

    public run(message: Lagrange.Message) {
        switch (message.post_type) {
            case 'message': this.messagePipe(message); break;
            case 'notice': this.noticePipe(message); break;
            case 'request':this.requestPipe(message); break;
            default: break;
        }
    }
    
    // 处理 message 类型的 post_type 消息
    public messagePipe(message: Lagrange.MessagePostType) {
        switch (message.message_type) {
            case 'private':
                lagrangeMapper.resolvePrivateUser(new LagrangeContext(message));
                break;
            case 'group':
                lagrangeMapper.resolveGroup(new LagrangeContext(message));
                break;
            default:
                break;
        }
    }
    
    // 处理 notice 类型的 post_type 消息
    public noticePipe(message: Lagrange.NoticePostType) {
        switch (message.notice_type) {
            case 'group_increase':
                lagrangeMapper.resolveGroupIncrease(new LagrangeContext(message));
                break;

            case 'offline_file':
                lagrangeMapper.resolveOfflineFile(new LagrangeContext(message));
                break;
        }
    }
    
    // 处理 request 类型的 post_type 消息
    public requestPipe(message: Lagrange.RequestPostType) {
        lagrangeMapper.resolveRequest(new LagrangeContext(message));
    }
}

export const pipe = new Pipe();

export function onMessage(event: Buffer) {
    const messageBuffer = event.toString('utf-8');
    const messageJson = JSON.parse(messageBuffer) as Lagrange.Message;
    // 忽略系统 message
    if (messageJson.post_type !== 'meta_event') {
        try {
            pipe.run(messageJson);
        } catch (error) {
            logger.error('pipe.run 调度时发生错误' + error);
        }
    }
}


export function onClose() {
    logger.info('lagrangeServer 服务器成功关闭')
}
