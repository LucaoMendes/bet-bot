import { Model , DataTypes } from 'sequelize'
import database from '../database'
import Logger from '../utils/Logger'

class Multiple extends Model { 
    public id!: number
    public user_profile_id!: number
    public matches_count!: number
    public green!: boolean

    public readonly createdAt!: Date
    public readonly updatedAt!: Date
}

Multiple.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        user_profile_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'users_profiles',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        matches_count: {
          type: DataTypes.INTEGER,
          defaultValue: 0
        },
        green: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
    },
    {
        timestamps: true,
        sequelize: database.connection,
        modelName: 'multiples'
    }
)

Multiple.addHook(
    'beforeSave',
    async(multiple:Multiple): Promise<void> => {
        Logger.send(`Adicionando Múltipla: ${multiple.id}`)
    }
)

export default Multiple











