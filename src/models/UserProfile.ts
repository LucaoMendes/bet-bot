import { Model , DataTypes } from 'sequelize'
import database from '../database'
import Logger, { LogType } from '../utils/Logger'
import User from './User'

class UserProfile extends Model { 
    public id!: number
    public user_id!: number
    public min_odd!: number
    public max_odd!: number
    public team_priority!: string
    public max_matches!: number
    public bet_value!: number
    public user ?: User

    public readonly createdAt!: Date
    public readonly updatedAt!: Date
}

UserProfile.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        user_id: {
            allowNull: false,
            type: DataTypes.INTEGER,
            references: 'users',     
            unique: true, 
        },
        min_odd: DataTypes.INTEGER,
        max_odd: DataTypes.INTEGER,
        team_priority: DataTypes.STRING,
        max_matches: DataTypes.INTEGER,
        bet_value: DataTypes.INTEGER,
    },
    {
        timestamps: true,
        updatedAt: true,
        sequelize: database.connection,
        tableName: 'users_profiles',
    }
)

UserProfile.belongsTo(User, {foreignKey: 'user_id', as: 'user'})

UserProfile.addHook('afterCreate', (userProfile:UserProfile) => {
    Logger.send(`Perfil de apostador adicionado: ${JSON.stringify(userProfile)}`, LogType.INFO)
})
UserProfile.addHook('afterUpdate', (userProfile:UserProfile) => {
    Logger.send(`Perfil de apostador atualizado: ${JSON.stringify(userProfile)}`, LogType.INFO)
})

export default UserProfile