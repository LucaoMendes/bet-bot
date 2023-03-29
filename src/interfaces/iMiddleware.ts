import { Context } from "telegraf"

export interface iMiddleware {
    name: string
    description: string
    function: (ctx: Context, next: () => Promise<void>) => Promise<void>
}