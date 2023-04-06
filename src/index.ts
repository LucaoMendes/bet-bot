import { CommandCenter } from './services/CommandCenter'
import { RoutineCenter } from './services/RoutineCenter'

import dotenv = require('dotenv')
dotenv.config()

import './commands'
import './middlewares'
import './actions'
import './scenes'
import './routines'


CommandCenter.init()
RoutineCenter.init()