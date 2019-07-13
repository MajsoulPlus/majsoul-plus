import * as fs from 'fs'
import { Global } from '../global'
import { MajsoulPlus } from '../majsoul_plus'
import ResourcePackmanager from './manager'

export const defaultResourcePack: MajsoulPlus.ResourcePack = {
  id: 'majsoul_plus',
  version: '2.0.0',
  name: 'Majsoul Plus',
  author: 'Majsoul Plus Team',
  description: 'No description provided.',
  preview: 'preview.png',

  dependencies: {},
  replace: []
}

Object.freeze(defaultResourcePack)

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
}
