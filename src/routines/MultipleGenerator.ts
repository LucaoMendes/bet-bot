import { Op } from 'sequelize'
import { iRoutine } from '../interfaces/iRoutine'
import Match from '../models/Match'
import Multiple from '../models/Multiple'
import MultipleMatch from '../models/MultipleMatch'
import User from '../models/User'
import UserProfile from '../models/UserProfile'
import Logger from '../utils/Logger'
import { filterMatches, getAllFromDate, orderMatches } from '../utils/MatchUtils'
import { calculateMultiple, getMatchDetails } from '../utils/MultipleUtils'
import MultipleController from '../controllers/MultipleController'
import { MessageCenter } from '../services/MessageCenter'

async function multipleGenerator(){
    const today = new Date()
    const tomorrow = new Date(today)

    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayMatches = await getAllFromDate(today)
    const tomorrowMatches = await getAllFromDate(tomorrow)

    const profiles = await getAllProfiles()

    for(const profile of profiles){

        const today0 = new Date()
        const today1 = new Date(today0)

        today0.setHours(0,0,0,0)
        today1.setHours(23,59,59,999)

        const tomorrow0 = new Date(today0)
        const tomorrow1 = new Date(today1)

        tomorrow0.setDate(tomorrow0.getDate() + 1)
        tomorrow1.setDate(tomorrow1.getDate() + 1)

        tomorrow0.setHours(0,0,0,0)
        tomorrow1.setHours(23,59,59,999)

        const profileMultiplesToday = await Multiple.findAll({
            where: {
                user_profile_id: profile.id,
                startAt:{
                    [Op.between]: [today0,today1]
                }
            }
        })

        const profileMultiplesTomorrow = await Multiple.findAll({
            where: {
                user_profile_id: profile.id,
                startAt:{
                    [Op.between]: [tomorrow0,tomorrow1]
                }
            }
        })

        if(profileMultiplesToday.length == 0 || (profileMultiplesToday.length < profile.max_multiples)){
            generateMultiples(todayMatches,profileMultiplesToday,profile)
        }
        if(profileMultiplesTomorrow.length == 0 || (profileMultiplesTomorrow.length < profile.max_multiples)){
            generateMultiples(tomorrowMatches,profileMultiplesTomorrow,profile)
        }       
    }
}

async function generateMultiples(matches:Match[],actualMultiples: Multiple[],profile:UserProfile){
    const minOdd = profile.min_odd
    const maxOdd = profile.max_odd

    const matchesOrdered = orderMatches(filterMatches(matches, minOdd, maxOdd))

    const calculatedMultiples = await multiplePreview(matchesOrdered,actualMultiples,profile)

    Logger.send(`Para o perfil ${profile.user?.user_name} foram gerados ${calculatedMultiples.length} multiplos`)
    
    if(calculatedMultiples.length > 0){
        const savedMultiples = await MultipleController.saveAll(calculatedMultiples)

        savedMultiples.data.forEach((multiple:Multiple) => MessageCenter.sendMultipleCreated(multiple))
    }
}

async function multiplePreview(matches: Match[],actualMultiples: Multiple[],profile: UserProfile){
    const { max_matches , max_multiples } = profile

    const matchesInMultiples:number[] = []
    const multiples:Match[][] = []

    const matchesInMultiplesSaved:number[] = actualMultiples?.map((multiple:any) => multiple?.matches?.map((match:any) => match.id)) ?? []

    for(let i = 0; i < max_multiples; i++) {
        const currentMultiple: Match[] = []

        for(let j = 0; j < matches.length; j++) {
            const match = matches[j]

            if(matchesInMultiplesSaved.includes(match.id))
                continue

            if(matchesInMultiples.includes(match.id) || currentMultiple.includes(match)) 
                continue
            
            const details = getMatchDetails(match)

            if(profile.team_priority === 'home-priority' && details.preview !== 'home-priority')
                continue

            if(profile.team_priority === 'away-priority' && details.preview !== 'away-priority') 
                continue
            

            currentMultiple.push(match)
            matchesInMultiples.push(match.id)

            if(currentMultiple.length >= max_matches) {
                multiples.push(currentMultiple)
                break
            }
        }

        if(multiples.length + actualMultiples.length >= max_multiples) {
            break
        }
    }

    const calculatedMultiples:any[] = []
    multiples.forEach(multiple => {
        calculatedMultiples.push(calculateMultiple(multiple, profile.id))
    })

    return calculatedMultiples  
}

async function getAllProfiles(){
    return UserProfile.findAll({
        include: [
            {
                model: User,
                as: 'user'
            },
            {
                model: Multiple,
                as: 'multiples',
                include: [
                    {
                        model: MultipleMatch,
                        as: 'matches'
                    }
                ]
            }
        ]
    })
}

const MultipleGenerator: iRoutine = {
    name: 'Multiple Generator',
    description: 'Analisa as partidas do dia e cria as múltiplas',
    active: true,
    expression: '* * * * *',
    function: multipleGenerator
}
export default MultipleGenerator