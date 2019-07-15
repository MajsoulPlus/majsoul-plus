import { Global } from '../global'
import { getFoldersSync } from '../utils'
import manager from './manager'

// tslint:disable-next-line
export let ResourcePackManager: manager

export function LoadResourcePack() {
  // 初始化 manager
  ResourcePackManager = new manager(Global.ResourcePackConfigPath)

  // 扫描目录
  const resourcepacks: string[] = getFoldersSync(Global.ResourceFolderPath)
  resourcepacks.forEach(resourcepack => ResourcePackManager.load(resourcepack))
  ResourcePackManager.enableFromConfig()
  ResourcePackManager.save()
}
