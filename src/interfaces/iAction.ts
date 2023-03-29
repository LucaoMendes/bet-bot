import { Context } from "telegraf"

export interface iAction {
    name: string
    description: string
    from: string
    function: (ctx: Context) => Promise<void>
}