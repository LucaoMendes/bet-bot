import Match from "../models/Match"

export interface iDateMatches{
    pager: iPager
    data: Match[]
}

interface iPager {
    page: number
    perPage: number
    totalPages: number
    total: number
}