import { Context } from "telegraf"
import { iMiddleware } from "../interfaces/iMiddleware"
import User from "../models/User"
import UserProfile from "../models/UserProfile"
import Logger, { LogType } from "../utils/Logger"

async function authMiddleware(ctx:Context, next: () => Promise<void>){
    if(!ctx.from) {
        await ctx.reply("ERROR: Não foi possível obter o seus dados")
        return
    } 

    console.time(`Tempo de resposta para [${ctx.from?.id}] ${ctx.from?.first_name}`)

    const user = await User.findOne({where:{chat_id: ctx.from?.id}})
    if(user){    
        ctx.state.user = user?.dataValues
        const userProfile = await UserProfile.findOne({where:{user_id: user?.id}})
        ctx.state.userProfile = userProfile?.dataValues
    }
    
    
    

    try{
        await next()
    }catch(e){
        Logger.send(`Erro ${e}`, LogType.ERROR)
    }

    console.timeEnd(`Tempo de resposta para [${ctx.from?.id}] ${ctx.from?.first_name}`)
}
const AuthMiddleware:iMiddleware = {
    name: 'authMiddleware',
    description: 'Responsável por realizar o reconhecimento e autorização do chat em questão',
    function: authMiddleware,
    priority: 999
}
export default AuthMiddleware