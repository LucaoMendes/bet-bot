import cron from 'node-cron'
import { iRoutine } from '../interfaces/iRoutine'
import Logger, { LogType } from '../utils/Logger'
import { analyzeAllMultiples } from '../utils/MultipleUtils'

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
                cron.schedule(routine.expression, routine.function)
            }catch(e){
                Logger.send(`Erro ao criar rotina ${routine.name}`,LogType.ERROR)
                Logger.send(JSON.stringify(e),LogType.ERROR)
            }
        })

        this.executeAnalyzeMultiples()
        
    }

    private static async executeAnalyzeMultiples(){
        
        await analyzeAllMultiples()
        this.delay(1000).then(() => this.executeAnalyzeMultiples())
    }

    public static registerRoutine(routine:iRoutine) {
        Logger.send(`Registrando rotina: ${routine.name}`)
        
        this.routines.push(routine)
    }
    
    private static async delay (ms: number) {
        return  new Promise( resolve => setTimeout(resolve, ms) )
    }
}