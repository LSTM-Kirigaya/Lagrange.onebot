import { mapper, LagrangeContext, PrivateMessage, GroupMessage, plugins, AddFriendOrGroupMessage, ApproveMessage } from '../dist';

export class Impl {

    @mapper.onPrivateUser(1193466151)
    async handleJinhui(c: LagrangeContext<PrivateMessage>) {
        // const msg = c.message.raw_message;
        // const reply = '你刚刚的回答是 ' + msg;
        // c.sendPrivateMsg(c.message.user_id, reply);
        // 和下面几种写法完全等价
        // c.sendPrivateMsg(1193466151, reply);
        // c.sendMessage(reply);

        const user_info = await c.getStrangerInfo(1193466151);
        if (!(user_info instanceof Error)) {
            
        }

        c.finishSession();
    }

    @mapper.onGroup(956419963, { at: true })
    async handleTestGroup(c: LagrangeContext<GroupMessage>) {
        const allGroupMemberInfo = await c.getGroupMemberList(956419963);
        console.log(allGroupMemberInfo);

        const user_id = c.message.user_id;
        const user_info = await c.getStrangerInfo(user_id);
        console.log(user_info);
    }

    @mapper.onAddFriendOrGroup()
    async handleTestGroupAdd(c: LagrangeContext<AddFriendOrGroupMessage>) {
        // c.message.user_id 加好友或者群的人的 qq
        // c.message.group_id 加群的群号
        // c.message.comment 加好友或者群的人的留言
        
        if (c.message.user_id === 1193466151) {
            c.setGroupAddRequest(c.message.flag, c.message.sub_type, true);
        }
    }

    @mapper.onGroupIncrease(956419963)
    async handleGroupIncrease(c: LagrangeContext<ApproveMessage>) {
        console.log(`user: ${c.message.user_id} join the group`);
        
    }
}