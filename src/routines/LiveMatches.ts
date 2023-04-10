import { Op } from "sequelize"
import MatchController from "../controllers/MatchController"
import { iRoutine } from "../interfaces/iRoutine"
import Multiple from "../models/Multiple"
import { FetchCenter } from "../services/FetchCenter"
import Logger, { LogType } from "../utils/Logger"
import { eMultipleStatus } from "../utils/MultipleUtils"

async function liveMatches(){
    
    const anyMatchToCheck = (await Multiple.findAll({
        where:{
            status: {
                [Op.notIn]: [
                    eMultipleStatus.GREEN,
                    eMultipleStatus.RED,
                    eMultipleStatus.CANCELED,
                ]
            }
        }
    })).length > 0

    if(!anyMatchToCheck)
        return

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