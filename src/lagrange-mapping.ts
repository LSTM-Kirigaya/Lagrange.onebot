import assert from 'assert';

import type * as Lagrange from './type';
import type { LagrangeContext } from './context';

export type MessageInvoker<T extends Lagrange.Message> = (context: LagrangeContext<T>) => Lagrange.Thenable<undefined | void | string | Lagrange.Send.Default>;
export type PrivateUserInvoker = MessageInvoker<Lagrange.PrivateMessage>;
export type GroupUserInvoker = MessageInvoker<Lagrange.GroupMessage>;

export type MessagePostInvoker = PrivateUserInvoker | GroupUserInvoker;


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


class LagrangeMapper {
    private _privateUserStorage: Map<number, MessageInvokerStorage<PrivateUserInvoker>>;
    private _groupStorage: Map<number, MessageInvokerStorage<GroupUserInvoker>>;

    constructor() {
        this._privateUserStorage = new Map<number, MessageInvokerStorage<PrivateUserInvoker>>();
        this._groupStorage = new Map<number, MessageInvokerStorage<GroupUserInvoker>>();
    }

    get privateUserStorage() {
        return this._privateUserStorage;
    }

    get groupStorage() {
        return this._groupStorage;
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

    public resolveNotice(c: LagrangeContext<Lagrange.NoticePostType>) {

    }

    public resolveRequest(c: LagrangeContext<Lagrange.RequestPostType>) {

    }
    
    public onPrivateUser(user_id: number) {
        const _this = this;        
        return function(target: any, propertyKey: string, descriptor: MapperDescriptor<PrivateUserInvoker>) {
            if (_this._privateUserStorage.has(user_id)) {
                console.warn(`${propertyKey} -> 用户 ${user_id} 已经被注册过了，该操作将覆盖原本的！`);
            }
            const invoker = descriptor.value;
            _this._privateUserStorage.set(user_id, { invoker });
        }
    }

    public onGroup(group_id: number, config?: OnGroupConfig) {
        const _this = this;
        return function(target: any, propertyKey: string, descriptor: MapperDescriptor<GroupUserInvoker>) {
            if (_this.groupStorage.has(group_id)) {
                console.warn(`${propertyKey} -> 群 ${group_id} 已经被注册过了，该操作将覆盖原本的！`);
            }
            const invoker = descriptor.value;
            _this.groupStorage.set(group_id, { invoker, config });
        }
    }
}

const lagMapper = new LagrangeMapper();
export default lagMapper;