import { Model , DataTypes } from 'sequelize'
import database from '../database'
import Logger from '../utils/Logger'
import { iMultipleNotifications } from '../interfaces/iMultipleNotifications'

class MultipleMatch extends Model { 
    public id!: number
    public multiple_id!: number
    public match_id!: number
    public notification_status!:iMultipleNotifications
    public preview!: 'home_preview' | 'draw_preview' | 'away_preview'
    public home_odd!: number
    public draw_odd!: number
    public away_odd!: number
    public cashout!: boolean

    public readonly startAt!: Date
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
        match_id:{
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'matches',
          },
        },
        preview:{
          type: DataTypes.STRING,
          allowNull: false,
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
        notification_status:{
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: 'multiple_created',
        },
        cashout:{
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        startAt:{
          type: DataTypes.DATE,
          allowNull: false,
        },
    },
    {
        timestamps: true,
        sequelize: database.connection,
        modelName: 'multiples'
    }
)

MultipleMatch.addHook(
    'beforeSave',
    async(multipleMatch:MultipleMatch): Promise<void> => {
        Logger.send(`Adicionando partida ${multipleMatch.match_id} a multipla ${multipleMatch.multiple_id}`)
    }
)

export default MultipleMatch











