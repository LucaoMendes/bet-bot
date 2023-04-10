import { Op } from "sequelize"
import Match from "../models/Match"
import Multiple from "../models/Multiple"
import MultipleMatch from "../models/MultipleMatch"
import { FetchCenter } from "../services/FetchCenter"
import { eMatchStatus, verifyMinutesMatch } from "./MatchUtils"
import MultipleController from "../controllers/MultipleController"
import MatchController from "../controllers/MatchController"
import UserProfile from "../models/UserProfile"
import User from "../models/User"
import { MessageCenter } from "../services/MessageCenter"
import Logger, { LogType } from "./Logger"

export function getMatchMultipleDetails(multipleMatches: Match[]){
    const dataMatches: any[] = []
    let lastDate:Date | null = null
    let runningMatches = 0
    let greenMatches = 0
    let previewGreenMatches = 0
    let previewRedMatches = 0
    let redMatches = 0
    let multipleOdd = 1

    multipleMatches.forEach(match => {
        const details = getMatchDetails(match)
        const {
            startAt,
            running,
            green,
            red,
            home_odd,
            draw_odd,
            away_odd,
            previewGreen,
            preview,
            result,
            status,
            score
        } = details
        
        if(!lastDate || startAt.getTime() < lastDate.getTime()) lastDate = startAt
        if(running) runningMatches++
        if(green) greenMatches++
        if(red) redMatches++

        const goals = (details.homeScore?.current ?? 0) + (details.awayScore?.current ?? 0)

        if(running && previewGreen) previewGreenMatches++
        if(running && !previewGreen && goals > 0) previewRedMatches++

        dataMatches.push({
            match_id: match.id,
            home_odd,
            draw_odd,
            away_odd,
            preview,
            result,
            startAt,
            score,        
            status,
            match
        })

        multipleOdd *= details.favOdd
    })

    let status = eMultipleStatus.CREATED

    if(runningMatches > 0)
        status = eMultipleStatus.STARTED
    
    if(previewGreenMatches > 0 && previewRedMatches == 0)
        status = eMultipleStatus.PREVIEW
    
    if(greenMatches > 0 && greenMatches < multipleMatches.length && redMatches == 0)
        status = eMultipleStatus.PARTIAL
    
    if(greenMatches == multipleMatches.length)
        status = eMultipleStatus.GREEN

    if(redMatches > 0)
        status = eMultipleStatus.RED

    return {
        dataMatches,
        lastDate,
        runningMatches,
        greenMatches,
        redMatches,
        multipleOdd,
        matchesCount : multipleMatches.length,
        status,
    }
}

export function getMatchDetails(match:Match){
    const {home,away,main_odds,start_at,home_score,away_score,status}:any = match
    const homeOdd = main_odds.outcome_1.value
    const drawOdd = main_odds.outcome_X.value
    const awayOdd = main_odds.outcome_2.value
    const favOdd = homeOdd < awayOdd ? homeOdd : awayOdd
    const favPercent = 100 / favOdd
    const preview = homeOdd < awayOdd ? 'home-priority' : 'away-priority'
    const result =  home_score && away_score ? (
                        home_score.current > away_score.current ? 
                        'home-win' : home_score.current < away_score.current ?
                        'away-win' : 'draw'
                    ) : 'unknow'
    const score  =  home_score && away_score ? {
                        home: home_score.current,
                        away: away_score.current
                    } : null
    let green = false
    let red = true

    const running = status === eMatchStatus.IN_PROGRESS

    const previewGreen = (result === 'home-win' && preview === 'home-priority') ||
                             (result === 'away-win' && preview === 'away-priority')
    
    if(!running){
        if(previewGreen){
            green = true
            red = false
        }else{
            if(status === eMatchStatus.FINISHED){
                green = false
                red = true
            }else{
                green = false
                red = false
            }
        }
    }else{
        red = false
        green = false
    }
    
    return {
        multiple_id: null,
        match_id: match.id, 
        home_odd: homeOdd,
        draw_odd: drawOdd,
        away_odd: awayOdd,
        cashout: false,
        startAt: new Date(start_at),
        home,
        away,
        favOdd,
        favPercent,  
        homeScore: home_score,
        awayScore: away_score, 
        result,   
        green,
        red,
        status,
        running,   
        previewGreen,
        preview,
        score,
    }
}

export async function getAllMultiplesByUserPerDate(userProfile:UserProfile,plusDate = 0){
    const today0 = new Date()
    today0.setDate(today0.getDate() + plusDate)
    const today1 = new Date(today0)

    today0.setHours(0,0,0,0)
    today1.setHours(23,59,59,999)

    return Multiple.findAll({
        include: [{
            model: MultipleMatch,
            as: 'matches',
            include: [Match]
        },
        {
            model: UserProfile,
            as: 'profile',
            include: [{
                model: User,
                as: 'user'
            }]
        }],
        where:{
            user_profile_id: userProfile.id,
            startAt:{
                [Op.between]: [today0,today1]
            }
        }
    })

}

export function getMultipleByIdAndProfile(multipleId:number, userProfile:UserProfile){
    return Multiple.findOne({
        include: [{
            model: MultipleMatch,
            as: 'matches',
            include: [Match]
        },
        {
            model: UserProfile,
            as: 'profile',
            include: [{
                model: User,
                as: 'user'
            }]
        }],
        where:{
            id: multipleId,
            user_profile_id: userProfile.id,
        }
    })
}

export function generateMultipleText(multiple:Multiple,newMultiple:any = undefined){
    if(!multiple.matches){
        Logger.send(`Multiple ${multiple.id} has no matches!`,LogType.ERROR)
        return `Múltipla não encontrada, verifique suas múltiplas com /multiples!`
    }

    if(!multiple.profile){
        Logger.send(`Multiple ${multiple.id} has no profile!`,LogType.ERROR)
        return `Múltipla não encontrada, verifique suas múltiplas com /multiples!`
    }
    
    const orderMatches = (tempMultiple:any) => {
        return tempMultiple.matches.sort((a:any,b:any) => {
            if(!a.match || !b.match) return 0
            const aDate = new Date(a.match.start_at)
            const bDate = new Date(b.match.start_at)
            return aDate.getTime() - bDate.getTime()
        })
    }

    const orderedMatches = newMultiple ? orderMatches(newMultiple) : orderMatches(multiple)

   const {
            statusPt,
            returnValue,
            expectedProfit,
            profitText
        } = extractMultipleDetailsToText(multiple)
    
    const matchesMessage = generateMatchesText(orderedMatches)

    return  `🏆 <b>[${multiple.id}] Notificação de múltipla!</b>\n\n`
            + `🤖 <b>Status:</b> <code>${statusPt}</code>\n`
            + `♾ <b>Odd prelive:</b> <code>${Number(multiple.multiple_odd).toFixed(2)}</code>\n`
            + `${newMultiple ? `♾ <b>Odd atual:</b> <code>${Number(newMultiple.multiple_odd).toFixed(2)}</code>\n` : ''}\n`
            + `💴 <b>Valor apostado:</b> <code>R$ ${Number(multiple.profile.bet_value).toFixed(2)}</code>\n`
            + `💰 <b>Retorno esperado:</b> <code>R$ ${Number(returnValue).toLocaleString()}</code>\n`
            + `🤑 <b>Lucro esperado:</b> <code>R$ ${Number(expectedProfit).toLocaleString()} ${profitText}</code>\n\n`
            + `⚽️ <b>Partidas da múltipla:</b>\n\n`
            + matchesMessage.join('\n') + `\n\n`
            + `${newMultiple ? `Mais detalhes: <code>/multiple ${multiple.id}</code>`: ''}`
}

function generateMatchesText(multipleMatches: MultipleMatch[]){
    return multipleMatches.map(multipleMatch => {
        if(!multipleMatch.match) return ''

        const {
            home,
            away,
            league,
            score,
            dateTimeText,
            time,
            previewGreenText,
            preliveOdds,
            actualOdds,
            hasActualOdds
        } = extractMultipleMatchDetailsToText(multipleMatch)

        return `⚽️ <b><u>${home.name}</u> ${score} <u>${away.name}</u></b>\n`
                + `🕙 <b>Inicio:</b> <code>${dateTimeText}</code>\n`	
                + `⏳ <b>Tempo Atual:</b> <code>${time.value}</code>\n`
                + `🏆 <b>Liga:</b> <code>${league.name}</code>\n`	
                + `🤖 <b>Resultado parcial:</b> <code>${previewGreenText}</code>\n`
                + `📤 <b>Link:</b> <a href="https://www.bet365.com/#/AX/K%5E${home.name}/">Bet365</a>\n`
                + `♾ <b>Odds prelive:</b>\n${preliveOdds}\n`
                + `${hasActualOdds ?
                    `♾ <b>Odds atual:</b>\n${actualOdds}\n` : ''}`
                +`\n`
    })
}

export function extractMultipleDetailsToText(multiple:Multiple){
    const profile : any = multiple.profile

    const dateTime = new Date(multiple.startAt)
    const day = String(dateTime.getDate()).padStart(2, '0')
    const month = String(dateTime.getMonth() + 1).padStart(2, '0')
    const hour = String(dateTime.getHours()).padStart(2, '0')
    const minute = String(dateTime.getMinutes()).padStart(2, '0')

    const dateTimeText = `${day}/${month} ${hour}:${minute}h`

    const { status } = multiple

    const statusPt = getPtMultipleStatus(status,true)


    const expectedProfit =  (   
                                status !== eMultipleStatus.RED && 
                                status !== eMultipleStatus.CANCELED ?
                                profile.bet_value * multiple.multiple_odd - profile.bet_value : - profile.bet_value 
                            ).toFixed(2)

    const returnValue =     (   
                                status !== eMultipleStatus.RED && 
                                status !== eMultipleStatus.CANCELED ?
                                profile.bet_value * multiple.multiple_odd : 0 
                            ).toFixed(2)

    const profitPercent = (Number(expectedProfit) / Number(profile.bet_value) * 100).toFixed(2)
    const profitText = Number(profitPercent) < 0 ? `${profitPercent}%` : `${profitPercent}%`

    return {
        dateTimeText,
        statusPt,
        expectedProfit,
        returnValue,
        profitPercent,
        profitText,
    }
}

function extractMultipleMatchDetailsToText(multipleMatch: MultipleMatch){
            const {home,away,league,home_score,away_score, main_odds,start_at} : any = multipleMatch.match
            
            const dateTime = new Date(start_at)

            const day = String(dateTime.getDate()).padStart(2, '0')
            const month = String(dateTime.getMonth() + 1).padStart(2, '0')
            const hour = String(dateTime.getHours()).padStart(2, '0')
            const minute = String(dateTime.getMinutes()).padStart(2, '0')

            const dateTimeText = `${day}/${month} ${hour}:${minute}h`

            const {outcome_1,outcome_X,outcome_2} : any  = main_odds
            
            const homeGoals = home_score?.current ? Number(home_score?.current) : 0
            const awayGoals = away_score?.current ? Number(away_score?.current) : 0

            const favGoals = multipleMatch.preview == 'home-priority' ? homeGoals : awayGoals
            const otherGoals = multipleMatch.preview == 'home-priority' ? awayGoals : homeGoals

            const score = home_score && away_score ? ` <code> [${homeGoals}] x [${awayGoals}] </code> ` : ' x '

            const previewGreen =   ( (multipleMatch.result === 'home-win' && multipleMatch.preview === 'home-priority') ||
                                        (multipleMatch.result === 'away-win' && multipleMatch.preview === 'away-priority') )
                                        && favGoals > otherGoals
            const running = multipleMatch.status == eMatchStatus.IN_PROGRESS
            const finished = multipleMatch.status == eMatchStatus.FINISHED
            const notStarted = multipleMatch.status == eMatchStatus.NOT_STARTED

            const previewGreenText = notStarted || 
                                        (running && homeGoals + awayGoals == 0) ?
                                        '🟨 Aguardando...' : 
                                        (previewGreen ? `🟩 ${running? 'Possível' : ''} Green!` : `🟥 ${running? 'Possível' : ''} Red!`)

            const preliveOdds = [
                isNaN(Number(multipleMatch.home_odd)) ? 0 : Number(multipleMatch.home_odd).toFixed(2),
                isNaN(Number(multipleMatch.draw_odd)) ? 0 : Number(multipleMatch.draw_odd).toFixed(2),
                isNaN(Number(multipleMatch.away_odd)) ? 0 : Number(multipleMatch.away_odd).toFixed(2)

            ]
            const actualOdds = [
                isNaN(Number(outcome_1.value)) ? 0 : Number(outcome_1.value).toFixed(2),
                isNaN(Number(outcome_X.value)) ? 0 : Number(outcome_X.value).toFixed(2),
                isNaN(Number(outcome_2.value)) ? 0 : Number(outcome_2.value).toFixed(2)
            ]  

            const time = multipleMatch.match ?  verifyMinutesMatch(multipleMatch.match) : {value:0}

            const prelive = `${preliveOdds[0]}    ${preliveOdds[1]}     ${preliveOdds[2]}`
            const actual = `${actualOdds[0]}    ${actualOdds[1]}     ${actualOdds[2]}`
            const oddsText = (odds:string) =>    `<code>\n` +
                                                    ` 1         X         2\n` +
                                                    ` -----------------------\n` +
                                                    ` ${odds}  </code>\n\n`


            return {
                dateTimeText,
                home,
                away,
                league,
                score,
                previewGreenText,
                prelive,
                actual,
                preliveOdds: oddsText(prelive),
                hasActualOdds: outcome_1.value && outcome_2.value && outcome_X.value,
                actualOdds: oddsText(actual),
                time,
                finished,
                notStarted,
                running
            }
}

export async function analyzeAllMultiples(){
    const multiples = await Multiple.findAll({
        include: [{
            model: MultipleMatch,
            as: 'matches',
            include: [Match]
        },
        {
            model: UserProfile,
            as: 'profile',
            include: [{
                model: User,
                as: 'user'
            }]
        }],
        where:{
            status: {
                [Op.notIn]: [eMultipleStatus.GREEN, eMultipleStatus.RED, eMultipleStatus.CANCELED]
            }
        }
    })

    const analyzedMatches: Match[] = []

    for(const multiple of multiples){
        const { matches } : any = multiple
        const tempMatches:Match[] = []

        for(const match of matches){
            const tempMatch = await FetchCenter.getMatchById(match.match_id)
            tempMatches.push(tempMatch)
            analyzedMatches.push(tempMatch)
        }

        const tempMultiple:any = {
            id: multiple.id,
            ...calculateMultiple(tempMatches, multiple.user_profile_id),
        }
        checkMultipleInconsistencies(multiple?.dataValues,tempMultiple)
        await MultipleController.update(tempMultiple)
    }

    await MatchController.saveAllWithoutValidation(analyzedMatches)
}

function checkMultipleInconsistencies(oldMultiple: Multiple,newMultiple: Multiple){
    
    if(!oldMultiple.profile || !oldMultiple.matches || !newMultiple.matches)
        return

    const multiplesWithProfile:iMultiplesInconsistencies = {
        oldMultiple,
        newMultiple,
        profile: oldMultiple.profile,
    }

    const oldMatchesDetails = oldMultiple.matches.map((match:MultipleMatch) => {
        return {
            match_id:match.match_id,
            score: match.score,
            status: match.status,
            match: match.match
        }
    })

    const newMatchesDetails = newMultiple.matches.map((match:MultipleMatch) => {
        return {
            match_id:match.match_id,
            score: match.score,
            status: match.status,
            match: match.match
        }
    })

    const hasAnyMatchWithDivergency = oldMatchesDetails.some((oldMatch:any) => {
        const newMatch:any = newMatchesDetails.find((newMatch:any) => newMatch.match_id == oldMatch.match_id)
        
        if(!newMatch)
            return false

        return  (newMatch?.score && oldMatch.score ? 
                    (
                        newMatch.score.home !== oldMatch.score.home || 
                        newMatch.score.away !== oldMatch.score.away 
                    ) : 
                    false 
                ) ||
                newMatch?.match?.status !== oldMatch.match?.status ||
                newMatch?.status !== oldMatch.status
    })
    
    if(oldMultiple.status !== newMultiple.status || hasAnyMatchWithDivergency)
        MessageCenter.sendMultipleUpdated(multiplesWithProfile)
}

export function calculateMultiple(matches:Match[],user_profile_id:number,multiple_id?:number){
    if(matches.length == 0) return null

    const {
        runningMatches,
        greenMatches,
        redMatches,
        matchesCount,
        multipleOdd,
        dataMatches,
        status,
        lastDate,
    } = getMatchMultipleDetails(matches)

    return {
        multiple_id,
        user_profile_id,
        matches_count:matchesCount,
        multiple_odd: multipleOdd,
        green: greenMatches == matches.length && redMatches == 0,
        red: redMatches > 0,
        running: runningMatches > 0 && redMatches == 0,
        status,
        cashout: false,
        startAt: lastDate,
        matches: dataMatches
    }
}

export function getPtMultipleStatus(status: eMultipleStatus,withIcon = false){
    const { CREATED, STARTED, PREVIEW, PARTIAL, GREEN, RED, CANCELED } = eMultipleStatus
    const icon = getMultipleStatusIcon(status)

    if(status == CREATED) return `${withIcon ? `${icon} ` : ''} Aguardando inicio das partidas`
    if(status == STARTED) return `${withIcon ? `${icon} ` : ''} Partidas em andamento`
    if(status == PREVIEW) return `${withIcon ? `${icon} ` : ''} Previsão de Green!`
    if(status == PARTIAL) return `${withIcon ? `${icon} ` : ''} Parcialmente batida`
    if(status == GREEN) return `${withIcon ? `${icon} ` : ''} Green, parabéns!`
    if(status == RED) return `${withIcon ? `${icon}` : ''} Red, infelizmente!`
    if(status == CANCELED) return `${withIcon ? `${icon} ` : ''} Cancelada`

    return undefined
}

export function getMultipleStatusIcon(status: eMultipleStatus){
    const icons = {
        [eMultipleStatus.GREEN]: '🟩',
        [eMultipleStatus.RED]: '🟥',
        [eMultipleStatus.PREVIEW]: '🟨',
        [eMultipleStatus.PARTIAL]: '🟧',
        [eMultipleStatus.CANCELED]: '⏹',
        [eMultipleStatus.STARTED]: '🏃🏻',
        [eMultipleStatus.CREATED]: '⏳',
    }

    return icons[status]
}


export enum eMultipleStatus {
    CREATED  = 'multiple_created',
    STARTED = 'multiple_started',
    PREVIEW = 'multiple_preview',
    PARTIAL = 'multiple_partial',
    GREEN = 'multiple_green',
    RED = 'multiple_red',
    CANCELED = 'multiple_canceled'
}

export interface iMultiplesInconsistencies {
    oldMultiple: Multiple,
    newMultiple: Multiple,
    profile: UserProfile,
}