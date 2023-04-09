import { Op } from "sequelize"
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

export async function getAllFromDate(startDate: Date){
    const endDate = new Date(startDate)
    endDate.setHours(23,59,59,999)

    startDate.setHours(0,0,0,0)
    const whereClause:any = {
        where:{
            start_at: {
                [Op.between]: [startDate,endDate]
            }
        }
    }

    return Match.findAll(whereClause)
}

export function orderMatches(matches: any[]){
    return matches.sort((a, b) => {
        if(!a.challenge || !b.challenge) return 0
        if(!a.challenge.order || !b.challenge.order) return 0

        return a.challenge.order - b.challenge.order
    })
}

export function filterMatches(matches: any[], minOdd: number, maxOdd: number){
    return matches.filter(match => {
                const {
                    outcome_1, outcome_2
                } : any = match.main_odds
                
                if(!outcome_1 || !outcome_2)
                    return false
                
                const diff = outcome_1.value < outcome_2.value ?
                                outcome_2.value - outcome_1.value :
                                outcome_1.value - outcome_2.value

                //Limitação da diferença de odd
                if(diff < 4.5)
                    return false

                return  (outcome_1.value >= minOdd && outcome_1.value <= maxOdd) || 
                        (outcome_2.value >= minOdd && outcome_2.value <= maxOdd)
            })
}

export function getPtMatchStatus(status: eMatchStatus){
    if(status === eMatchStatus.FINISHED) return 'Finalizado'
    if(status === eMatchStatus.IN_PROGRESS) return 'Em andamento'
    if(status === eMatchStatus.NOT_STARTED) return 'Não iniciado'
    if(status === eMatchStatus.CANCELED) return 'Cancelado'
    if(status === eMatchStatus.POSTPONED) return 'Adiado'
    if(status === eMatchStatus.DELAYED) return 'Atrasado'
    if(status === eMatchStatus.INTERRUPTED) return 'Interrompido'
    if(status === eMatchStatus.SUSPENDED) return 'Suspenso'
    if(status === eMatchStatus.WILL_CONTINUE) return 'Continuará'
    if(status === eMatchStatus.NEED_ATTENTION) return 'Precisa de atenção'
    if(status === eMatchStatus.UNKNOWN) return 'Desconhecido'
    
    return undefined

}

export function verifyMinutesMatch(match:Match){
    const { time_details , status , status_more , start_at} = match
    const now = new Date().getTime()
    let value = null
    if(status_more == 'Halftime'){
        value = 'Intervalo'
    }else if(status_more == 'Awaiting extra time'){
        value = 'Aguardando Prorrogação'
    }else if(status_more == 'Extra time halftime'){
        value = 'Intervalo Prorrogação'
    }else if(status_more == "Penalties"){
        value = `Penaltis`
    }else if(status_more == "Awaiting penalties"){
        value = `Aguardando Penaltis`
    }else {
        if(time_details && status == 'inprogress')
        {   const timestamp = time_details.currentPeriodStartTimestamp  ?? time_details?.timestamp ?? 0
            const actualTime = Number(((  (now/1000) - (timestamp) ) / 60).toFixed(0))
            
            if(status_more == '1st half' || status_more == 'HT' ){
                value = `${actualTime <= 45 ? actualTime + '\'' : '45+'}`
            }else if(status_more == '2nd half' || status_more == 'FT'){
                const minute = actualTime + 45
                value = `${minute <= 90 ? minute + '\'' : '90+'}`
            }else if(status_more == '1st extra'){
                const minute = actualTime + 90
                value = `${minute <= 105 ? minute + '\'' : '105+'}`
            }else if(status_more == "2nd extra"){
                const minute =  + 105
                value = `${minute <= 120 ? minute + '\'' : '120+'}`
            }else if(status_more == "90+" || status_more == "45+"){
                value = status_more
            }else{
                console.log({
                    type: 'LOG verifyMinutesMatch',
                    match: match.id,
                    status,
                    time_details,
                    status_more,
                    start_at,
                })
                value = actualTime + "'"
            
            }
        }else if(!time_details && status == 'inprogress'){
            if(status_more == "HT" ){
                value = getByStart()
            }
        }else{
            if(status != 'inprogress'){
                value = getPtMatchStatus(status)
            }else {

                console.log({
                    type: 'LOG verifyMinutesMatch [NO MATCH]',
                    match: match.id,
                    status,
                    time_details,
                    status_more,
                    start_at,
                })
                value = "?"
            }
        }
    }

    
    function getByStart(){
        const startDate = new Date(start_at).getTime()
        const minutes = (now/1000 - startDate/1000) / 60 
        value = `${(minutes > 0 ? minutes : 1).toFixed(0)  + '\''}`
        return value
    } 
    // if(value?.includes('\'')){
    //     value = value.split('\'')[0] 
    //     value = "'"
    // }else{
    //     if(status == 'inprogress'){
    //         if(value)
    //             value = <span>{value}<span className="opacity-anim"></span></span>
    //     }
    // }
    
    return {
        status_more,
        value
    }
}

export enum eMatchStatus {
    FINISHED = 'finished',
    IN_PROGRESS = 'inprogress',
    NOT_STARTED = 'notstarted',
    CANCELED = 'canceled',
    POSTPONED = 'postponed',
    DELAYED = 'delayed',
    INTERRUPTED = 'interrupted',
    SUSPENDED = 'suspended',
    WILL_CONTINUE = 'willcontinue',
    NEED_ATTENTION = 'needattention',
    UNKNOWN = 'unknown',
}

