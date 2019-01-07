const express = require('express')
const server = express()
const Util = require('./Util.js')
const configs = require('./configs')
const fs = require('fs')
const path = require('path')

const https = require('https')

const electron = require('electron')
const { app: electronApp, BrowserWindow, globalShortcut, ipcMain } = electron

const sererHttps = https.createServer(
  {
    key: fs.readFileSync(path.join(__dirname, './certificate/key.pem')),
    cert: fs.readFileSync(path.join(__dirname, './certificate/cert.crt'))
  },
  server
)

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

server.get('*', Util.processRequest)

electronApp.commandLine.appendSwitch('ignore-certificate-errors')

// 当所有窗口被关闭了，退出。
electronApp.on('window-all-closed', () => {
  // 在 OS X 上，通常用户在明确地按下 Cmd + Q 之前
  // 应用会保持活动状态
  if (process.platform !== 'darwin') {
    electronApp.quit()
  }
})

// 阻止证书验证
electronApp.on(
  'certificate-error',
  (event, webContents, url, error, certificate, callback) => {
    event.preventDefault()
    callback(true)
  }
)

const windowControl = {
  windowMap: {},
  _getGameWindowTitle: () => {
    const titles = [
      {
        text: '雀魂Plus - 游戏制作不易，请多多在雀魂内氪金支持雀魂猫粮工作室！',
        weight: 50
      },
      {
        text: '雀魂Plus - 扩展插件可能会损害游戏开发者利益，请尽可能支持付费',
        weight: 50
      },
      {
        text: '雀魂Plus - 在使用插件的同时，也不要忘记给别人推荐这款游戏哦',
        weight: 50
      },
      {
        text: '雀魂Plus - 只有氪金获得的装扮和角色才可以让其他玩家查看到',
        weight: 50
      },
      {
        text: '喵喵喵！ - 喵喵喵？喵！喵喵喵！喵~~',
        weight: 1
      }
    ]
    let sumWeight = titles.reduce((last, value) => last + value.weight, 0)
    let randomResult = (Math.random() * sumWeight) >> 0
    const index = titles.reduce((last, value, index) => {
      if (Number.isInteger(last)) {
        return last
      }
      if ((randomResult -= value.weight) <= 0) {
        return index
      }
      return null
    }, null)
    return titles[index].text
  },

  _getExecuteScripts: () => {
    const executeRootDir = path.join(__dirname, configs.EXECUTE_DIR)
    let executeScripts
    try {
      const data = fs.readFileSync(path.join(executeRootDir, '/active.json'))
      executeScripts = JSON.parse(data.toString('utf-8'))
    } catch (error) {
      console.error(error)
      executeScripts = []
    }
    return executeScripts
  },

  _getExecuteCode: executeScript => {
    let codeEntry = executeScript.entry
    if (!codeEntry) {
      codeEntry = 'script.js'
    }
    let code = fs
      .readFileSync(path.join(executeScript.filesDir, executeScript.entry))
      .toString('utf-8')
    if (!executeScript.sync) {
      code = `(()=>{
              let __raf
              const __rafFun = ()=>{if(window.game){(()=>{${code}})()}else{__raf=requestAnimationFrame(__rafFun)}}
              __raf = requestAnimationFrame(__rafFun)})()`
    }
    return code
  },

  _execute: gameWindow => {
    const executeScripts = windowControl._getExecuteScripts()
    executeScripts.forEach(executeScript => {
      console.log('Hack加载 ' + executeScript.name)
      const code = windowControl._getExecuteCode(executeScript)
      gameWindow.webContents.executeJavaScript(code)
    })
  },

  _getLocalUrlWithParams: url => {
    if (url.includes('?')) {
      return `https://localhost:${sererHttps.address().port}/0/${url.substring(
        url.indexOf('?')
      )}`
    }
    return `https://localhost:${sererHttps.address().port}/0/`
  },

  _redirectGameWindow: (url, gameWindow) => {
    if (url.startsWith(configs.REMOTE_DOMAIN) && url.includes('?')) {
      const localUrl = windowControl._getLocalUrlWithParams(url)
      gameWindow.loadURL(localUrl)
    }
  },

  electronReady: () => {
    return new Promise(resolve => electronApp.once('ready', resolve))
  },

  /**
   * @param {https.Server} sererHttps
   */
  initLocalMirrorServer: (sererHttps, port) => {
    return new Promise(resolve => {
      sererHttps.listen(port)
      sererHttps.on('listening', resolve)
      sererHttps.on('error', err => {
        if (err.code === 'EADDRINUSE') {
          console.log('Port in use, retrying...')
          setTimeout(() => {
            sererHttps.close()
            sererHttps.listen(0, resolve)
          }, 5)
        }
      })
    })
  },

  initManagerWindow: managerWindowConfig => {
    const managerWindow = new BrowserWindow(managerWindowConfig)
    managerWindow.on('page-title-updated', evt => evt.preventDefault())
    managerWindow.loadURL(
      'file://' + path.join(__dirname, '/manager/index.html')
    )

    // Add environment config to open developer tools
    if (process.env.NODE_ENV === 'development') {
      managerWindow.openDevTools({ mode: 'detach' })
    }

    windowControl.windowMap['manager'] = managerWindow
  },

  initGameWindow: gameWindowConfig => {
    const config = {
      ...gameWindowConfig,
      title: windowControl._getGameWindowTitle()
    }
    const gameWindow = new BrowserWindow(config)
    gameWindow.on('page-title-updated', evt => evt.preventDefault())
    gameWindow.webContents.on('did-finish-load', () =>
      windowControl._execute(gameWindow)
    )
    gameWindow.webContents.on('crashed', evt =>
      console.log('web contents crashed')
    )
    gameWindow.webContents.on('did-navigate', (evt, url) => {
      evt.preventDefault()
      windowControl._redirectGameWindow(url, gameWindow)
    })
    gameWindow.webContents.on(
      'console-message',
      (evt, level, msg, line, sourceId) => console.log('Console', msg)
    )
    gameWindow.loadURL(`https://localhost:${sererHttps.address().port}/0/`)

    // Add environment config to open developer tools
    if (process.env.NODE_ENV === 'development') {
      gameWindow.openDevTools({ mode: 'detach' })
    }

    windowControl.windowMap['game'] = gameWindow
  },

  closeManagerWindow: () => {
    const managerWindow = windowControl.windowMap['manager']
    managerWindow && managerWindow.close()
  },

  addAppListener: () => {
    ipcMain.on('application-message', (evt, ...args) => {
      if (args && args.length > 0) {
        switch (args[0]) {
          case 'start-game':
            windowControl
              .initLocalMirrorServer(sererHttps, configs.SERVER_PORT)
              .then(() => {
                windowControl.initGameWindow(configs.GAME_WINDOW_CONFIG)
                windowControl.closeManagerWindow()
              })
            break
          default:
            break
        }
      }
    })
  },

  start: () => {
    windowControl.electronReady().then(() => {
      electron.Menu.setApplicationMenu(null)
      windowControl.addAppListener()

      // hack macOS config
      if (process.platform === 'darwin') {
        configs.MANAGER_WINDOW_CONFIG.frame = true
        configs.MANAGER_WINDOW_CONFIG.titleBarStyle = 'hidden'
        configs.MANAGER_WINDOW_CONFIG.maximizable = false
        configs.MANAGER_WINDOW_CONFIG.fullscreenable = false
      }

      windowControl.initManagerWindow(configs.MANAGER_WINDOW_CONFIG)
    })
  }
}
windowControl.start()

process.on('uncaughtException', err => {
  console.log(err)
})
