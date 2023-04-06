import cron from 'node-cron'
import { iRoutine } from '../interfaces/iRoutine'
import Logger, { LogType } from '../utils/Logger'

export class RoutineCenter {

    private static routines:iRoutine[] = []
    

    public static async init() {
        if(this.routines.length == 0){
            Logger.send('Nenhuma rotina foi encontrada',LogType.ERROR)
            return
        }
        this.routines.forEach(routine => {
            if(!routine.active)
                return
            try{
                routine.function()
                cron.schedule(routine.expression, routine.function)
            }catch(e){
                Logger.send(`Erro ao criar rotina ${routine.name}`,LogType.ERROR)
                Logger.send(JSON.stringify(e),LogType.ERROR)
            }
        })
    }

    public static registerRoutine(routine:iRoutine) {
        Logger.send(`Registrando rotina: ${routine.name}`)
        
        this.routines.push(routine)
    }
    
}