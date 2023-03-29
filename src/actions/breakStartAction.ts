import { Context } from "telegraf"
import { iAction } from "../interfaces/iAction"
import Logger, { LogType } from "../utils/Logger"

export async function breakStartAction(ctx:Context){
    if(!ctx.callbackQuery?.message)
        return Logger.send("ERROR: breakStartAction - ctx.callbackQuery?.message is undefined",LogType.ERROR)

    // ctx.deleteMessage(ctx.callbackQuery?.message?.message_id)
    ctx.editMessageText('Tudo bem...\nVocê pode retomar a conversa a qualquer momento enviando /start')
}

const BreakStartAction:iAction = {
    name:'break-start-action',
    description: 'Cancela a conversa iniciada pelo comando /start',
    from: 'start',
    function: breakStartAction,
}
export default BreakStartAction