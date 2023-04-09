import axios from "axios"
import { iDateMatches } from "../interfaces/iFetchResponses"
import Match from "../models/Match"
import Logger, { LogType } from "../utils/Logger"

export class FetchCenter {
    private static BASE_URL = 'http://api.stcesporte.com'

    public static async getDateMatches(date: string, page = 1, perPage = 50): Promise<Match[]> {

        const path = `/matches/date/${date}?page=${page}&perPage=${perPage}`
        
        const json = await this.get<iDateMatches>(path)

        if (!json.pager || json.pager.page >= json.pager.totalPages) {
            return json.data
        }
        return [...json.data, ...(await this.getDateMatches(date, json.pager.page + 1, 100))]
    }

    public static async getMatchById(id: number): Promise<Match> {
        const path = `/matches/${id}`
        const json = await this.get<Match>(path)

        return json
    }

    public static async getLiveMatches(): Promise<Match[]> {
        const path = `/matches/live`        
        const json = await this.get<Match[]>(path) 

        return json
    }

    private static async get<T>(path: string): Promise<T> {
        try{
            const response = await axios.get(`${this.BASE_URL}${path}?bws`,{
                timeout: 100000,
            })
            const json = response.data as T
            return json
        }catch(e){
            Logger.send(`ERRO ao fetch ${path} - ${e}`,LogType.ERROR)
            return this.get(path)
        }
    }
}