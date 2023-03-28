export default class Logger {
    public static send(msg:string,type?:LogType){
        if(!msg || msg!.length == 0)
            throw new Error('[LOGGER] Send function without message')
        if((type != LogType.WARNING && type != LogType.ERROR) && process.env.SHOW_INFOS == 'true')
            return console.log(`[${new Date().toLocaleString()}][${type?LogType[type]:LogType[LogType.INFO]}] ${msg}`)
        if(type == LogType.WARNING && process.env.SHOW_WARNINGS == 'true')
            return console.warn(`[${new Date().toLocaleString()}][${LogType[type]}] ${msg}`)
        if(type == LogType.ERROR && process.env.SHOW_ERRORS == 'true')
            return console.error(`[${new Date().toLocaleString()}][${LogType[type]}] ${msg}`)                    
    }
} 
interface LogState{
    type:LogType
    msg?:String
}

export enum LogType{
    ERROR,
    WARNING,
    INFO,
    CRON,
    WEBSOCKET
}