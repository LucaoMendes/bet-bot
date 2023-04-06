import { Scenes } from "telegraf"
import { WizardScene } from "telegraf/typings/scenes"

export interface iScene {
    name: string
    description: string
    scene: WizardScene<Scenes.WizardContext>
}