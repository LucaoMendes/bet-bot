import { CommandCenter } from './services/CommandCenter'

import dotenv = require('dotenv')
dotenv.config()
import './commands'
import './middlewares'
import './actions'
import './scenes'


CommandCenter.init()