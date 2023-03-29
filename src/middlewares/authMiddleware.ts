import { Context } from "telegraf"
import { iMiddleware } from "../interfaces/iMiddleware"
import User from "../models/User"
import Logger, { LogType } from "../utils/Logger"

async function authMiddleware(ctx:Context, next: () => Promise<void>){
    if(!ctx.from) {
        await ctx.reply("ERROR: Não foi possível obter o seus dados")
        return
    } 

    console.time(`Tempo de resposta para [${ctx.from?.id}] ${ctx.from?.first_name}`)

    const user = await User.findOne({where:{chat_id: ctx.from?.id}})

    ctx.state.data = user?.dataValues

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
}
export default AuthMiddleware