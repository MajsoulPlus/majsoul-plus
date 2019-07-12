import * as fs from 'fs'
import { Global } from '../global'
import { MajsoulPlus } from '../majsoul_plus'
import resourcePackmanager from './manager'

export const defaultResourcePack: MajsoulPlus.ResourcePack = {
  id: 'sample',
  version: '1.0.0',
  name: 'sample_pack',
  author: 'Majsoul Plus Team',
  description: 'No description provided.',
  preview: 'preview.png',

  dependencies: {},
  replace: []
}

Object.freeze(defaultResourcePack)

export function LoadResourcePack() {
  // Load from config file

  // Config file should only save extension folder name
  // Detailed setting should be read from dedicated files

  // TODO: Tool to convert old files, but not written in new code
  // TODO: Toposort for extension dependencies
  const enabled: string[] = JSON.parse(
    fs.readFileSync(Global.ResourcePackConfigPath, {
      encoding: 'utf-8'
    })
  )
  enabled.forEach(resourcepack => resourcePackmanager.use(resourcepack))
}
