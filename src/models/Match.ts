import { Model , DataTypes } from 'sequelize'
import database from '../database'
import Logger from '../utils/Logger'

class Match extends Model { 
    public id!: number
    public sport_id!: number
    public name!: string
    public slug!: string
    public time_details !: JSON
    public home_team_id!: number
    public home !: JSON
    public away_team_id!: number
    public away !: JSON
    public league_id!: number
    public league !: JSON
    public challenge_id!: number
    public challenge !: JSON
    public season_id!: number
    public season !: JSON
    public status!: string
    public status_more!: string
    public start_at!: Date
    public priority!: number
    public home_score!: JSON
    public away_score!: JSON
    public winner_code!: number
    public round_number!: number
    public main_odds!: JSON

    public readonly createdAt!: Date
    public readonly updatedAt!: Date
}

Match.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        home_team_id: DataTypes.INTEGER,
        home: DataTypes.JSON,
        away_team_id: DataTypes.INTEGER,
        away: DataTypes.JSON,
        league_id: DataTypes.INTEGER,
        league: DataTypes.JSON,
        challenge_id:DataTypes.INTEGER,
        challenge: DataTypes.JSON,
        season_id:DataTypes.INTEGER,
        season: DataTypes.JSON,
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        slug: DataTypes.STRING,
        time_details: DataTypes.JSON,
        status: DataTypes.STRING,
        status_more: DataTypes.STRING,
        start_at: DataTypes.DATE,
        priority: DataTypes.INTEGER,
        home_score: DataTypes.JSON,
        away_score: DataTypes.JSON,
        winner_code: DataTypes.INTEGER,
        round_number: DataTypes.INTEGER,
        main_odds: DataTypes.JSON,
    },
    {
        timestamps: true,
        sequelize: database.connection,
        modelName: 'matches'
    }
)

Match.addHook(
    'beforeSave',
    async(match:Match): Promise<void> => {
        Logger.send(`Adicionando Partida: ${match.id}`)
    }
)

export default Match











