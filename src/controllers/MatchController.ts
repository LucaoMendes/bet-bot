import { Op } from "sequelize"
import { iSaveResponse } from "../interfaces/iSaveResponse"
import Match from "../models/Match"
import Logger, { LogType } from "../utils/Logger"
import { eMatchStatus, validateMatches } from "../utils/MatchUtils"
import { FetchCenter } from "../services/FetchCenter"

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
    static async saveAllWithoutValidation(matches:any[]){
        const promises: Promise<any>[] = []
        
        matches.forEach((match:any) => promises.push(Match.upsert(match)))

        await Promise.all(promises)

    }
    static async saveAll(matches:any[],analyzeMatches = false){

        const matchesReduced = await validateMatches(matches)

        if(!matchesReduced)
            return
        
        const promises: Promise<any>[] = []
        
        matchesReduced.forEach((match:any) => promises.push(Match.upsert(match)))

        await Promise.all(promises)

        if(analyzeMatches)
            this.analyzeMatches(matchesReduced)
    }

    static async analyzeMatches(matchesSaved:Match[]){
        const matchIds = matchesSaved.map((match) => match.id)

        const matchesToReview = await Match.findAll({
            where: {
                status: [eMatchStatus.IN_PROGRESS,eMatchStatus.NOT_STARTED],
                start_at :{
                    [Op.lt]: new Date()
                },
                id:{
                    [Op.notIn]: matchIds
                }
            }
        })

        if(matchesToReview.length == 0)
            return

        const promises: Promise<any>[] = []

        matchesToReview.forEach(match => {
            promises.push(
                FetchCenter.getMatchById(match.id)
                    .then(async fetchedMatch => await MatchController.save(fetchedMatch))
            )
        })
        
    }
}