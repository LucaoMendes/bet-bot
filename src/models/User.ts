import { Model , DataTypes } from 'sequelize'
import database from '../database'
import Logger, { LogType } from '../utils/Logger'

class User extends Model { 
    public id!: number
    public first_name!: string
    public last_name!: string
    public user_name!: string
    public active!: boolean
    public admin!: boolean
    public chat_id!: string

    public readonly createdAt!: Date
    public readonly updatedAt!: Date
}

User.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        first_name: DataTypes.STRING,
        last_name: DataTypes.STRING,
        user_name: DataTypes.STRING,
        active:{
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        admin:{
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        chat_id: DataTypes.STRING,
    },
    {
        timestamps: true,
        sequelize: database.connection,
        tableName: 'users',
    }
)

User.addHook('afterCreate', (user:User) => {
    Logger.send(`Usuário adicionado: ${JSON.stringify(user)}`, LogType.INFO)
})

export default User