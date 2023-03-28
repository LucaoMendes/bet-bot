import { Context } from "telegraf"
import { iCommand } from "../interfaces/iCommand"

function helpCommand(ctx:Context){
    ctx.reply('/start - Iniciar conversação ')
}
const HelpCommand:iCommand = {
    command: 'help',
    function: helpCommand
}
export default HelpCommand