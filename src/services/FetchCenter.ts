import axios from "axios"
import { iDateMatches } from "../interfaces/iFetchResponses"
import Match from "../models/Match"
import Logger from "../utils/Logger"

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

    private static async get<T>(path: string): Promise<T> {
        const response = await axios.get(`${this.BASE_URL}/${path}`)
        const json = response.data as T
        return json
    }
}