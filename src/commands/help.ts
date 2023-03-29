import { Context } from "telegraf"
import { iCommand } from "../interfaces/iCommand"
import { CommandCenter } from "../services/CommandCenter"

function helpCommand(ctx:Context){
    const commands = CommandCenter.getCommands()

    let message = 'Comandos disponíveis:\n'
    commands.forEach(command => {
        message += `/${command.command} - ${command.description}\n`
    })

    ctx.reply(message)
}
const HelpCommand:iCommand = {
    description: 'Mostra os comandos disponíveis',
    command: 'help',
    function: helpCommand,
}
export default HelpCommand