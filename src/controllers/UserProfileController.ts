import { Context } from "telegraf"
import { WizardContext } from "telegraf/typings/scenes"
import { iSaveResponse } from "../interfaces/iSaveResponse"
import UserProfile from "../models/UserProfile"
import Logger, { LogType } from "../utils/Logger"

export default class UserProfileController {
    static async save(ctx:WizardContext):Promise<iSaveResponse>{
        if(!ctx || !ctx.from || !Object.keys(ctx.scene.state).includes('profile')){
            Logger.send(`Context Inválido, ${JSON.stringify(ctx)} - UserProfileController.save`,LogType.ERROR)
            return { status: 'error' }
        }
        const { profile }:any = ctx.scene.state

        const newProfile = {
            user_id: profile.user.id,
            min_odd: profile.minOdd,
            max_odd: profile.maxOdd,
            team_priority: profile.teamPriority,
            max_matches: profile.maxMatches,
            bet_value: profile.betValue,
        }

        try {
            const [user,created] = await UserProfile.upsert(newProfile)
            return { status: created ? 'created' : 'updated' , data: user }
        }catch(e:any){
            Logger.send(JSON.stringify(e),LogType.ERROR)
        }
        return { status: 'error' }
    }
}