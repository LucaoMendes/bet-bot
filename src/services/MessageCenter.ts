import Multiple from "../models/Multiple"
import { generateMultipleText, iMultiplesInconsistencies } from "../utils/MultipleUtils"
import { CommandCenter } from "./CommandCenter"

export class MessageCenter {
    static sendMultipleUpdated(data: iMultiplesInconsistencies){
        if(!data || !data.profile || !data.profile.user || 
            !data.oldMultiple.matches || !data.newMultiple.matches ||
            data.oldMultiple.matches.length == 0 || data.newMultiple.matches.length == 0) return

        const message = generateMultipleText(data.oldMultiple,data.newMultiple)


        CommandCenter.sendUserMessage(data.profile.user,message)
    }
    
    static sendMultipleCreated(multiple: Multiple){
        if(!multiple || !multiple.profile || !multiple.profile.user || 
            !multiple.matches || multiple.matches.length == 0) return

        const message = generateMultipleText(multiple)

        CommandCenter.sendUserMessage(multiple.profile.user,message)
    }
}