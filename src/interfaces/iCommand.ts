import { Context } from 'telegraf'

export interface iCommand {
    path?: string
    description: string
    command: string
    function: (ctx:Context) => void
}