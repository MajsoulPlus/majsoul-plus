import { ipcMain } from 'electron'
import { Global } from '../global'
import { getFoldersSync } from '../utils'
import manager from './manager'

export let ExtensionManager: manager

export function LoadExtension() {
  // 初始化 manager
  ExtensionManager = new manager(Global.ExtensionConfigPath)

  function load() {
    // 加载配置
    ExtensionManager.loadEnabled()

    // 扫描目录
    const extension: string[] = getFoldersSync(Global.ExtensionFolderPath)
    extension.forEach(extension => ExtensionManager.load(extension))
    ExtensionManager.enableFromConfig()
    ExtensionManager.save()
  }

  load()

  ipcMain.on('refresh-extension', event => {
    ExtensionManager.clear()
    load()
    event.returnValue = ExtensionManager.getDetails()
  })
}
