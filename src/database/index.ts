import Sequelize from 'sequelize'
import Logger, { LogType } from '../utils/Logger'

const databaseConfig = require('../config/db')

class Database {
  public connection!: Sequelize.Sequelize

  constructor() {
    this.init()
  }

  async init(): Promise<void> {
    this.connection = new Sequelize.Sequelize(databaseConfig)
    try {
      await this.connection.authenticate();
      Logger.send(`Conexão estabelecida com o banco de dados ${databaseConfig.database}`)
    } catch (error) {
      Logger.send(`Erro ao se conectar com o banco de dados: ${error}`,LogType.ERROR)
    }
  }
}

const database: Database = new Database();


export default database;