export interface iSaveResponse {
    status: 'exists' | 'created' | 'error' | 'updated'
    data?: any
}