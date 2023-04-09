import { Context , Scenes, session, Telegraf } from 'telegraf'
import { message } from 'telegraf/filters'
import { WizardContext, WizardScene, WizardSessionData } from 'telegraf/typings/scenes'
import { iAction } from '../interfaces/iAction'
import { iCommand } from "../interfaces/iCommand"
import { iMiddleware } from '../interfaces/iMiddleware'
import { iScene } from '../interfaces/iScene'
import Logger, { LogType } from "../utils/Logger"
import User from '../models/User'

export class CommandCenter {
    private static commands: iCommand[] = []
    private static middlewares: iMiddleware[] = []
    private static actions: iAction[] = []
    private static scenes: iScene[] = []

    private static bot: Telegraf<Scenes.WizardContext>

    public static init(){
        this.bot = new Telegraf<Scenes.WizardContext>(process.env.BOT_TOKEN as string)
        
        //SessionMiddleware
        this.bot.use(session())

        //register commands,middlewares,actions,scenes,etc
        this.recognizeComponents()    
        

        //WTF msg function
        this.bot.on(message('text'),this.whatDidUSay)
        
        //Start bot
        this.bot.launch()

        process.once('SIGINT', () => this.bot.stop('SIGINT'))
        process.once('SIGTERM', () => this.bot.stop('SIGTERM'))
    }

    public static registerScene(scene: iScene) {
        Logger.send(`Registrando cena ${scene.name}`, LogType.INFO)

        if(!scene || !scene.name || !scene.description || !scene.scene)
            return Logger.send(`Cena inválida ${JSON.stringify(scene)}`,LogType.ERROR)
        
        this.scenes.push(scene)
    }

    public static registerAction(action: iAction) {
        Logger.send(`Registrando ação ${action.name}`, LogType.INFO)

        if(!action || !action.name || !action.description || !action.from || !action.function)
            return Logger.send(`Ação inválida ${JSON.stringify(action)}`,LogType.ERROR)
        
        this.actions.push(action)
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

    public static executeCommand(commandName: string, ctx: WizardContext<WizardSessionData>) {
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

        const tempScenes = this.scenes.reduce<WizardScene<Scenes.WizardContext>[]>((acc, scene) => {
            acc.push(scene.scene)
            return acc
        },[])

        if(tempScenes.length > 0){
            const stage = new Scenes.Stage(tempScenes)
            this.bot.use(stage.middleware())
        }        

        this.middlewares
            .sort((a, b) => b.priority - a.priority)
            .forEach(middleware => {
                this.bot.use(middleware.function)
            })

        this.actions.forEach(action => {
            this.bot.action(action.name, action.function)
        })
        
        this.commands.forEach(command => {
            if(command.command === 'start') this.bot.start(command.function)
            else if(command.command === 'help') this.bot.help(command.function)
            else this.bot.command(command.command, command.function)
            
        })
        
    }

    public static async sendUserMessage(user:User, message:string){
        try{
            await this.bot.telegram.sendMessage(user.chat_id,message,{ parse_mode: 'HTML' , disable_web_page_preview: true})
        }catch(e){
            Logger.send(`Erro ao enviar mensagem para o usuário ${user.chat_id}\n --> ${JSON.stringify(e)}`,LogType.ERROR)
        }
    }
}