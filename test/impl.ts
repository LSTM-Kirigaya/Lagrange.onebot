import { mapper, LagrangeContext, PrivateMessage, GroupMessage, plugins } from '../dist';

export class Impl {

    @mapper.onPrivateUser(1193466151)
    @plugins.use('echo')
    async handleJinhui(c: LagrangeContext<PrivateMessage>) {
        const msg = c.message.raw_message;
        const reply = '你刚刚的回答是 ' + msg;
        c.sendPrivateMsg(c.message.user_id, reply);
        // 和下面几种写法完全等价
        // c.sendPrivateMsg(1193466151, reply);
        // c.sendMessage(reply);

        c.finishSession();
    }

    @mapper.onGroup(956419963, { at: true })
    @plugins.use('echo')
    async handleTestGroup(c: LagrangeContext<GroupMessage>) {
        c.sendMessage('你刚刚发送了' + c.message.raw_message);
    }
}