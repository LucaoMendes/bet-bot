export interface iSaveResponse {
    status: 'exists' | 'created' | 'error'
    data?: any
}