const { LeftPanel: panel } = require('./ui/Panel')
const { Ping } = require('./utils/Ping')
const Update = require('./Update')
const setting = require('./pages/Setting').default
const about = require('./pages/About').default

const {
  ipcRenderer,
  remote: { dialog }
} = require('electron')
const AdmZip = require('adm-zip')
const path = require('path')
const os = require('os')

const ResourcePacks = require('./pages/ResourcePacks').default
const Extensions = require('./pages/Extensions').default
const Tools = require('./pages/Tools').default

const { appDataDir, Global, GlobalPath } = require('..//global')
const i18n = require('../i18n').default

class Manager {
  constructor(options) {
    this.options = options
    this.resourcepacks = ResourcePacks
    this.extensions = Extensions
    this.tools = Tools
    this._extends = []

    this._update = new Update(this.options.update)
    this._addEventListener = this._addEventListener.bind(this)
    this._import = this._import.bind(this)
    this._changeModEditable = this._changeResourcePackEditable.bind(this)
    this._changeExecuteEditable = this._changeExtensionEditable.bind(this)
    this._changeToolEditable = this._changeToolEditable.bind(this)
    this._loadCards = this._loadCards.bind(this)
    this._saveSettings = this._saveSettings.bind(this)
    this._getRootDirs = this._getRootDirs.bind(this)
    this._getInstallDirByExtname = this._getInstallDirByExtname.bind(this)
    this._runExtends = this._runExtends.bind(this)
    this.gameStart = this.gameStart.bind(this)
  }

  _saveSettings() {
    setting.save()
    this.resourcepacks.save()
    this.extensions.save()
    this.tools.save()
  }

  _changeResourcePackEditable() {
    this.resourcepacks.changeEditable()
  }

  _changeExtensionEditable() {
    this.extensions.changeEditable()
  }

  _changeToolEditable() {
    this.tools.changeEditable()
  }

  _getRootDirs() {
    const {
      userConfig: {
        userData: { useAppdataLibrary }
      },
      extensionRootDirs,
      executeRootDirs,
      toolRootDirs
    } = this.options
    const index = Number(!!useAppdataLibrary)
    return {
      extensionRootDir: extensionRootDirs[index],
      executeRootDir: executeRootDirs[index],
      toolRootDir: toolRootDirs[index]
    }
  }

  _getInstallDirByExtname(extname) {
    const {
      extensionRootDir,
      executeRootDir,
      toolRootDir
    } = this._getRootDirs()
    const map = {
      '.mspm': extensionRootDir,
      '.mspe': executeRootDir,
      '.mspt': toolRootDir
    }
    return map[extname]
  }

  _import() {
    dialog.showOpenDialog(
      {
        title: i18n.text.manager.installFrom(),
        filters: [
          {
            name: i18n.text.manager.fileTypeMajsoulPlusExtendResourcesPack(),
            extensions: ['mspm', 'mspe', 'mspt']
          }
        ],
        properties: ['openFile', 'multiSelections']
      },
      filenames => {
        if (filenames && filenames.length) {
          filenames.forEach(filename => {
            const unzip = new AdmZip(filename)
            const extname = path.extname(filename)
            const installDir = this._getInstallDirByExtname(extname)
            unzip.extractAllToAsync(installDir, true, err => {
              if (err) {
                alert(i18n.text.manager.installExtendResourcesFailed(err))
              } else {
                alert(i18n.text.manager.installExtendResourcesSucceeded())
                this._loadCards()
              }
            })
          })
        }
      }
    )
  }

  _addEventListener() {
    const installResourcePack = document.getElementById('installResourcePack')
    const installExtension = document.getElementById('installExtension')
    const installTool = document.getElementById('installTool')
    installResourcePack.addEventListener('click', this._import)
    installExtension.addEventListener('click', this._import)
    installTool.addEventListener('click', this._import)

    const editResourcePack = document.getElementById('editResourcePack')
    editResourcePack.addEventListener('click', this._changeResourcePackEditable)
    const editExtension = document.getElementById('editExtension')
    editExtension.addEventListener('click', this._changeExtensionEditable)
    const editTool = document.getElementById('editTool')
    editTool.addEventListener('click', this._changeToolEditable)

    window.addEventListener('blur', () => document.body.classList.add('blur'))
    window.addEventListener('focus', () =>
      document.body.classList.remove('blur')
    )

    const refreshResourcePack = document.getElementById('refreshResourcePack')
    const refreshExtension = document.getElementById('refreshExtension')
    const refreshTool = document.getElementById('refreshTool')
    refreshResourcePack.addEventListener('click', this._loadCards)
    refreshExtension.addEventListener('click', this._loadCards)
    refreshTool.addEventListener('click', this._loadCards)

    const launch = document.getElementById('launch')
    launch.addEventListener('click', this.gameStart)

    const closeBtn = document.getElementById('closeBtn')
    if (os.platform() === 'darwin') {
      closeBtn.className = 'close-btn darwin'
      // hack close bar
      const body = document.querySelector('body')
      body.classList.add('darwin')
      const closeButton = document.querySelector('body > .close-btn.darwin')
      body.removeChild(closeButton)
    }
    closeBtn.addEventListener('click', window.close)
  }

  _loadCards() {
    this.resourcepacks.load()
    this.extensions.load()
    this.tools.load()
  }

  _runExtends() {
    this._extends.forEach(fun => fun.call())
  }

  initRPC() {
    ipcRenderer.on('change-config', (_, data) => {
      let obj = data
      this.options.userConfig[obj.mainKey][obj.key] = obj.value
    })

    ipcRenderer.on('save-config', () => {
      this._saveSettings()
      ipcRenderer.send('close-manager')
    })
  }

  init() {
    this._update.checkUpdate()
    new Ping('zh').init()
    panel.init()
    setting.init()
    this.initRPC()
    this._loadCards()
    this._addEventListener()
    this._runExtends()
    about.render()
    i18n.parseAllElementsText(document.documentElement)
  }

  gameStart() {
    this._saveSettings()
    setting.save()
    ipcRenderer.send('start-game')
  }

  // add a function after init to run
  extend(fun) {
    if (typeof fun !== 'function') {
      throw new Error('extend accept 1 function as argument')
    }
    this._extends.push(fun)
  }
}

const userDataPaths = [appDataDir]

const springFestivalExtend = require('./extra/springFestivalTheme')
const darkMode = require('./extra/darkMode')

const options = {
  userConfig: (() => {
    try {
      return require(Global.UserConfigPath)
    } catch (error) {
      return require('../Configs-user.json')
    }
  })(),
  extensionRootDirs: userDataPaths.map(root =>
    path.join(root, GlobalPath.ExtensionDir)
  ),
  executeRootDirs: userDataPaths.map(root =>
    path.join(root, GlobalPath.ExecutesDir)
  ),
  toolRootDirs: userDataPaths.map(root => path.join(root, GlobalPath.ToolsDir))
}

const manager = new Manager(options)
manager.extend(springFestivalExtend)
manager.extend(darkMode)
manager.init()
