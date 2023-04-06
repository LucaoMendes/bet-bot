import { iRoutine } from "../interfaces/iRoutine"
import Logger, { LogType } from "../utils/Logger"
import { FetchCenter } from "../services/FetchCenter"
import MatchController from "../controllers/MatchController"

async function loadMatches() {
    Logger.send('Carregando jogos',LogType.CRON)
    const today = new Date()
    const tomorrow = new Date(today)
    
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayString = today.toISOString().split('T')[0]
    const tomorrowString = tomorrow.toISOString().split('T')[0]

    const todayMatches = await FetchCenter.getDateMatches(todayString)
    const tomorrowMatches = await FetchCenter.getDateMatches(tomorrowString)

    Logger.send(`Carregados ${todayMatches.length} jogos para hoje e ${tomorrowMatches.length} jogos para amanhã`,LogType.CRON)
    
    Logger.send(`Analisando ${todayMatches.length} partidas de hoje`,LogType.CRON)
    await MatchController.saveAll(todayMatches)

    Logger.send(`Analisando ${tomorrowMatches.length} partidas de amanhã`,LogType.CRON)
    await MatchController.saveAll(tomorrowMatches,true)
}

const LoadMatches:iRoutine = {
    name: 'LoadMatches',
    description: 'Realiza o carregamento das partidas do dia',
    expression: '0 * * * *',
    active: false,
    function: loadMatches
}


export default LoadMatches