import { Context } from "telegraf"
import { Update } from "telegraf/typings/core/types/typegram"
import { WizardContext, WizardSessionData } from "telegraf/typings/scenes"

export interface iAction {
    name: string
    description: string
    from: string
    function: (ctx: WizardContext<WizardSessionData>) => Promise<void>
}