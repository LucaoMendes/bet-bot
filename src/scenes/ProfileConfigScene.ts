import { Composer, Markup, Scenes } from "telegraf"
import { iScene } from "../interfaces/iScene"
import { deleteLastMessage, editLastMessageText, sendMessageText, sendMessageWithMarkup } from "../utils/SceneUtils"
import Logger, { LogType } from "../utils/Logger"
import UserProfileController from "../controllers/UserProfileController"


enum eSteps{
    START = 'start_step',
    MIN_ODD = 'min_odd_step',
    MAX_ODD = 'max_odd_step',
    MAX_MULTIPLE = 'max_multiple_step',
    TEAM_PRIORITY = 'team_priority_step',
    BET_VALUE = 'bet_value_step',
    EXIT = 'exit_step',
}

enum eTeamPriority{
    HOME = 'home-priority',
    AWAY = 'away-priority',
    BOTH = 'both-priority',
}


const limits = {
    MIN_ODD: 1,
    MAX_ODD: 10,
    MIN_MULTIPLE: 2,
    MAX_MULTIPLE: 10,
    MIN_BET_VALUE: 1,
    MAX_BET_VALUE: 100000,
    MIN_DIFFERENCE: 0.5,
}

const yesOrNoMarkup = Markup.inlineKeyboard([
    Markup.button.callback("Sim",'continue-update'),
    Markup.button.callback("Não",'exit'),
],)

const confirmeMarkup = Markup.inlineKeyboard([
    [
        Markup.button.callback("Cancelar",'cancel'),
        Markup.button.callback("Próximo",'next'),
    ],
    [
        Markup.button.callback("Sair da configuração",'exit'),
    ]
])

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


const startStep = new Composer<Scenes.WizardContext>()
const startSelectContinueStep = new Composer<Scenes.WizardContext>()
const selectMinOdd = new Composer<Scenes.WizardContext>()
const selectMaxOdd = new Composer<Scenes.WizardContext>()
const selectTeamPriority = new Composer<Scenes.WizardContext>()
const selectMaxMultiples = new Composer<Scenes.WizardContext>()
const selectBetValue = new Composer<Scenes.WizardContext>()

const profileConfigScene = new Scenes.WizardScene<Scenes.WizardContext>(
    'profileConfigScene', 
    startStep,
    startSelectContinueStep,
    selectMinOdd,
    selectMaxOdd,
    selectTeamPriority,
    selectMaxMultiples,
    selectBetValue
    )

const ProfileConfigScene:iScene = {
    name: 'profileConfigScene',
    description: 'Configuração de perfil de apostador',
    scene: profileConfigScene
}

profileConfigScene.action('exit', async (ctx) =>{
    Logger.send('Saindo da configuração de perfil de apostador',LogType.INFO)
    if(ctx.callbackQuery.message && Object.keys(ctx.callbackQuery.message).includes('reply_markup')){
        ctx.scene.state = await editLastMessageText(ctx,eSteps.EXIT,'Saiu da configuração de perfil de apostador',true,true)
    }else{
        ctx.scene.state = await sendMessageText(ctx,eSteps.EXIT,'Saiu da configuração de perfil de apostador')
    }
    await ctx.scene.leave()
})


startStep.use(async ctx => {
    //Primeiro passo, Verificar se há estrategia de apostas
    //SE sim perguntar se quer realizar alterações
    const profile = {
        user: ctx.state.user,
        oddProfile: ctx.state.userProfile,
        minOdd: 1.0,
        maxOdd: 1.5,
    }

    ctx.scene.state = {
        ...ctx.scene.state,
        profile
    }
    if(!profile.user){
        await sendMessageText(ctx,eSteps.START,
                `Por algum motivo não conseguir realizar sua autenticação\nPor favor, tente novamente mais tarde`)
        return ctx.scene.leave()
    }

    if(profile.oddProfile){

        const resumeText = extractResumeProfile(ctx,true)
        const profileText = `Seu perfil de apostador já está configurado\n\n`
                            + resumeText

        await sendMessageText(ctx,eSteps.START,profileText)


        ctx.scene.state = await sendMessageWithMarkup(ctx,eSteps.START,'Deseja atualizar suas configurações?',yesOrNoMarkup)
        return ctx.wizard.next()
    }

    ctx.scene.state = await sendMessageWithMarkup(ctx,eSteps.START,
                                `Seu perfil de apostador ainda não está configurado\nDeseja configurar agora?`,
                                yesOrNoMarkup)
    return ctx.wizard.next()
})



startSelectContinueStep.action('continue-update', async (ctx) => { 
    //Se ele quiser atualizar, remover a mensagem de confirmação e ir para o primeiro passo da seleção da odd
    await deleteLastMessage(ctx,eSteps.START)
    await sendMessageText(ctx,eSteps.START,'Configurações do perfil de apostador')
    await sendMessageText(ctx,eSteps.START,'Selecione a odd mínima para as múltiplas:')

    await ctx.wizard.next()
})

selectMinOdd.hears(/(\d)/, async (ctx) => {
    let minOdd:any = ctx.message.text
    const { profile } : any = ctx.scene.state

    if(!profile){
        await sendMessageText(ctx,eSteps.MIN_ODD,'Tivemos um erro ao buscar os dados do seu perfil\nPor favor, tente novamente mais tarde')
        Logger.send(`PROFILE UNDEFINED, ${profile}`,LogType.ERROR)
        return ctx.scene.leave()
    }

    if(minOdd.includes(','))
        minOdd = minOdd.replace(',','.')

    minOdd = Number(minOdd)

    if(isNaN(minOdd)){
        await updateLastMessage()
        Logger.send(`MIN ODD NAN, ${minOdd}`,LogType.ERROR)
        return await sendMessageText(ctx,eSteps.MIN_ODD,'Número inválido...\nTente novamente')
    }

    if(minOdd < limits.MIN_ODD || minOdd > limits.MAX_ODD - limits.MIN_DIFFERENCE){
        await updateLastMessage()
        return await sendMessageText(ctx,eSteps.MIN_ODD,`Número inválido...\nTente novamente\nValor mínimo: ${limits.MIN_ODD}\nValor máximo: ${limits.MAX_ODD - limits.MIN_DIFFERENCE}`)
    }
    await updateLastMessage()
    profile.minOdd = minOdd
    ctx.scene.state = await sendMessageWithMarkup(ctx,eSteps.MIN_ODD,
                            `Odd mínima para as múltiplas: ${minOdd}\nDeseja continuar?`,
                            confirmeMarkup)

    ctx.scene.state = {
        ...ctx.scene.state,
        profile
    }


    async function updateLastMessage(){
        ctx.scene.state = await editLastMessageText(ctx,eSteps.MIN_ODD,`Odd mínima para as múltiplas: ${profile.minOdd}`,true)
    }
})

selectMinOdd.action('next', async (ctx) => {
    const { profile } : any = ctx.scene.state

    if(!profile){
        await sendMessageText(ctx,eSteps.MIN_ODD,'Tivemos um erro ao buscar os dados do seu perfil\nPor favor, tente novamente mais tarde')
        Logger.send(`PROFILE UNDEFINED, ${profile}`,LogType.ERROR)
        return ctx.scene.leave()
    }

    await editLastMessageText(ctx,eSteps.MIN_ODD,`Odd mínima para as múltiplas: ${profile.minOdd}`,true)
    await sendMessageText(ctx,eSteps.MIN_ODD,'Selecione a odd máxima para as múltiplas:')

    return ctx.wizard.next()
})

selectMaxOdd.hears(/(\d)/, async (ctx) => {
    let maxOdd:any = ctx.message.text
    const { profile } : any = ctx.scene.state

    if(!profile){
        await sendMessageText(ctx,eSteps.MAX_ODD,'Tivemos um erro ao buscar os dados do seu perfil\nPor favor, tente novamente mais tarde')
        Logger.send(`PROFILE UNDEFINED, ${profile}`,LogType.ERROR)
        return ctx.scene.leave()
    }

    if(maxOdd.includes(','))
        maxOdd = maxOdd.replace(',','.')

    maxOdd = Number(maxOdd)

    if(isNaN(maxOdd)){
        await updateLastMessage()
        Logger.send(`MAX ODD NAN, ${maxOdd}`,LogType.ERROR)
        return await sendMessageText(ctx,eSteps.MAX_ODD,'Número inválido...\nTente novamente')
    }

    if(maxOdd < profile.minOdd + limits.MIN_DIFFERENCE || maxOdd > limits.MAX_ODD){
        await updateLastMessage()
        return await sendMessageText(ctx,eSteps.MAX_ODD,`Número inválido...\nTente novamente\nValor mínimo: ${profile.minOdd + limits.MIN_DIFFERENCE}\nValor máximo: ${limits.MAX_ODD}`)
    }

    await updateLastMessage()
    profile.maxOdd = maxOdd
    ctx.scene.state = await sendMessageWithMarkup(ctx,eSteps.MAX_ODD,
                            `Odd máxima para as múltiplas: ${maxOdd}\nDeseja continuar?`,
                            confirmeMarkup)

    ctx.scene.state = {
        ...ctx.scene.state,
        profile
    }


    async function updateLastMessage(){
        ctx.scene.state = await editLastMessageText(ctx,eSteps.MAX_ODD,`Odd máxima para as múltiplas: ${profile.maxOdd}`,true)
    }
})

selectMaxOdd.action('next', async (ctx) => {
    const { profile } : any = ctx.scene.state

    if(!profile){
        await sendMessageText(ctx,eSteps.MAX_ODD,'Tivemos um erro ao buscar os dados do seu perfil\nPor favor, tente novamente mais tarde')
        Logger.send(`PROFILE UNDEFINED, ${profile}`,LogType.ERROR)
        return ctx.scene.leave()
    }

    await editLastMessageText(ctx,eSteps.MAX_ODD,`Odd máxima para as múltiplas: ${profile.maxOdd}`,true)
    ctx.scene.state = await sendMessageWithMarkup(ctx,eSteps.TEAM_PRIORITY,'Selecione a prioridade para os times da múltipla:',teamPriorityMarkup)

    return ctx.wizard.next()
})

selectTeamPriority.action('home-priority', async (ctx) => {
    const { profile } : any = ctx.scene.state

    if(!profile){
        await sendMessageText(ctx,eSteps.TEAM_PRIORITY,'Tivemos um erro ao buscar os dados do seu perfil\nPor favor, tente novamente mais tarde')
        Logger.send(`PROFILE UNDEFINED, ${profile}`,LogType.ERROR)
        return ctx.scene.leave()
    }

    profile.teamPriority = eTeamPriority.HOME

    await deleteLastMessage(ctx,eSteps.TEAM_PRIORITY)
    await sendMessageText(ctx,eSteps.TEAM_PRIORITY,`Prioridade selecionada: Times favoritos jogando em casa`)
    await sendMessageText(ctx,eSteps.TEAM_PRIORITY,'Qual a quantidade máxima de jogos nas múltiplas?')

    return ctx.wizard.next()
})

selectTeamPriority.action('away-priority', async (ctx) => {
    const { profile } : any = ctx.scene.state

    if(!profile){
        await sendMessageText(ctx,eSteps.TEAM_PRIORITY,'Tivemos um erro ao buscar os dados do seu perfil\nPor favor, tente novamente mais tarde')
        Logger.send(`PROFILE UNDEFINED, ${profile}`,LogType.ERROR)
        return ctx.scene.leave()
    }

    profile.teamPriority = eTeamPriority.AWAY

    await deleteLastMessage(ctx,eSteps.TEAM_PRIORITY)
    await sendMessageText(ctx,eSteps.TEAM_PRIORITY,`Prioridade selecionada: Times favoritos jogando fora`)
    await sendMessageText(ctx,eSteps.TEAM_PRIORITY,'Qual a quantidade máxima de jogos nas múltiplas?')

    return ctx.wizard.next()
})

selectTeamPriority.action('both-priority', async (ctx) => {
    const { profile } : any = ctx.scene.state

    if(!profile){
        await sendMessageText(ctx,eSteps.TEAM_PRIORITY,'Tivemos um erro ao buscar os dados do seu perfil\nPor favor, tente novamente mais tarde')
        Logger.send(`PROFILE UNDEFINED, ${profile}`,LogType.ERROR)
        return ctx.scene.leave()
    }

    profile.teamPriority = eTeamPriority.BOTH
    
    await deleteLastMessage(ctx,eSteps.TEAM_PRIORITY)
    await sendMessageText(ctx,eSteps.TEAM_PRIORITY,`Prioridade selecionada: Times favoritos jogando em ambos os lados`)
    await sendMessageText(ctx,eSteps.TEAM_PRIORITY,'Qual a quantidade máxima de jogos nas múltiplas?')

    return ctx.wizard.next()
})

selectMaxMultiples.hears(/(\d)/, async (ctx) => {
    const maxMatches = Number(ctx.match[1])
    const { profile }: any = ctx.scene.state

    if(isNaN(maxMatches)){
        await updateLastMessage()
        Logger.send(`MAX MULTIPLE NAN, ${maxMatches}`,LogType.ERROR)
        return await sendMessageText(ctx,eSteps.MAX_MULTIPLE,'Número inválido...\nTente novamente')
    }

    if(maxMatches < limits.MIN_MULTIPLE || maxMatches > limits.MAX_MULTIPLE){
        await updateLastMessage()
        return await sendMessageText(ctx,eSteps.MAX_MULTIPLE,
            `Número inválido...\nTente novamente\nValor mínimo: ${limits.MIN_MULTIPLE}\nValor máximo: ${limits.MAX_MULTIPLE}`)
    }

    await updateLastMessage()
    profile.maxMatches = maxMatches
    ctx.scene.state = await sendMessageWithMarkup(ctx,eSteps.MAX_MULTIPLE,
        `Quantidade máxima para as múltiplas: ${maxMatches}\nDeseja continuar?`,
        confirmeMarkup)

    async function updateLastMessage(){
        ctx.scene.state = await editLastMessageText(ctx,eSteps.MAX_MULTIPLE,`Quantidade máxima para as múltiplas: ${profile.maxMatches}`,true)
    }
})

selectMaxMultiples.action('next', async (ctx) => {
    const { profile } : any = ctx.scene.state

    if(!profile){
        await sendMessageText(ctx,eSteps.MAX_MULTIPLE,'Tivemos um erro ao buscar os dados do seu perfil\nPor favor, tente novamente mais tarde')
        Logger.send(`PROFILE UNDEFINED, ${profile}`,LogType.ERROR)
        return ctx.scene.leave()
    }

    await editLastMessageText(ctx,eSteps.MAX_MULTIPLE,`Quantidade máxima para as múltiplas: ${profile.maxMatches}`,true)
    await sendMessageText(ctx,eSteps.MAX_MULTIPLE,'Qual o valor das apostas?')

    return ctx.wizard.next()
})

selectBetValue.hears(/(\d)/, async (ctx) => {
    let betValue:any = ctx.message.text
    const { profile }: any = ctx.scene.state

    if(betValue.includes(','))
        betValue = betValue.replace(',','.')

    betValue = Number(betValue)

    if(isNaN(betValue)){
        await updateLastMessage()
        Logger.send(`BET VALUE NAN, ${betValue}`,LogType.ERROR)
        return await sendMessageText(ctx,eSteps.BET_VALUE,'Número inválido...\nTente novamente')
    }

    if(betValue < limits.MIN_BET_VALUE || betValue > limits.MAX_BET_VALUE){
        await updateLastMessage()
        return await sendMessageText(ctx,eSteps.BET_VALUE,
            `Número inválido...\nTente novamente\nValor mínimo: ${limits.MIN_BET_VALUE.toLocaleString()}\nValor máximo: ${limits.MAX_BET_VALUE.toLocaleString()}`)
    }

    await updateLastMessage()
    profile.betValue = betValue
    ctx.scene.state = await sendMessageWithMarkup(ctx,eSteps.BET_VALUE,
        `Valor das apostas: R$ ${Number(betValue).toLocaleString()}\nDeseja continuar?`,
        confirmeMarkup)

    async function updateLastMessage(){
        ctx.scene.state = await editLastMessageText(ctx,eSteps.BET_VALUE,`Valor das apostas: R$ ${Number(betValue).toLocaleString()}`,true)
    }
})

selectBetValue.action('next', async (ctx) => {
    const { profile } : any = ctx.scene.state

    if(!profile){
        await sendMessageText(ctx,eSteps.BET_VALUE,'Tivemos um erro ao buscar os dados do seu perfil\nPor favor, tente novamente mais tarde')
        Logger.send(`PROFILE UNDEFINED, ${profile}`,LogType.ERROR)
        return ctx.scene.leave()
    }

    await editLastMessageText(ctx,eSteps.BET_VALUE,`Valor das apostas: R$ ${Number(profile.betValue).toLocaleString()}`,true)


    await sendMessageText(ctx,eSteps.BET_VALUE,'Configuração finalizada')
    ctx.scene.state = await sendMessageText(ctx,eSteps.BET_VALUE,'Salvando informações...')
    ctx.sendChatAction('upload_document')

    const saveResponse = await UserProfileController.save(ctx)

    if(saveResponse.status != 'error'){
        const resumeText = extractResumeProfile(ctx)


        await sendMessageText(ctx,eSteps.BET_VALUE,resumeText)

        const saveMessage = `${profile.user.first_name} seu perfil de apostas foi configurado com sucesso!\n`
                            +`Você pode alterar suas configurações a qualquer momento com o comando /profile\n`
                            +`Saiba mais em /help`
        await editLastMessageText(ctx,eSteps.BET_VALUE,saveMessage,true)	

        
        return ctx.scene.leave()
    }

    Logger.send(`SAVE PROFILE ERROR, ${saveResponse}`,LogType.ERROR)

    await editLastMessageText(ctx,eSteps.BET_VALUE,
                `Ocorreu um erro ao salvar seu perfil de apostas 😪\nTente novamente mais tarde 🥲`,true)


    return ctx.scene.leave()
})



startSelectContinueStep.use(async ctx => await sendMessageText(ctx,eSteps.START,'Desculpe... Não entendi oque você disse :('))
selectMinOdd.use(async ctx => await sendMessageText(ctx,eSteps.START,'Desculpe... Não entendi oque você disse :('))
selectMaxOdd.use(async ctx => await sendMessageText(ctx,eSteps.START,'Desculpe... Não entendi oque você disse :('))
selectTeamPriority.use(async ctx => await sendMessageText(ctx,eSteps.START,'Desculpe... Não entendi oque você disse :('))
selectMaxMultiples.use(async ctx => await sendMessageText(ctx,eSteps.START,'Desculpe... Não entendi oque você disse :('))
selectBetValue.use(async ctx => await sendMessageText(ctx,eSteps.START,'Desculpe... Não entendi oque você disse :('))

function extractResumeProfile(ctx:Scenes.WizardContext,oddProfile = false){
    const { profile }:any = ctx.scene.state
    let profileToGet = profile
    if(oddProfile)
        profileToGet = {
            minOdd: profile.oddProfile.min_odd,
            maxOdd: profile.oddProfile.max_odd,
            teamPriority: profile.oddProfile.team_priority,
            maxMatches: profile.oddProfile.max_matches,
            betValue: profile.oddProfile.bet_value
        }

    return `<b>Resumo do perfil de apostas</b>\n\n`
            + `<b>Odd Mínima</b>: <code>${profileToGet.minOdd}</code>\n`
            + `<b>Odd Máxima</b>: <code>${profileToGet.maxOdd}</code>\n`
            + `<b>Times favoritos</b>: <code>${profileToGet.teamPriority == eTeamPriority.HOME ? 'Jogando em casa' : profileToGet.teamPriority == eTeamPriority.AWAY ? 'Jogando fora' : 'Jogando em ambos os lados'}</code>\n`
            + `<b>Quantidade máxima de jogos nas múltiplas</b>: <code>${profileToGet.maxMatches}</code>\n`
            + `<b>Valor das apostas</b>: <code>R$ ${Number(profileToGet.betValue).toLocaleString()}</code>\n`
}







export default ProfileConfigScene