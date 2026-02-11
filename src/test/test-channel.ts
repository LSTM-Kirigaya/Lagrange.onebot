import { mapper, LagrangeContext, PrivateMessage, GroupMessage, AddFriendOrGroupMessage, ApproveMessage } from '..';
import { qq_groups, qq_users } from './global';

export class TestChannel {
    @mapper.onPrivateUser(qq_users.JIN_HUI)
    async handleJinhui(c: LagrangeContext<PrivateMessage>) {
        const text = c.getRawText();
        console.log('[receive] ' + text);

        if (text.startsWith(':')) {
            const command = text.substring(1);
            switch (command) {
                case 'news':
                    // await getNews(c);
                    break;

                case 'ping':
                    c.sendMessage('ping');
                    break;

                case 'pub':
                    // await publishOpenMCP(c);
                    break;

                default:
                    break;
            }
        }

        c.finishSession();
    }

    @mapper.onGroup(qq_groups.TEST_CHANNEL, { at: true })
    async handleTestGroup(c: LagrangeContext<GroupMessage>) {
        const reply = c.message.message.filter(m => m.type === 'reply')[0];
        if (reply && typeof reply === 'object' && 'data' in reply && reply.data && typeof (reply.data as any).id === 'string') {
            const idStr = (reply.data as any).id as string;
            const parsed = parseInt(idStr, 10);
            if (!Number.isNaN(parsed)) {
                const res = await c.getMsg(parsed);
                if (res instanceof Error) {
                    return;
                }
                console.log(JSON.stringify(res.data.message, null, 2));
            }
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