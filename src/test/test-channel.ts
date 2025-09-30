import { mapper, LagrangeContext, PrivateMessage, GroupMessage, plugins, AddFriendOrGroupMessage, ApproveMessage } from '..';
import { qq_groups, qq_users } from './global';

export class TestChannel {
    @mapper.onPrivateUser(qq_users.JIN_HUI)
    async handleJinhui(c: LagrangeContext<PrivateMessage>) {
        // const msg = c.message.raw_message;
        // const reply = '你刚刚的回答是 ' + msg;
        // c.sendPrivateMsg(c.message.user_id, reply);
        // 和下面几种写法完全等价
        // c.sendPrivateMsg(1193466151, reply);
        // c.sendMessage(reply);

        const user_info = await c.getStrangerInfo(qq_users.JIN_HUI);
        if (!(user_info instanceof Error)) {
            
        }

        c.finishSession();
    }

    @mapper.onGroup(qq_groups.TEST_CHANNEL, { at: true })
    async handleTestGroup(c: LagrangeContext<GroupMessage>) {
        console.log(c.message.message);

        const reply = c.message.message.filter(m => m.type === 'reply')[0];
        if (reply) {
            const res = await c.getMsg(parseInt(reply.data.id));
            if (res instanceof Error) {
                return;
            }
            console.log(JSON.stringify(res.data.message, null, 2));
        }
    }

    @mapper.onAddFriendOrGroup()
    async handleTestGroupAdd(c: LagrangeContext<AddFriendOrGroupMessage>) {
        // c.message.user_id 加好友或者群的人的 qq
        // c.message.group_id 加群的群号
        // c.message.comment 加好友或者群的人的留言
        
        if (c.message.user_id === qq_users.JIN_HUI) {
            c.setGroupAddRequest(c.message.flag, c.message.sub_type, true);
        }
    }

    @mapper.onGroupIncrease(qq_groups.TEST_CHANNEL)
    async handleGroupIncrease(c: LagrangeContext<ApproveMessage>) {
        console.log(`user: ${c.message.user_id} join the group`);
    }
}