import { WizardContext, WizardSessionData } from 'telegraf/typings/scenes'

export interface iCommand {
    path?: string
    description: string
    command: string
    function: ((ctx: WizardContext<WizardSessionData>) => Promise<void>)
}