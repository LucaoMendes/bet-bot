import { Context } from 'telegraf'

export interface iCommand {
    command: string
    function: (ctx:Context) => void
}