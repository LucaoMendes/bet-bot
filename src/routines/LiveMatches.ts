import MatchController from "../controllers/MatchController"
import { iRoutine } from "../interfaces/iRoutine"
import { FetchCenter } from "../services/FetchCenter"
import Logger, { LogType } from "../utils/Logger"

async function liveMatches(){
    
    const liveMatches = await FetchCenter.getLiveMatches() 

    Logger.send(`${liveMatches.length} partidas ao vivo`,LogType.CRON)

    if(liveMatches.length == 0)
        return

    await MatchController.saveAll(liveMatches,true)
}

const LiveMatches:iRoutine = {
    name: 'LiveMatches',
    description: 'Rotina responsável por atualizar os dados das partidas a cada minuto',
    expression: '* * * * *',
    active: true,
    function: liveMatches
}

export default LiveMatches