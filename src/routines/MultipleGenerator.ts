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
import { CommandCenter } from '../services/CommandCenter'
import MultipleController from '../controllers/MultipleController'

async function multipleGenerator(){
    const today = new Date()
    
    const matches = await getAllFromDate(today)

    const profiles = await getAllProfiles()

    for(const profile of profiles){
        const minOdd = profile.min_odd
        const maxOdd = profile.max_odd

        const today0 = new Date()
        const today1 = new Date(today0)

        today0.setHours(0,0,0,0)
        today1.setHours(23,59,59,999)

        const profileMultiples = await Multiple.findAll({
            where: {
                user_profile_id: profile.id,
                startAt:{
                    [Op.between]: [today0,today1]
                }
            }
        })

        if(profileMultiples.length > 0){
            Logger.send(`Para o perfil ${profile.user?.user_name} já foram gerados ${profileMultiples.length} multiplos hoje`)
            continue
            //Aqui realizar a checagem das múltiplas do dia para o perfil
        }
        
        const matchesOrdered = orderMatches(filterMatches(matches, minOdd, maxOdd))

        const calculatedMultiples = multiplePreview(matchesOrdered, profile)

        Logger.send(`Para o perfil ${profile.user?.user_name} foram gerados ${calculatedMultiples.length} multiplos`)
        

        await MultipleController.saveAll(calculatedMultiples)
        if(profile.user)
            CommandCenter.sendUserMessage(profile.user,`Para o perfil ${profile.user?.user_name} foram gerados ${calculatedMultiples.length} multiplos`)
    }
}

function multiplePreview(matches: Match[],profile: UserProfile){
    const { max_matches , max_multiples } = profile

    const matchesInMultiples:number[] = []
    const multiples:Match[][] = []

    for(let i = 0; i < max_multiples; i++) {
        const currentMultiple: Match[] = []

        for(let j = 0; j < matches.length; j++) {
            const match = matches[j]

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

        if(multiples.length >= max_multiples) {
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
    expression: '0 0 * * *',
    function: multipleGenerator
}
export default MultipleGenerator