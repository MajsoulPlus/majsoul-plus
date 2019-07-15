import { ipcMain } from 'electron'
import * as fs from 'fs'
import { Global } from '../global'
import { getFoldersSync } from '../utils'
import ResourcePackmanager from './manager'

export function LoadResourcePack() {
  // 从配置文件(active.json) 加载资源包
  // 配置文件中只存储需要加载的资源包的 ID
  // 详细的数据保存在各资源包的 resourcepack.json 内

  // FIXME: 这里应该扫描整个目录
  const resourcepacks: string[] = getFoldersSync(Global.ResourceFolderPath)
  resourcepacks.forEach(resourcepack => ResourcePackmanager.use(resourcepack))
  const enabled = ResourcePackmanager.sort()
  fs.writeFileSync(
    Global.ResourcePackConfigPath,
    JSON.stringify(enabled, null, 2),
    {
      encoding: 'utf-8'
    }
  )

  ipcMain.on('get-resourcepack-details', (event: Electron.Event) => {
    event.returnValue = ResourcePackmanager.getDetails()
  })

  ipcMain.on('zip-resourcepack', (event: Electron.Event) => {
    // TODO
    event.returnValue = {}
  })

  ipcMain.on('remove-resourcepack', (event: Electron.Event) => {
    // TODO
    event.returnValue = {}
  })
}
