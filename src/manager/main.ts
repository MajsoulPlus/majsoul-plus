import { Global, GlobalPath, appDataDir } from '../global'
import * as path from 'path'
import * as fs from 'fs'
import { Ping } from './utils/Ping'
import { LeftPanel } from './common/Panel'

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
}

// 此处只留下一个路径
// 原目录下的各目录/工具应在初始化时拷贝到对应目录
const userDataPaths = [appDataDir]

const managerOptions = {
  userConfig: (() => {
    if (fs.existsSync(Global.UserConfigPath)) {
      require(Global.UserConfigPath)
    } else {
      return require('../Configs-user.json')
    }
  })(),
  modRootDirs: userDataPaths.map(root => path.join(root, GlobalPath.ModsDir)),
  executeRootDirs: userDataPaths.map(root =>
    path.join(root, GlobalPath.ExecutesDir)
  ),
  extensionRootDirs: userDataPaths.map(root =>
    path.join(root, GlobalPath.ExtensionDir)
  ),
  toolRootDirs: userDataPaths.map(root => path.join(root, GlobalPath.ToolsDir))
}

const manager = new Manager(managerOptions)
manager.init()
