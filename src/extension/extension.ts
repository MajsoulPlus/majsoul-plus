import { Global } from '../global'
import { getFoldersSync } from '../utils'
import manager from './manager'

// tslint:disable-next-line
export let ExtensionManager: manager

export function LoadExtension() {
  // 初始化 manager
  ExtensionManager = new manager(Global.ExtensionConfigPath)

  const extension: string[] = getFoldersSync(Global.ExtensionFolderPath)
  extension.forEach(extension => ExtensionManager.load(extension))
  ExtensionManager.enableFromConfig()
  ExtensionManager.save()
}
