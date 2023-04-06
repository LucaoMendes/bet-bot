import { Context } from "telegraf"
import { iSaveResponse } from "../interfaces/iSaveResponse"
import User from "../models/User"
import Logger, { LogType } from "../utils/Logger"

export default class UserController {
    static async save(ctx:Context):Promise<iSaveResponse>{
        if(!ctx || !ctx.from){
            Logger.send(`Context Inválido, ${JSON.stringify(ctx)} - UserController.save`,LogType.ERROR)
            return { status: 'error' }
        }

        const existsUser = await User.findOne({
            where:{chat_id: ctx.from.id}
        })

        if(existsUser){
            Logger.send(`Usuário já cadastrado, ${JSON.stringify(ctx.from.username)} - UserController.save`,LogType.INFO)
            return { status: 'exists' , data: existsUser.dataValues }
        }
        
        try {
            const userCreated = await User.create({
                                    first_name: ctx.from.first_name,
                                    last_name: ctx.from.last_name,
                                    user_name: ctx.from.username,
                                    chat_id: ctx.from.id,
                                })
            return { status: 'created' , data: userCreated.dataValues}
        }catch(e:any){
            Logger.send(JSON.stringify(e),LogType.ERROR)
        }
        return { status: 'error' }
    }
}