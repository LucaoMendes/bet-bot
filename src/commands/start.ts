import { Context, Markup } from "telegraf"
import UserController from "../controllers/UserController"
import { iCommand } from "../interfaces/iCommand"
import Logger, { LogType } from "../utils/Logger"

async function startCommand(ctx:Context){

    if(!ctx.from){
        Logger.send('Erro ao obter o nome do usuário',LogType.ERROR)
        await ctx.reply('Erro ao obter o nome do usuário')
        return
    }
    
    if(ctx.state.data){
        await ctx.reply(
            `Olá ${ctx.from.first_name}, tudo bem?`+
            `\nVocê já está cadastrado!` +
            `\nEnvie /help para ver os comandos disponíveis!` +
            `\n\nDeseja configurar seu perfil de apostas para começar a receber minhas analises?`,
            startCommandMarkupInlineButtons)
        return
    }
    
    UserController.save(ctx)
        .then(async (response)=>{
            if(response.status === 'created'){
                await ctx.reply(`Olá ${response.data.first_name}, tudo bem?`+
                                `\nRealizamos seu cadastro com sucesso!` +
                                `\n\nDeseja configurar seu perfil de apostas para começar a receber minhas analises?`,
                                startCommandMarkupInlineButtons)
                return
            }

            await ctx.reply('Ocorreu um erro ao realizar o seu cadastro :(')
        })
}

const startCommandMarkupInlineButtons = Markup.inlineKeyboard([
                                            Markup.button.callback("Sim",'start-profile-config'),
                                            Markup.button.callback("Não", 'break-start-action'),
                                        ],)

const StartCommand:iCommand = {
    description: 'Inicia a conversação',
    command: 'start',
    function: startCommand
}
export default StartCommand