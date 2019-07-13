import * as fs from 'fs'
import { Global } from '../global'
import { MajsoulPlus } from '../majsoul_plus'
import ExtensionManager from './manager'
import { ipcMain, Event } from 'electron'

export const defaultExtensionPermission: MajsoulPlus.ExtensionPreferences = {
  nodeRequire: false,
  document: false,
  localStorage: false,
  XMLHttpRequest: false,
  WebSocket: false,
  writeableWindowObject: false
}

export const defaultExtension: MajsoulPlus.Extension = {
  id: 'majsoul_plus',
  version: '2.0.0',
  name: 'Majsoul Plus',
  author: 'Majsoul Plus Team',
  description: 'No description provided.',
  dependencies: {},
  preview: 'preview.png',
  entry: 'script.js',
  loadBeforeGame: false,
  executePreferences: defaultExtensionPermission
}

Object.freeze(defaultExtension)
Object.freeze(defaultExtensionPermission)

export function LoadExtension() {
  // Load from config file

  // Config file should only save extension folder name
  // Detailed setting should be read from dedicated files

  // TODO: Tool to convert old files, but not written in new code
  // TODO: Toposort for extension dependencies
  const enabled: string[] = JSON.parse(
    fs.readFileSync(Global.ExtensionConfigPath, {
      encoding: 'utf-8'
    })
  )
  enabled.forEach(extension => ExtensionManager.use(extension))

  // Register ipcMain
  ipcMain.on('extension-list', (event: Event) => {
    event.returnValue = []
  })

  ipcMain.on('extension-detail', (event: Event) => {
    event.returnValue = ExtensionManager.getDetails()
  })
}
