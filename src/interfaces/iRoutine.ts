export interface iRoutine {
    name: string;
    description: string;
    expression: string;
    function: ( () => void ) | ( () => Promise<void> );
}