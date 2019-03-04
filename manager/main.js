const panel = require('./Panel')
const ping = require('./Ping')
const Update = require('./Update')
const Setting = require('./Setting')
const About = require('./About')

const {
  ipcRenderer,
  remote: { dialog, app }
} = require('electron')
const AdmZip = require('adm-zip')
const path = require('path')
const os = require('os')

const update = new Update()
const setting = new Setting()
const about = new About()
const Mods = require('./Mods')
const Executes = require('./Executes')
const Tools = require('./Tools')

const configs = require('../configs')
const i18n = require('../i18nInstance')

class Manager {
  constructor (options) {
    this.options = options
    this.mods = null
    this.executes = null
    this.tools = null
    this._extends = []

    this._addEventListener = this._addEventListener.bind(this)
    this._import = this._import.bind(this)
    this._changeModEditable = this._changeModEditable.bind(this)
    this._changeExecuteEditable = this._changeExecuteEditable.bind(this)
    this._changeToolEditable = this._changeToolEditable.bind(this)
    this._loadCards = this._loadCards.bind(this)
    this._saveSettings = this._saveSettings.bind(this)
    this._getRootDirs = this._getRootDirs.bind(this)
    this._getInstallDirByExtname = this._getInstallDirByExtname.bind(this)
    this._runExtends = this._runExtends.bind(this)
    this.gameStart = this.gameStart.bind(this)
  }

  _saveSettings () {
    setting.save()
    this.mods.save()
    this.executes.save()
    this.tools.save()
  }

  _changeModEditable () {
    this.mods.changeEditable()
  }

  _changeExecuteEditable () {
    this.executes.changeEditable()
  }

  _changeToolEditable () {
    this.tools.changeEditable()
  }

  _getRootDirs () {
    const {
      userConfig: {
        userData: { useAppdataLibrary }
      },
      modRootDirs,
      executeRootDirs,
      toolRootDirs
    } = this.options
    const index = Number(!!useAppdataLibrary)
    return {
      modRootDir: modRootDirs[index],
      executeRootDir: executeRootDirs[index],
      toolRootDir: toolRootDirs[index]
    }
  }

  _getInstallDirByExtname (extname) {
    const { modRootDir, executeRootDir, toolRootDir } = this._getRootDirs()
    const map = {
      '.mspm': modRootDir,
      '.mspe': executeRootDir,
      '.mspt': toolRootDir
    }
    return map[extname]
  }

  _import () {
    dialog.showOpenDialog(
      {
        title: i18n.t.manager.installFrom(),
        filters: [
          {
            name: i18n.t.manager.fileTypeMajsoulPlusExtendResourcesPack(),
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
                alert(i18n.t.manager.installExtendResourcesFailed(err))
              } else {
                alert(i18n.t.manager.installExtendResourcesSucceeded())
                this._loadCards()
              }
            })
          })
        }
      }
    )
  }

  _addEventListener () {
    const installMod = document.getElementById('installMod')
    const installExecute = document.getElementById('installExecute')
    const installTool = document.getElementById('installTool')
    installMod.addEventListener('click', this._import)
    installExecute.addEventListener('click', this._import)
    installTool.addEventListener('click', this._import)

    const editMod = document.getElementById('editMod')
    editMod.addEventListener('click', this._changeModEditable)
    const editExecute = document.getElementById('editExecute')
    editExecute.addEventListener('click', this._changeExecuteEditable)
    const editTool = document.getElementById('editTool')
    editTool.addEventListener('click', this._changeToolEditable)

    window.addEventListener('blur', () => document.body.classList.add('blur'))
    window.addEventListener('focus', () =>
      document.body.classList.remove('blur')
    )

    const refreshMod = document.getElementById('refreshMod')
    const refreshExecute = document.getElementById('refreshExecute')
    const refreshTool = document.getElementById('refreshTool')
    refreshMod.addEventListener('click', this._loadCards)
    refreshExecute.addEventListener('click', this._loadCards)
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

  _loadCards () {
    const { modRootDir, executeRootDir, toolRootDir } = this._getRootDirs()
    this.mods = new Mods({ rootDir: modRootDir })
    this.executes = new Executes({ rootDir: executeRootDir })
    this.tools = new Tools({ rootDir: toolRootDir })
    this.mods.load()
    this.executes.load()
    this.tools.load()
  }

  _runExtends () {
    this._extends.forEach(fun => fun.call())
  }

  initRPC () {
    ipcRenderer.on('changeConfig', (_, data) => {
      let obj = JSON.parse(data)
      this.options.userConfig[obj.mainKey][obj.key] = obj.value
    })

    ipcRenderer.on('saveConfig', () => {
      this._saveSettings()
      ipcRenderer.send('application-message', 'close-ready')
    })
  }

  init () {
    update.checkUpdate()
    ping.init()
    panel.init()
    setting.init()
    this.initRPC()
    this._loadCards()
    this._addEventListener()
    this._runExtends()
    about.render()
    i18n.parseAllElementsText(document.documentElement)
  }

  gameStart () {
    this._saveSettings()
    setting.save()
    ipcRenderer.send('application-message', 'start-game')
  }

  // add a function after init to run
  extend (fun) {
    if (typeof fun !== 'function') {
      throw new Error('extend accept 1 function as argument')
    }
    this._extends.push(fun)
  }
}

const userDataPaths = [path.join(__dirname, '../'), app.getPath('userData')]

const springFestivalExtend = require('./extra/springFestivalTheme')
const darkMode = require('./extra/darkMode')

const options = {
  userConfig: (() => {
    try {
      return require(configs.USER_CONFIG_PATH)
    } catch (error) {
      return require('../configs-user.json')
    }
  })(),
  modRootDirs: userDataPaths.map(root => path.join(root, configs.MODS_DIR)),
  executeRootDirs: userDataPaths.map(root =>
    path.join(root, configs.EXECUTES_DIR)
  ),
  toolRootDirs: userDataPaths.map(root => path.join(root, configs.TOOLS_DIR))
}

const manager = new Manager(options)
manager.extend(springFestivalExtend)
manager.extend(darkMode)
manager.init()
