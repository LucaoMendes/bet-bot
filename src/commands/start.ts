import { Context } from "telegraf"
import { iCommand } from "../interfaces/iCommand"
import Logger, { LogType } from "../utils/Logger"

function startCommand(ctx:Context){
    if(!ctx.from){
        Logger.send('Erro ao obter o nome do usuário',LogType.ERROR)
        return ctx.reply('Erro ao obter o nome do usuário')
    }
    ctx.reply('Bem vindo ' + ctx.from.first_name + '!')
}
const StartCommand:iCommand = {
    description: 'Inicia a conversação',
    command: 'start',
    function: startCommand
}
export default StartCommand