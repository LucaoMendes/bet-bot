import { Model , DataTypes } from 'sequelize'
import database from '../database'
import Logger from '../utils/Logger'
import MultipleMatch from './MultipleMatch'
import { eMultipleStatus } from '../utils/MultipleUtils'
import UserProfile from './UserProfile'

class Multiple extends Model { 
    public id!: number
    public user_profile_id!: number
    public matches_count!: number
    public multiple_odd!: number
    public green!: boolean
    public red!: boolean
    public running!: boolean
    public status!: eMultipleStatus
    public cashout!: boolean
    public startAt!: Date
    public matches?: MultipleMatch[]
    public profile?: UserProfile

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
        multiple_odd: {
          type: DataTypes.DOUBLE,
          defaultValue: 1
        },
        green: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        red: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        running: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        status:{
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
          allowNull: false
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
        // Logger.send(`Adicionando Múltipla: ${multiple.id}`)
    }
)

export default Multiple











