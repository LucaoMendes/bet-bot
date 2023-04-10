import { Model , DataTypes } from 'sequelize'
import database from '../database'
import Logger from '../utils/Logger'
import Match from './Match'
import Multiple from './Multiple'
import { eMatchStatus } from '../utils/MatchUtils'

class MultipleMatch extends Model { 
    public id!: number
    public multiple_id!: number
    public match_id!: number
    public score!: any
    public home_odd!: number
    public draw_odd!: number
    public away_odd!: number
    public preview!: string
    public result!: string
    public status!: eMatchStatus
    public match?: Match

    public readonly startAt!: Date
    public readonly createdAt!: Date
    public readonly updatedAt!: Date
}

MultipleMatch.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        multiple_id:{
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'multiples',
          },
        },
        score:DataTypes.JSON,
        match_id:{
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'matches',
          },
        },
        home_odd:{
          type: DataTypes.DOUBLE,
          allowNull: false,
        },
        draw_odd:{
          type: DataTypes.DOUBLE,
          allowNull: false,
        },
        away_odd:{
          type: DataTypes.DOUBLE,
          allowNull: false,
        },
        preview:{
          type: DataTypes.STRING,
          allowNull: false,
        },
        result:{
          type: DataTypes.STRING,
          allowNull: false,
        },
        status:{
          type: DataTypes.STRING,
          allowNull: false,
        },
        startAt:{
          type: DataTypes.DATE,
          allowNull: false,
        },
    },
    {
        timestamps: true,
        sequelize: database.connection,
        modelName: 'multiples_matches'
    }
)

MultipleMatch.belongsTo(Match,{
  foreignKey: 'match_id'
})

Multiple.hasMany(MultipleMatch,{
  foreignKey: 'multiple_id',
  as: 'matches'
})

MultipleMatch.addHook(
    'beforeSave',
    async(multipleMatch:MultipleMatch): Promise<void> => {
        Logger.send(`Adicionando partida ${multipleMatch.match_id} a multipla ${multipleMatch.multiple_id}`)
    }
)

export default MultipleMatch











