import { Composer, Markup, Scenes } from "telegraf"
import { message } from "telegraf/filters"
import { WizardContext } from "telegraf/typings/scenes"
import { iScene } from "../interfaces/iScene"

const confirmeMarkup = Markup.inlineKeyboard([
    [
        Markup.button.callback("Cancelar",'cancel'),
        Markup.button.callback("Próximo",'next'),
    ],
    [
        Markup.button.callback("Sair da configuração",'exit'),
    ]
])
const exitMarkup = Markup.inlineKeyboard([
    Markup.button.callback("Sair da configuração",'exit'),
],)
const teamPriorityMarkup = Markup.inlineKeyboard([
    [
        Markup.button.callback("Somente casa",'home-priority'),
        Markup.button.callback("Somente fora",'away-priority'),
    ],
    [
        Markup.button.callback("Ambos",'both-priority'),
    ],
    [
        Markup.button.callback("Sair da configuração",'exit'),
    ]
])
//Passos
const startScene = new Composer<Scenes.WizardContext>()
const selectMinOdd = new Composer<Scenes.WizardContext>()
const selectMaxOdd = new Composer<Scenes.WizardContext>()
const selectTeamPriority = new Composer<Scenes.WizardContext>()
const selectMaxMatches = new Composer<Scenes.WizardContext>()
const selectValue = new Composer<Scenes.WizardContext>()

//Seleção da odd Minima para múltiplas
startScene.use(async ctx => {
    const profile = {
        user: ctx.state.user,
        minOdd: 1.0,
        maxOdd: 1.5,
    }

    ctx.scene.state = {
        profile,
    }

    if(!profile.user){
        await ctx.reply(`Por algum motivo não conseguir realizar sua autenticação\n`
                        +`Por favor, tente novamente mais tarde`)
        return ctx.scene.leave()
    }
    await ctx.reply('Configurações do perfil de apostador')
    await ctx.reply(`Selecione a odd mínima para as múltiplas:`)
    return ctx.wizard.next()
})

//Quando o usuário enviar o número da odd minima
selectMinOdd.hears(/(\d)/, async (ctx) => {
    const minOdd = ctx.message.text
    const { profile }: any = ctx.scene.state

    if(minOdd.includes(','))
        minOdd.replace(',','.')

    if(!isNaN(Number(minOdd))){
        profile.minOdd = Number(Number(minOdd).toFixed(3))
        const oldOdd = profile.minOdd

        if(profile.minOdd >= 1 && profile.minOdd <= 9.5){
            if(Object.keys(ctx.scene.state).includes('lastMessage')){
                const { lastMessage }: any = ctx.scene.state

                await ctx.telegram.editMessageText(
                    lastMessage.chat.id,
                    lastMessage.message_id,
                    undefined,
                    `Odd mínima para as múltiplas: ${oldOdd}`
                )
            }

            const message = await ctx.reply(`Odd mínima para as múltiplas: ${minOdd}\n`
                                            + `Deseja continuar?`,confirmeMarkup)

            ctx.scene.state = {
                ...ctx.scene.state,
                lastMessage: message,
            }
            return
        }
    }else {
        await ctx.reply('Digite um número válido\n'
                        +'Caso deseja cancelar clique no botão abaixo',exitMarkup)
        return
    }
    await ctx.reply('A odd mínima deve ser maior que 1.0 e menor que 9.5\n'
                     +'Caso deseja cancelar clique no botão abaixo',exitMarkup)
    return
})

selectMinOdd.action('next', async (ctx) => {
    const { profile } : any = ctx.scene.state
    await ctx.editMessageText(`Odd minima selecionada: ${profile.minOdd}`)
    await ctx.reply(`Selecione a odd máxima para as múltiplas:`)
    return ctx.wizard.next()
})


selectMinOdd.on(message('text'), async (ctx) => {
    await ctx.reply('Digite um número válido\n'
                    +'Caso deseja cancelar clique no botão abaixo',exitMarkup)
})


selectMaxOdd.hears(/(\d)/, async (ctx) => {
    const maxOdd = ctx.message.text
    const { profile }: any = ctx.scene.state

    if(maxOdd.includes(','))
        maxOdd.replace(',','.')

    if(!isNaN(Number(maxOdd))){

        const minOdd = profile.minOdd
        const oldOdd = profile.maxOdd
        profile.maxOdd = Number(Number(maxOdd).toFixed(3))

        if(profile.maxOdd >= (minOdd + 0.5) && profile.maxOdd <= 10){
            if(Object.keys(ctx.scene.state).includes('lastMessage')){

                const { lastMessage }: any = ctx.scene.state

                if(lastMessage.step === 'maxOdd')
                    await ctx.telegram.editMessageText(
                        lastMessage.chat.id,
                        lastMessage.message_id,
                        undefined,
                        `Odd máxima para as múltiplas: ${oldOdd}`
                    )
            }

            const message = {
                ...await ctx.reply(`Odd máxima para as múltiplas: ${maxOdd}\n`
                                    + `Deseja continuar?`,confirmeMarkup),
                step: 'maxOdd'
            }
            
            ctx.scene.state = {
                ...ctx.scene.state,
                lastMessage: message,
            }
            return
        }
    }else {
        await ctx.reply('Digite um número válido\n'
                        +'Caso deseja cancelar clique no botão abaixo',exitMarkup)
        return
    }
    await ctx.reply(`A odd máxima deve ser maior que ${profile.minOdd + 0.5} e menor que 10`,exitMarkup)
    return
})

selectMaxOdd.action('next', async (ctx) => {
    const { profile } : any = ctx.scene.state
    await ctx.editMessageText(`Odd maxima selecionada: ${profile.maxOdd}`)
    await ctx.reply(`Selecione a prioridade para os times favoritos das múltiplas:`,teamPriorityMarkup)
    return ctx.wizard.next()
})

selectMaxOdd.use((ctx) => ctx.reply('Digite um número válido\n'
                                    +'Caso deseja cancelar clique no botão abaixo',exitMarkup))

const teamPriorityStep = async (ctx:WizardContext,priorityValue:string) => {
    const { profile } : any = ctx.scene.state
    
    let priorityText = null
    if(priorityValue === 'home-priority'){
        priorityText = 'Somente times jogando em casa'
    }else if(priorityValue === 'away-priority'){
        priorityText = 'Somente times jogando fora'
    }else if(priorityValue === 'both-priority'){
        priorityText = 'Ambos os times'
    }else{
        await ctx.editMessageText(  'Selecione a prioridade para os times favoritos das múltiplas!\n'
                                    + 'Caso deseja cancelar clique no botão abaixo ',exitMarkup)
        return
    }

    profile.teamPriority = priorityValue

    ctx.scene.state = {
        profile,
    }


    await ctx.editMessageText(`Prioridade par as múltiplas: ${priorityText} `)
    await ctx.reply(`Qual será a quantidade máxima de jogos que você quer nas múltiplas?\n`
                    +`Escolha um número de 2 a 5`)
    return ctx.wizard.next()
}

selectTeamPriority.action('home-priority', async (ctx) => teamPriorityStep(ctx,'home-priority'))
selectTeamPriority.action('away-priority', async (ctx) => teamPriorityStep(ctx,'away-priority'))
selectTeamPriority.action('both-priority', async (ctx) => teamPriorityStep(ctx,'both-priority'))


selectTeamPriority.use(async (ctx) => await ctx.reply(  'Digite um número válido\n'
                                                        +'Caso deseja cancelar clique no botão abaixo',exitMarkup))

selectMaxMatches.hears(/(\d)/, async (ctx) => {
    const maxMatches = ctx.match[1]
    const { profile }: any = ctx.scene.state

    if(!isNaN(Number(maxMatches))){

        const oldMaxMatches = profile.maxMatches
        profile.maxMatches = Number(maxMatches)

        if(profile.maxMatches >= 2 && profile.maxMatches <= 10){
            if(Object.keys(ctx.scene.state).includes('lastMessage')){

                const { lastMessage }: any = ctx.scene.state
                if(lastMessage.step === 'maxMatches')
                    await ctx.telegram.editMessageText(
                        lastMessage.chat.id,
                        lastMessage.message_id,
                        undefined,
                        `Quantidade máxima de partida nas múltiplas: ${oldMaxMatches}`)
            }

            const message = {
                ...await ctx.reply(`Quantidade máxima de partida nas múltiplas: ${profile.maxMatches}\n`
                                    + `Deseja continuar?`,confirmeMarkup),
                step: 'maxMatches'
            }

            ctx.scene.state = {
                ...ctx.scene.state,
                lastMessage: message,
            }
            return
        }
    }else {
        await ctx.reply('Digite um número válido\n'
                        +'Caso deseja cancelar clique no botão abaixo',exitMarkup)
        return
    }
    await ctx.reply(`A quantidade máxima de partida ser maior que 2 e menor que 10\n`
                    +'Caso deseja cancelar clique no botão abaixo',exitMarkup)
    return
})

selectMaxMatches.action('next', async (ctx) => {
    const { profile }: any = ctx.scene.state

    await ctx.editMessageText(`Quantidade máxima de partida nas múltiplas: ${profile.maxMatches}\n`)
    await ctx.reply('Quanto você deseja investir nessas múltiplas?')

    return ctx.wizard.next()
})


selectMaxMatches.use(async (ctx) => await ctx.reply('Digite um número válido\n'
                                                    +'Caso deseja cancelar clique no botão abaixo',exitMarkup))


selectValue.hears(/(\d+)/, async (ctx) => {
    const betValue = ctx.message.text
    const { profile }: any = ctx.scene.state

    if(betValue.includes(','))
        betValue.replace(',','.')

    if(!isNaN(Number(betValue))){

        const oldBetValue = profile.betValue
        profile.betValue = Number(Number(betValue).toFixed(2))

        if(profile.betValue >= 0.75 && profile.betValue <= 100000){
            if(Object.keys(ctx.scene.state).includes('lastMessage')){

                const { lastMessage }: any = ctx.scene.state

                if(lastMessage.step === 'betValue')
                    await ctx.telegram.editMessageText(
                        lastMessage.chat.id,
                        lastMessage.message_id,
                        undefined,
                        `Valor das apostas: ${oldBetValue}`)
            }

            const message = {
                ...await ctx.reply(`Valor das apostas: R$ ${Number(profile.betValue.toFixed(2)).toLocaleString()}\n`
                                    + `Deseja continuar?`,confirmeMarkup),
                step: 'betValue'
            }

            ctx.scene.state = {
                ...ctx.scene.state,
                lastMessage: message,
            }
            return
        }
    }else {
        await ctx.reply('Digite um número válido'
                        +'\nCaso deseja cancelar clique no botão abaixo',exitMarkup)
        return
    }
    await ctx.reply(`O valor da aposta deve ser maior que 0.75 e menor que 100 000`
                    +'\nCaso deseja cancelar clique no botão abaixo',exitMarkup)
    return
})

selectValue.action('next', async (ctx) => {
    const { profile }: any = ctx.scene.state

    await ctx.editMessageText(`Valor das apostas: ${profile.maxMatches}\n`)

    await ctx.reply(`${profile.user.first_name} seu perfil de apostas foi configurado com sucesso!\n`
                    +`Você pode alterar suas configurações a qualquer momento com o comando /profile\n`
                    +`Saiba mais em /help`)	
    return ctx.scene.leave()
})

selectValue.use(async (ctx) => await ctx.reply('Digite um número válido'
+'\nCaso deseja cancelar clique no botão abaixo',exitMarkup))

const profileConfigScene = new Scenes.WizardScene<Scenes.WizardContext>(
    'profileConfigScene', // first argument is Scene_ID, same as for BaseScene
    startScene, 
    selectMinOdd, 
    selectMaxOdd,
    selectTeamPriority,
    selectMaxMatches,
    selectValue)

const ProfileConfigScene:iScene = {
    name: 'profileConfigScene',
    description: 'Configuração de perfil de apostador',
    scene: profileConfigScene
}

profileConfigScene.action('exit', async (ctx) =>{
    if(ctx.callbackQuery.message && Object.keys(ctx.callbackQuery.message).includes('reply_markup')){
        await ctx.editMessageText('Saiu da configuração de perfil de apostador')
    }else{
        await ctx.reply('Saiu da configuração de perfil de apostador')
    }
    await ctx.scene.leave()
})
profileConfigScene.action('not-exit', async (ctx) =>{
    if(ctx.callbackQuery.message && Object.keys(ctx.callbackQuery.message).includes('reply_markup')){
        await ctx.editMessageReplyMarkup(undefined)
    }
 })


export default ProfileConfigScene
