import { Global } from '../global'
import manager from './manager'
import { ipcMain, Event } from 'electron'
import { getFoldersSync } from '../utils'

// tslint:disable-next-line
export let ExtensionManager: manager

export function LoadExtension() {
  // 初始化 manager
  ExtensionManager = new manager(Global.ExtensionConfigPath)

  const extension: string[] = getFoldersSync(Global.ExtensionFolderPath)
  extension.forEach(extension => ExtensionManager.load(extension))
  ExtensionManager.enableFromConfig()
  ExtensionManager.save()

  // Register ipcMain
  ipcMain.on('get-extension-details', (event: Event) => {
    event.returnValue = ExtensionManager.getDetails()
  })

  ipcMain.on('save-extension-enabled', (event: Electron.Event) => {
    ExtensionManager.save()
    event.returnValue = ''
  })

  ipcMain.on(
    'change-extension-enability',
    (event: Electron.Event, id: string, enabled: boolean) => {
      enabled ? ExtensionManager.enable(id) : ExtensionManager.disable(id)
      ExtensionManager.save()
      event.returnValue = ExtensionManager.getDetails()
    }
  )

  ipcMain.on('zip-extension', (event: Electron.Event) => {
    // TODO
    event.returnValue = {}
  })

  ipcMain.on('remove-extension', (event: Electron.Event) => {
    // TODO
    event.returnValue = {}
  })
}
