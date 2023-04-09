import { iSaveResponse } from "../interfaces/iSaveResponse"
import Multiple from "../models/Multiple"
import MultipleMatch from "../models/MultipleMatch"
import Logger, { LogType } from "../utils/Logger"

export default class MultipleController {
    static async save(multiple:any):Promise<iSaveResponse>{
        if(!multiple || !multiple.user_profile_id){
            Logger.send(`Multiple Inválida, ${JSON.stringify(multiple)} - MultipleController.save`,LogType.ERROR)
            return { status: 'error' }
        }

        if(!multiple.matches || multiple.matches.length == 0){
            Logger.send(`Multiple Inválida, ${JSON.stringify(multiple)} sem partidas - MultipleController.save`,LogType.ERROR)
            return { status: 'error' }
        }

        try {
            const multipleSaved = await Multiple.create(multiple)
            const promises:Promise<any>[] = []
            multiple.matches?.forEach(async (match:any) => {
                promises.push(MultipleMatch.create({
                    multiple_id: multipleSaved.id,
                    ...match
                }))
            })

            await Promise.all(promises)

            return { status:'created' , data: multipleSaved }
        }catch(e:any){
            Logger.send(JSON.stringify(e),LogType.ERROR)
        }
        return { status: 'error' }
    }

    static async saveAll(multiples:any[]):Promise<iSaveResponse>{
        if(!multiples || multiples.length == 0){
            Logger.send(`Multiples Inválidas, ${JSON.stringify(multiples)} - MultipleController.saveAll`,LogType.ERROR)
            return { status: 'error' }
        }

        try {
            const promises:Promise<any>[] = []
            multiples.forEach(async (multiple:any) => {
                promises.push(this.save(multiple))
            })

            const multiplesSaved = await Promise.all(promises)

            return { status:'created' , data: multiplesSaved }
        }catch(e:any){
            Logger.send(JSON.stringify(e),LogType.ERROR)
        }
        return { status: 'error' }
    }

    static async update(multiple:any):Promise<iSaveResponse>{
        //Todo cuidado para não sofrer alterações nas previsões! somente nos dados mútaveis
        if(!multiple || !multiple.id || !multiple.user_profile_id){
            Logger.send(`Multiple Inválida, ${JSON.stringify(multiple)} - MultipleController.update`,LogType.ERROR)
            return { status: 'error' }
        }

        const dataToSave = {
            user_profile_id: multiple.user_profile_id,
            green: multiple.green,
            red: multiple.red,
            running: multiple.running,
            status: multiple.status,
            cashout: multiple.cashout,
            matches: multiple.matches
        }

        try {
            const multipleSaved = await Multiple.update(dataToSave,{ where: { id: multiple.id }})

            const promises:Promise<any>[] = []

            multiple.matches.forEach(async (match:any) => {
                const matchToSave = {
                    score: match.score,
                    result: match.result,
                    status: match.status,
                }
                promises.push(MultipleMatch.update(matchToSave,{ where: {
                    multiple_id: multiple.id,
                    match_id: match.match_id
                 }}))
            })

            const multipleMatchesSaved = await Promise.all(promises)

            return { status:'updated' , data: {multiple:multipleSaved,matches:multipleMatchesSaved} }
        }catch(e:any){
            Logger.send(JSON.stringify(e),LogType.ERROR)
        }
        return { status: 'error' }
    }
}