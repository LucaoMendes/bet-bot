import { iSaveResponse } from "../interfaces/iSaveResponse"
import Match from "../models/Match"
import Logger, { LogType } from "../utils/Logger"
import { matchStatus, validateMatches } from "../utils/MatchUtils"

export default class MatchController {
    static async save(match:any):Promise<iSaveResponse>{
        if(!match || !match.id || !match.name || !match.main_odds){
            Logger.send(`Match Inválida, ${JSON.stringify(match)} - MatchController.save`,LogType.ERROR)
            return { status: 'error' }
        }

        match.createdAt = null
        match.updatedAt = null

        try {
            const [matchSaved,created] = await Match.upsert(match)
            return { status: created ? 'created' : 'updated' , data: matchSaved }
        }catch(e:any){
            Logger.send(JSON.stringify(e),LogType.ERROR)
        }
        return { status: 'error' }
    }

    static async saveAll(matches:any[],reviewMatches = false){

        const matchesReduced = await validateMatches(matches)

        if(!matchesReduced)
            return
        
        const promises: Promise<any>[] = []

        matchesReduced.forEach((match) => promises.push(Match.upsert({...match})))

        await Promise.all(promises)

        Logger.send(`Partidas salvas ${matchesReduced.length} de ${matches.length}`)

        if(reviewMatches){
            Logger.send(`Revisando partidas`,LogType.CRON)
            await MatchController.reviewMatches(matches)
        }
    }

    private static async reviewMatches(matches: Match[]){
        const ids = matches.map(match => match.id)
        const matchesToReview = await Match.findAll({
            where: {
                status: matchStatus.IN_PROGRESS,
            }
        })

        matchesToReview.forEach(async (match) => {
            if(!ids.includes(match.id)){
                Logger.send(`Partida ${match.id} não está mais no ao vivo, alterando status`,LogType.CRON)
                await match.update({status: matchStatus.FINISHED})
            }
        })
    }

}