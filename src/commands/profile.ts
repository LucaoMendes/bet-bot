import { WizardContext } from "telegraf/typings/scenes"
import { iCommand } from "../interfaces/iCommand"

async function profileCommand(ctx: WizardContext){
    await ctx.scene.enter('profileConfigScene')
}
const ProfileCommand:iCommand = {
    description: 'Configurações do perfil de apostador',
    command: 'profile',
    function: profileCommand,
}
export default ProfileCommand