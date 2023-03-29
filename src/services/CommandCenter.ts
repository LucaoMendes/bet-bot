import { Context , Telegraf } from 'telegraf'
import { Update } from 'typegram'
import { iCommand } from "../interfaces/iCommand"
import Logger, { LogType } from "../utils/Logger"

export class CommandCenter {
    private static commands: iCommand[] = []
    private static bot: Telegraf<Context<Update>>

    public static init(){
        this.bot = new Telegraf(process.env.BOT_TOKEN as string)

        this.commands.forEach(command => {
            if(command.command === 'start') this.bot.start(command.function)
            else if(command.command === 'help') this.bot.help(command.function)
            else this.bot.command(command.command, command.function)
        })

        this.bot.launch()
    }

    public static registerCommand(command: iCommand) {
        Logger.send(`Registrando comando ${command.command}`, LogType.INFO)
        if(!command || !command.command || !command.description || !command.function)
            return Logger.send(`Comando inválido ${JSON.stringify(command)}`,LogType.ERROR)
        this.commands.push(command)
    }

    public static executeCommand(commandName: string, ctx: Context) {
        const command:iCommand | undefined = this.commands.find(x => x.command === commandName)
        if (command) {
            command.function(ctx)
        }
    }

    public static getCommands(): iCommand[] {
        return this.commands
    }
}