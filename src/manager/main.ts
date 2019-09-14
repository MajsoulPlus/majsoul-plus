import * as path from 'path'
import * as os from 'os'
import Ping from './utils/Ping'
import i18n from '../i18n'
import Global from './global'

import Update from './ui/Update'
import LeftPanel from './ui/Panel'
import ResourcePacks from './pages/ResourcePacks'
import Extensions from './pages/Extensions'
import Tools from './pages/Tools'
import Setting from './pages/Setting'
import About from './pages/About'

import darkModeTheme from './extra/darkMode/main'
import springFestivalTheme from './extra/springFestivalTheme/main'
import prayForKyoani from './extra/prayForKyoani/main'
import { ipcRenderer, remote, shell } from 'electron'

class ResourceManager {
  private static userConfig = Setting.userConfig
  private static readonly extends: Function[] = []

  // 增加扩展样式
  static extend(theme: Function) {
    ResourceManager.extends.push(theme)
    return ResourceManager
  }

  static init() {
    Update.setUsePrerelease(
      ResourceManager.userConfig.update.prerelease
    ).checkUpdate()

    LeftPanel.init()
    Setting.init()
    ResourceManager.initRPC()
    ResourceManager.loadCards()
    ResourceManager.addEventListener()
    ResourceManager.runExtends()
    About.render()
    i18n.parseAllElementsText(document.documentElement)
    Ping.setServer(ResourceManager.userConfig.userData.serverToPlay).init()

    ipcRenderer.on('refresh-all', () => {
      Extensions.refresh()
      ResourcePacks.refresh()
      Tools.refresh()
    })
  }

  // 注册与主进程通讯的内容
  private static initRPC() {}

  // 加载 Card 资源
  private static loadCards() {
    ResourcePacks.load()
    Extensions.load()
    Tools.load()
  }

  private static refreshCard(type: string) {
    return () =>
      [ResourcePacks, Extensions, Tools]
        .filter(t => t.name === type)[0]
        .refresh()
  }

  private static addEventListener() {
    ;[ResourcePacks, Extensions, Tools].forEach(ext => {
      // 导入
      const importMSP = document.querySelector(`#install${ext.name}`)
      importMSP.addEventListener('click', ResourceManager.importMSP(ext.name))

      // 修改
      const changeEditable = document.querySelector(`#edit${ext.name}`)
      changeEditable.addEventListener(
        'click',
        ResourceManager.changeEditable(ext.name)
      )

      // 刷新
      const refresh = document.querySelector(`#refresh${ext.name}`)
      refresh.addEventListener('click', ResourceManager.refreshCard(ext.name))

      // 打开目录
      const openFolder = document.querySelector(`#openFolder${ext.name}`)
      openFolder.addEventListener('click', () => {
        console.log(path.join(Global.appDataDir, ext.name.toLowerCase()))
        shell.openItem(path.join(Global.appDataDir, ext.name.toLowerCase()))
      })
    })

    // 原生文件拖放
    const sections = document.querySelectorAll('section')
    sections.forEach(section => {
      section['ondragover'] = () => false
      section['ondragleave'] = () => false
      section['ondragend'] = () => false
      section['ondrop'] = event => {
        event.preventDefault()
        for (const file of event.dataTransfer.files) {
          const filePath = file.path
          const ext = path.extname(filePath)
          const type = {
            '.mspr': 'resourcepack',
            '.mspe': 'extension',
            '.mspm': 'extension',
            '.mspt': 'tool'
          }[ext]
          if (type) {
            ipcRenderer.sendSync(`import-${type}`, filePath)
          }
        }
        Extensions.refresh()
        ResourcePacks.refresh()
        Tools.refresh()
      }
    })

    window.addEventListener('blur', () => document.body.classList.add('blur'))
    window.addEventListener('focus', () =>
      document.body.classList.remove('blur')
    )

    // 启动游戏
    const launch = document.querySelector('#launch')
    launch.addEventListener('click', ResourceManager.gameStart)

    // 关闭 Manager
    const closeBtn = document.querySelector('#closeBtn')
    if (os.platform() === 'darwin') {
      closeBtn.className = 'close-btn darwin'
      // hack close bar
      const titlebar = document.querySelector('#titlebar')
      titlebar.classList.add('darwin')
      const closeButton = document.querySelector(
        'body > div > .close-btn.darwin'
      )
      titlebar.removeChild(closeButton)
    }
    closeBtn.addEventListener('click', window.close)
  }

  // 加载扩展 Manager 主题
  private static runExtends() {
    ResourceManager.extends.forEach(theme => theme(ResourceManager.userConfig))
  }

  // 游戏启动
  private static gameStart() {
    ResourceManager.saveSettings()
    ipcRenderer.send('start-game')
  }

  // 保存设置
  private static saveSettings() {
    Setting.save()
    ResourcePacks.save()
    Extensions.save()
    Tools.save()
  }

  // 从 MSP* 导入资源包 / 扩展 / 工具
  private static importMSP(type: string) {
    return () => {
      remote.dialog
        .showOpenDialog({
          title: i18n.text.manager.installFrom(),
          filters: [
            {
              name: i18n.text.manager.fileTypeMSPR(),
              extensions: ['mspr']
            },
            {
              name: i18n.text.manager.fileTypeMSPE(),
              extensions: ['mspe', 'mspm']
            },
            {
              name: i18n.text.manager.fileTypeMSPT(),
              extensions: ['mspt']
            }
          ].filter(ext => {
            return {
              ResourcePack: ['mspr'],
              Extension: ['mspe', 'mspm'],
              Tool: ['mspt']
            }[type].includes(ext.extensions[0])
          }),
          properties: ['openFile', 'multiSelections']
        })
        .then(files => {
          files.filePaths.forEach(file => {
            ipcRenderer.sendSync(`import-${type.toLowerCase()}`, file)
          })
          ResourceManager.refreshCard(type)()
        })
    }
  }

  // 修改 Editable
  private static changeEditable(type: string) {
    return () =>
      [ResourcePacks, Extensions, Tools]
        .filter(t => t.name === type)[0]
        .changeEditable()
  }
}

ResourceManager.extend(darkModeTheme)
  .extend(springFestivalTheme)
  .extend(prayForKyoani)
  .init()
