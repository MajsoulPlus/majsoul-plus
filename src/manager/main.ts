import * as path from 'path'
import * as fs from 'fs'
import { Ping } from './utils/Ping'
import LeftPanel from './ui/Panel'
import setting from './pages/Setting'
import about from './pages/About'
import Global from './global'

class Manager {
  private options: {}

  constructor(options: {}) {
    this.options = options
  }

  init = () => {
    // TODO: support more server types
    new Ping('zh').init()
    LeftPanel.init()
  }

  private saveSettings = () => {
    setting.save()
  }
}

const managerOptions = {
  userConfig: (() => {
    if (fs.existsSync(Global.UserConfigPath)) {
      require(Global.UserConfigPath)
    } else {
      return require('../Configs-user.json')
    }
  })(),
  resourcepackRootDir: path.join(Global.appDataDir, Global.ResourcePackDir),
  extensionRootDir: path.join(Global.appDataDir, Global.ExtensionDir),
  toolRootDir: path.join(Global.appDataDir, Global.ToolsDir)
}

const manager = new Manager(managerOptions)
manager.init()
