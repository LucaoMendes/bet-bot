import { Context , Telegraf } from 'telegraf'
import { message } from 'telegraf/filters'
import { Update } from 'typegram'
import { iCommand } from "../interfaces/iCommand"
import { iMiddleware } from '../interfaces/iMiddleware'
import Logger, { LogType } from "../utils/Logger"

export class CommandCenter {
    private static commands: iCommand[] = []
    private static middlewares: iMiddleware[] = []
    private static bot: Telegraf<Context<Update>>

    public static init(){
        this.bot = new Telegraf(process.env.BOT_TOKEN as string)

        //register commands,middlewares,actions,scenes,etc
        this.recognizeComponents()        

        //WTF msg function
        this.bot.on(message('text'),this.whatDidUSay)
        
        //Start bot
        this.bot.launch()

        process.once('SIGINT', () => this.bot.stop('SIGINT'))
        process.once('SIGTERM', () => this.bot.stop('SIGTERM'))
    }


    public static registerMiddleware(middleware: iMiddleware) {
        Logger.send(`Registrando middleware ${middleware.name}`, LogType.INFO)

        if(!middleware || !middleware.name || !middleware.description || !middleware.function)
            return Logger.send(`Middleware inválido ${JSON.stringify(middleware)}`,LogType.ERROR)

        this.middlewares.push(middleware)
    }

    public static registerCommand(command: iCommand) {
        Logger.send(`Registrando comando ${command.command}`, LogType.INFO)

        if(!command || !command.command || !command.description || !command.function)
            return Logger.send(`Comando inválido ${JSON.stringify(command)}`,LogType.ERROR)

        this.commands.push(command)
    }

    public static executeCommand(commandName: string, ctx: Context) {
        Logger.send(`Executando comando ${commandName} para [${ctx.from?.id}] ${ctx.from?.first_name}`, LogType.INFO)
        const command:iCommand | undefined = this.commands.find(x => x.command === commandName)

        if (command && command.function)
            return command.function(ctx)

        Logger.send(`Comando ${commandName} não encontrado`, LogType.ERROR)
        throw new Error(`COMMAND CENTER - ${this.commands}`)
    }

    public static whatDidUSay(ctx: Context) {
        return ctx.reply('Desculpe... Não entendi oque você disse :(')
    }

    public static getCommands(): iCommand[] {
        return this.commands
    }

    private static recognizeComponents(){
        this.middlewares
            .sort((a, b) => b.priority - a.priority)
            .forEach(middleware => {
                this.bot.use(middleware.function)
            })

        this.commands.forEach(command => {
            if(command.command === 'start') this.bot.start(command.function)
            else if(command.command === 'help') this.bot.help(command.function)
            else this.bot.command(command.command, command.function)
            
        })
    }
}