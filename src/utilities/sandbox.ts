import Utility from './utility'
import { ipcMain } from 'electron'
import * as path from 'path'
import { appDataDir } from '../global'

class SandBox extends Utility {
  constructor() {
    super()
    this.name = 'SandBox'
  }

  protected execute() {
    ipcMain.on('sandbox-dirname-request', event => {
      event.returnValue = path.resolve(__dirname, '..')
    })
    ipcMain.on('sandbox-appdata-request', event => {
      event.returnValue = appDataDir
    })
  }
}

export default new SandBox()
