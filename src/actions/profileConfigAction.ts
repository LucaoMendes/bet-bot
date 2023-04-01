import { WizardContext } from "telegraf/typings/scenes"
import { iAction } from "../interfaces/iAction"

async function profileConfigAction(ctx: WizardContext){
    ctx.editMessageText(`Olá ${ctx.from?.first_name}, tudo bem?`+
                        `\nVocê já está cadastrado!` +
                        `\nEnvie /help para ver os comandos disponíveis!`,undefined)
    ctx.scene.enter('profileConfigScene')
}

const ProfileConfigAction:iAction = {
    name: 'profile-config',
    description: 'Configuração de perfil de apostas',
    from: 'start',
    function: profileConfigAction,
}

export default ProfileConfigAction