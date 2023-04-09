import { Context } from "telegraf"
import { iCommand } from "../interfaces/iCommand"
import { eMultipleStatus, extractMultipleDetailsToText, getAllTodayMultiplesByUser } from "../utils/MultipleUtils"
import Multiple from "../models/Multiple"
import UserProfile from "../models/UserProfile"

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

    const lastMessage = await ctx.reply(`Aguarde enquanto verifico suas múltiplas...`)

    const multiples = await getAllTodayMultiplesByUser(userProfile)

    if(multiples.length === 0){
        await ctx.telegram.editMessageText(
                                lastMessage.chat.id,
                                lastMessage.message_id,
                                undefined,
                                `Você não possui múltiplas para hoje!\n`
                                + `Verifique sua estratégia em /profile`)
        return
    }

    await ctx.telegram.editMessageText(
        lastMessage.chat.id,
        lastMessage.message_id,
        undefined,generateMultiplesText(multiples,userProfile),{
        parse_mode: 'HTML'
    })

}

function generateMultiplesText(multiples:Multiple[],profile:UserProfile){

    const greenMultiples = multiples.filter(multiple => multiple.status === eMultipleStatus.GREEN).length
    const redMultiples = multiples.filter(multiple => multiple.status === eMultipleStatus.RED).length
    const previewMultiples = multiples.filter(multiple => multiple.status === eMultipleStatus.PREVIEW).length
    const partialMultiples = multiples.filter(multiple => multiple.status === eMultipleStatus.PARTIAL).length
    const startedMultiples = multiples.filter(multiple => multiple.status === eMultipleStatus.STARTED || multiple.status === eMultipleStatus.PREVIEW || multiple.status === eMultipleStatus.PARTIAL).length
    const notStatedMultiples = multiples.filter(multiple => multiple.status === eMultipleStatus.CREATED).length


    const greenPercent = ((greenMultiples / multiples.length) * 100 ).toFixed(2)
    const redPercent = ((redMultiples / multiples.length) * 100 ).toFixed(2)
    const previewPercent = ((previewMultiples / multiples.length) * 100 ).toFixed(2)
    const partialPercent = ((partialMultiples / multiples.length) * 100 ).toFixed(2)
    const startedPercent = ((startedMultiples / multiples.length) * 100 ).toFixed(2)
    const notStatedPercent = ((notStatedMultiples / multiples.length) * 100 ).toFixed(2)


    const allApplied = profile.bet_value * multiples.length
    let allProfit = 0
    let allReturn = 0

    const orderMultiplesByDate = multiples.sort((a,b) => a.startAt.getTime() - b.startAt.getTime())

    const multiplesMessage = orderMultiplesByDate.map(multiple => {	
        const {
            dateTimeText,
            statusPt,
            profitText,
            expectedProfit,
            returnValue
        } = extractMultipleDetailsToText(multiple)

        allProfit += Number(expectedProfit)
        allReturn += Number(returnValue)

        return `<b>${dateTimeText}</b> - ${statusPt}      <b>${profitText}</b>\nDetalhes da múltipla:      <code>/multiple ${multiple.id}</code>\n`
    })

    const profitPercent = ((allProfit / allApplied) * 100 ).toFixed(2)

    const message = `<b>Você possui ${multiples.length} múltiplas para hoje!</b>\n\n`
                    + `🟩 ${greenMultiples} Green  <b>${greenPercent}%</b>\n`
                    + `🟥 ${redMultiples} Red  <b>${redPercent}%</b>\n`
                    + `🟨 ${previewMultiples} Possíveis greens  <b>${previewPercent}%</b>\n`
                    + `🟧 ${partialMultiples} Parcialmente batidas  <b>${partialPercent}%</b>\n\n`
                    + `\nRestantes:\n`
                    + `⏱ ${notStatedMultiples} Não iniciadas  <b>${notStatedPercent}%</b>\n`
                    + `🏃🏻 ${startedMultiples} Partidas em andamento  <b>${startedPercent}%</b>\n\n\n`
                    + `💴 <b>Valor apostado:</b> <code>R$ ${Number(allApplied).toLocaleString()}</code>\n`
                    + `💰 <b>Retorno esperado:</b> <code>R$ ${Number(allReturn).toLocaleString()}</code>\n`
                    + `💵 <b>Lucro esperado:</b> <code>R$ ${Number(allProfit).toLocaleString()}</code>\n`
                    + `📈 <b>Lucro percentual:</b> <code>${profitPercent}%</code>\n\n\n`
                    + multiplesMessage.join('\n')

    return message
}
const MultiplesCommand:iCommand = {
    description: 'Verificar múltiplas do dia',
    command: 'multiples',
    function: multiplesCommand,
}
export default MultiplesCommand