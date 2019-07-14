import * as fs from 'fs'
import { Global } from '../global'
import ExtensionManager from './manager'
import { ipcMain, Event } from 'electron'

export function LoadExtension() {
  // Load from config file

  // Config file should only save extension folder name
  // Detailed setting should be read from dedicated files

  // TODO: Toposort for extension dependencies
  const enabled: string[] = JSON.parse(
    fs.readFileSync(Global.ExtensionConfigPath, {
      encoding: 'utf-8'
    })
  )
  enabled.forEach(extension => ExtensionManager.use(extension))

  // Register ipcMain
  ipcMain.on('get-extension-details', (event: Event) => {
    event.returnValue = ExtensionManager.getDetails()
  })

  ipcMain.on('zip-extension', (event: Electron.Event) => {
    // TODO
    event.returnValue = {}
  })

  ipcMain.on('remove-extension', (event: Electron.Event) => {
    // TODO
    event.returnValue = {}
  })
}
