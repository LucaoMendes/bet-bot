import { Scenes } from "telegraf"
import Logger, { LogType } from "./Logger"

export async function removeLastMessageMarkup(ctx:Scenes.WizardContext,step:any,ignoreSteps = false){
    if(Object.keys(ctx.scene.state).includes('lastMessage')){
        Logger.send(`Removendo markup da mensagem de ${step} para ${ctx.from?.username}`)

        let { lastMessage }: any = ctx.scene.state

        if(lastMessage.step === step || ignoreSteps){
            lastMessage = await ctx.telegram.editMessageReplyMarkup(
                            lastMessage.chat.id,
                            lastMessage.message_id,
                            undefined,
                            undefined)
            return {
                ...ctx.scene.state,
                lastMessage,
            }
        }else{
            Logger.send('Não foi possivel remover a markup pois o step não é o mesmo')
        }
    }else{
        Logger.send(`Não foi possivel remover a mensagem ${step} não existe`)
    }

    return {
        ...ctx.scene.state,
    }
}

export async function deleteLastMessage(ctx:Scenes.WizardContext,step:any,ignoreSteps = false){
    if(Object.keys(ctx.scene.state).includes('lastMessage')){
        Logger.send(`Deletando mensagem de ${step} para ${ctx.from?.username}`)

        const { lastMessage }: any = ctx.scene.state

        if(lastMessage.step === step || ignoreSteps){
            await ctx.telegram.deleteMessage(lastMessage.chat.id,lastMessage.message_id)
            return {
                ...ctx.scene.state,
                lastMessage: undefined,
            }
        }else{
            Logger.send('Não foi possivel deletar a mensagem pois o step não é o mesmo')
        }
    }else{
        Logger.send(`Não foi possivel deletar a mensagem ${step} não existe`)
    }

    return {
        ...ctx.scene.state,
    }
}

export async function editLastMessageText(ctx:Scenes.WizardContext,step:any,message:string,removeMarkups = false,ignoreSteps = false){
    if(Object.keys(ctx.scene.state).includes('lastMessage')){
        Logger.send(`Editando mensagem de ${step} para ${message} para ${ctx.from?.username} ${removeMarkups ? 'removendo markups' : 'mantendo markups'}`)

        let { lastMessage } : any = ctx.scene.state

        if(lastMessage.text === message){
            Logger.send(`Mensagem já é igual a ${message} ${step}`,LogType.WARNING)

            return {
                ...ctx.scene.state,
                lastMessage,
            }
        }

        if(lastMessage.step === step || ignoreSteps){
            if(removeMarkups)
                lastMessage = await ctx.telegram.editMessageText(
                    lastMessage.chat.id,
                    lastMessage.message_id,
                    undefined,
                    message,
                    undefined
                    )
            else
                lastMessage = await ctx.telegram.editMessageText(
                    lastMessage.chat.id,
                    lastMessage.message_id,
                    undefined,
                    message
                    )
            lastMessage.step = step     
            
            return {
                ...ctx.scene.state,
                lastMessage,
            }
        }else{
            Logger.send('Não foi possivel editar a mensagem pois o step não é o mesmo')
        }
    }else{
        Logger.send(`Não foi possivel editar a mensagem ${step} para ${message}`)
    }

    return {
        ...ctx.scene.state,
    }
}

export async function sendMessageWithMarkup(ctx:Scenes.WizardContext,step:any,message:string,markup:any){
    Logger.send(`Enviando mensagem de ${step} para ${message} com markup para ${ctx.from?.username}`)
    const lastMessage:any = await ctx.reply(message,markup)
    
    lastMessage.step = step

    return {
        ...ctx.scene.state,
        lastMessage,
    } 
}

export async function sendMessageText(ctx:Scenes.WizardContext,step:any,message:string){
    Logger.send(`Enviando mensagem de ${step} para ${message} sem markup para ${ctx.from?.username}`)
    const lastMessage:any = await ctx.reply(message,{ parse_mode: 'HTML'} )
    
    lastMessage.step = step

    return {
        ...ctx.scene.state,
        lastMessage,
    } 
}