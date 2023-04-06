export interface iRoutine {
    name: string
    description: string
    expression: string
    active: boolean
    function: ( () => void ) | ( () => Promise<void> )
}