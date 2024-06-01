import { mapper, LagrangeContext, PrivateMessage, plugins } from '../dist';

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
}