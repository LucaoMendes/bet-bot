import { CommandCenter } from "../services/CommandCenter"

const fs = require('fs')
const path = require('path')
const basename = path.basename(__filename)

fs
  .readdirSync(__dirname)
  .filter((file:any) => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.ts')
  })
  .forEach((file:any) => {
    const action = require(path.join(__dirname, file)).default
    action.path = path.join(__dirname, file)
    
    CommandCenter.registerAction(action)    
  })

module.exports = CommandCenter