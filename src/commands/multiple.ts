import { Context } from "telegraf"
import { iCommand } from "../interfaces/iCommand"
import { generateMultipleText, getMultipleByIdAndProfile } from "../utils/MultipleUtils"

async function multiplesCommand(ctx: Context){
    const { user, userProfile } : any = ctx.state
    if(!user){
        await ctx.reply(`Não foi possível realizar sua autenticação...`
                        + `\n\nEnvie /start para realizar o seu cadastro!`)
        return
    }

    if(!userProfile){
        await ctx.reply(`Você não possui um perfil de apostador configurado!`
                        + `\n\nEnvie /profile para configurar um perfil!`)
        return
    }

    const { text } : any = ctx.message

    if(!ctx.message || !text ){
        await ctx.reply(`Você precisa informar o número da múltipla que deseja verificar!`)
        return
    }
    
    if(isNaN(Number(text.split(' ')[1]))){
        await ctx.reply(`Você precisa informar um número válido!`)
        return
    }
    
    const multipleId = Number(text.split(' ')[1])

    const lastMessage = await ctx.reply(`Aguarde enquanto verifico a múltipla...`)

    
    const multiple = await getMultipleByIdAndProfile(multipleId,userProfile)

    if(!multiple){
        await ctx.telegram.editMessageText(
                                lastMessage.chat.id,
                                lastMessage.message_id,
                                undefined,
                                `Múltipla não encontrada, verifique suas múltiplas com /multiples!`)
        return
    }

    await ctx.telegram.editMessageText(
        lastMessage.chat.id,
        lastMessage.message_id,
        undefined,
        generateMultipleText(multiple),
        { parse_mode: 'HTML' , disable_web_page_preview: true })

}

const MultiplesCommand:iCommand = {
    description: '{Nº da múltipla} Verificar dados da múltipla',
    command: 'multiple',
    function: multiplesCommand,
}
export default MultiplesCommand