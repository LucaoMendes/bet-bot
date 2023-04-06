import Match from "../models/Match"
import User from "../models/User"
import UserProfile from "../models/UserProfile"
import Logger from "./Logger"

export async function validateMatches(matches: Match[]){

    const maxOddProfile = await getMinMaxOddProfile(false)
    const minOddProfile = await getMinMaxOddProfile()

    const minOdd = minOddProfile?.min_odd
    const maxOdd = maxOddProfile?.max_odd

    if(!minOdd || !maxOdd){
        Logger.send(`Não há perfis cadastrados para validar as partidas`)
        return
    }

    const correctStatus = [
        'notstarted',
        'inprogress',
        'finished',
    ]

    const matchesReduced = matches.reduce<Match[]>((acc,match) => {
        if( !match.main_odds || 
            !Object.keys(match.main_odds).includes('outcome_1') ||
            !Object.keys(match.main_odds).includes('outcome_2')) 
            return acc
        
        const {status}:any = match
        const {outcome_1,outcome_2}: any = match.main_odds

        if(!correctStatus.includes(status)){
            return acc
        }

        if((outcome_1.value >= minOdd && outcome_1.value <= maxOdd) ||
            (outcome_2.value >= minOdd && outcome_2.value <= maxOdd)){
            const tempMatch:any = match

            tempMatch.createdAt = null
            tempMatch.updatedAt = null
            acc.push(match)
        }

        return acc
    },[])

    Logger.send(`Encontrados ${matchesReduced.length} de ${matches.length} jogos com odds entre ${minOdd} e ${maxOdd}`)
    
    return matchesReduced
}

export async function getMinMaxOddProfile(min = true): Promise<UserProfile>{
    const whereClause:any = {
        include:[
            {
                model: User,
                as: 'user',
            }
        ],
        order: [ min ? ['min_odd','ASC'] : ['max_odd','DESC']],
    }

    return UserProfile.findOne(whereClause)
}