import { logger } from './utils';
import type * as Lagrange from './type';
import type { LagrangeContext } from './context';

export type MessageInvoker<T extends Lagrange.Message> = (context: LagrangeContext<T>) => Lagrange.Thenable<undefined | void | string | Lagrange.Send.Default>;
export type PrivateUserInvoker = MessageInvoker<Lagrange.PrivateMessage>;
export type GroupUserInvoker = MessageInvoker<Lagrange.GroupMessage>;
export type FileReceiveInvoker = MessageInvoker<Lagrange.FileMessage>;
export type GroupIncreaseInvoker = MessageInvoker<Lagrange.ApproveMessage>;
export type AddFriendOrGroupInvoker = MessageInvoker<Lagrange.AddFriendOrGroupMessage>;

export type MessagePostInvoker = PrivateUserInvoker | GroupUserInvoker | FileReceiveInvoker | GroupIncreaseInvoker | AddFriendOrGroupInvoker;


export interface MapperDescriptor<T extends MessagePostInvoker> {
    value?: T;
    configurable?: boolean;
    enumerable?: boolean;
    writable?: boolean;
    get?(): any;
    set?(v: any): void;
}

interface MessageInvokerStorage<T extends MessagePostInvoker> {
    invoker: T;
    config?: Record<string, any>
}

interface OnGroupConfig {
    at: boolean
}

interface OnFileReceiveConfig {
    ignoreWarning: boolean
}

interface OnAddFriendOrGroupConfig {
    ignoreWarning: boolean
}


class LagrangeMapper {
    private _privateUserStorage: Map<number, MessageInvokerStorage<PrivateUserInvoker>>;
    private _groupStorage: Map<number, MessageInvokerStorage<GroupUserInvoker>>;
    private _fileReceiveStorage: Set<MessageInvokerStorage<FileReceiveInvoker>>;
    private _groupIncreaseStorage: Map<number, MessageInvokerStorage<GroupIncreaseInvoker>>;
    private _addFriendOrGroupStorage: Set<MessageInvokerStorage<AddFriendOrGroupInvoker>>;

    constructor() {
        this._privateUserStorage = new Map<number, MessageInvokerStorage<PrivateUserInvoker>>();
        this._groupStorage = new Map<number, MessageInvokerStorage<GroupUserInvoker>>();
        this._fileReceiveStorage = new Set<MessageInvokerStorage<FileReceiveInvoker>>();
        this._groupIncreaseStorage = new Map<number, MessageInvokerStorage<GroupIncreaseInvoker>>();
        this._addFriendOrGroupStorage = new Set<MessageInvokerStorage<AddFriendOrGroupInvoker>>();
    }

    get privateUserStorage() {
        return this._privateUserStorage;
    }

    get groupStorage() {
        return this._groupStorage;
    }
    
    get fileReceiveStorage() {
        return this._fileReceiveStorage;
    }

    get groupIncreaseStorage() {
        return this._groupIncreaseStorage;
    }

    get addFriendOrGroupStorage() {
        return this._addFriendOrGroupStorage;
    }

    public resolvePrivateUser(c: LagrangeContext<Lagrange.PrivateMessage>) {
        const user_id = c.message.user_id;
        const userStorage = this._privateUserStorage.get(user_id);
        if (userStorage) {
            userStorage.invoker(c);
        }
    }

    public resolveGroup(c: LagrangeContext<Lagrange.GroupMessage>) {
        const group_id = c.message.group_id;
        const groupStorage = this._groupStorage.get(group_id);
        if (groupStorage) {
            const config = groupStorage.config || {};
            config.at = config.at || false;
            const msg = c.message;
            const firstSegment = msg.message[0];
            const robotQQ = c.qq + '';
            if (config.at && firstSegment.type === 'at' && firstSegment.data.qq === robotQQ) {
                msg.message = msg.message.slice(1);
                msg.raw_message = msg.raw_message.substring(11 + robotQQ.length);
                groupStorage.invoker(c);
            }
            if (!config.at) {
                groupStorage.invoker(c);
            }
        }
    }

    // 有新人入群
    public resolveGroupIncrease(c: LagrangeContext<Lagrange.ApproveMessage>) {
        const group_id = c.message.group_id;
        const storage = this.groupIncreaseStorage.get(group_id);
        if (storage) {
            storage.invoker(c);
        }
    }

    // 有人发送离线文件
    public resolveOfflineFile(c: LagrangeContext<Lagrange.FileMessage>) {
        for (const storage of this.fileReceiveStorage) {
            storage.invoker(c);
        }
    }
    
    // 加群或者好友的信号
    public resolveRequest(c: LagrangeContext<Lagrange.RequestPostType>) {
        for (const storage of this.addFriendOrGroupStorage) {
            storage.invoker(c);
        }
    }
    
    /**
     * @description 私聊用户响应函数的注册函数
     * @param user_id 私聊用户的 QQ 号码
     * @returns 
     */
    public onPrivateUser(user_id: number) {
        const _this = this;
        logger.warning    
        return function(target: any, propertyKey: string, descriptor: MapperDescriptor<PrivateUserInvoker>) {
            if (_this._privateUserStorage.has(user_id)) {
                logger.warning(`${propertyKey} -> 用户 ${user_id} 已经被注册过了，该操作将覆盖原本的！`);
            }
            const invoker = descriptor.value;
            _this._privateUserStorage.set(user_id, { invoker });
        }
    }

    /**
     * @description 群聊用户响应函数的注册函数
     * @param group_id 群聊的群号
     * @param config 响应配置
     * @returns 
     */
    public onGroup(group_id: number, config?: OnGroupConfig) {
        const _this = this;
        return function(target: any, propertyKey: string, descriptor: MapperDescriptor<GroupUserInvoker>) {
            if (_this.groupStorage.has(group_id)) {
                logger.warning(`${propertyKey} -> 群 ${group_id} 已经被注册过了，该操作将覆盖原本的！`);
            }
            const invoker = descriptor.value;
            _this.groupStorage.set(group_id, { invoker, config });
        }
    }

    /**
     * @description 接收文件的响应函数的注册，注册一次，全局响应
     * @returns 
     */
    public onFileReceive(config?: OnFileReceiveConfig) {
        const _this = this;
        config = config || { ignoreWarning: false };
        return function(target: any, propertyKey: string, descriptor: MapperDescriptor<FileReceiveInvoker>) {
            if (_this.fileReceiveStorage.size > 0 && !config.ignoreWarning) {
                logger.warning(`${propertyKey} -> 文件接受管线已经注册，如果你真的希望同时调用多个 onFileReceive，考虑使用 @onFileReceive({ ignoreWarning: true })`);
            }
            const invoker = descriptor.value;
            _this.fileReceiveStorage.add({ invoker });
        }
    }


    /**
     * @description 新人入群的响应函数的注册
     * @param group_id 发生新人入群事件的群号
     */
    public onGroupIncrease(group_id: number) {
        const _this = this;
        return function(target: any, propertyKey: string, descriptor: MapperDescriptor<GroupIncreaseInvoker>) {
            if (_this.groupIncreaseStorage.has(group_id)) {
                logger.warning(`${propertyKey} -> 群 ${group_id} 已经被注册过了，该操作将覆盖原本的！`);
            }
            const invoker = descriptor.value;
            _this.groupIncreaseStorage.set(group_id, { invoker });
        }
    }

    /**
     * @description 有人想要入群或者加机器人好友的申请事件响应函数，注册一次，全局响应
     */
    public onAddFriendOrGroup(config?: OnAddFriendOrGroupConfig) {
        const _this = this;
        config = config || { ignoreWarning: false };
        return function(target: any, propertyKey: string, descriptor: MapperDescriptor<AddFriendOrGroupInvoker>) {
            if (_this.addFriendOrGroupStorage.size > 0 && !config.ignoreWarning) {
                logger.warning(`${propertyKey} -> 加好友/加群接受管线已经注册，如果你真的希望同时调用多个 onAddFriendOrGroup，考虑使用 @onAddFriendOrGroup({ ignoreWarning: true })`);
            }
            const invoker = descriptor.value;
            _this.addFriendOrGroupStorage.add({ invoker });
        }
    }
}

const lagMapper = new LagrangeMapper();
export default lagMapper;