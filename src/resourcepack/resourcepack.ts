import { ipcMain } from 'electron'
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

  ipcMain.on('get-resourcepack-details', (event: Electron.Event) => {
    event.returnValue = ResourcePackManager.getDetails()
  })

  ipcMain.on('save-resourcepack-enabled', (event: Electron.Event) => {
    ResourcePackManager.save()
    event.returnValue = ''
  })

  ipcMain.on(
    'change-resourcepack-enability',
    (event: Electron.Event, id: string, enabled: boolean) => {
      enabled ? ResourcePackManager.enable(id) : ResourcePackManager.disable(id)
      ResourcePackManager.save()
      event.returnValue = ResourcePackManager.getDetails()
    }
  )

  ipcMain.on('zip-resourcepack', (event: Electron.Event) => {
    // TODO
    event.returnValue = {}
  })

  ipcMain.on('remove-resourcepack', (event: Electron.Event) => {
    // TODO
    event.returnValue = {}
  })
}
