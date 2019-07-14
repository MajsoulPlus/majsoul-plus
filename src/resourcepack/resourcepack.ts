import { ipcMain } from 'electron'
import * as fs from 'fs'
import { Global } from '../global'
import ResourcePackmanager from './manager'

export function LoadResourcePack() {
  // 从配置文件(active.json) 加载资源包
  // 配置文件中只存储需要加载的资源包的 ID
  // 详细的数据保存在各资源包的 resourcepack.json 内

  const enabled: string[] = JSON.parse(
    fs.readFileSync(Global.ResourcePackConfigPath, {
      encoding: 'utf-8'
    })
  )
  enabled.forEach(resourcepack => ResourcePackmanager.use(resourcepack))

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
