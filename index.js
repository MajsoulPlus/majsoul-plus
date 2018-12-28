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

// 保持一个对于 window 对象的全局引用，不然，当 JavaScript 被 GC，
// window 会被自动地关闭

/**
 * @type {{[x:string]:Electron.BrowserWindow}}
 */
let guiWindows = null

electronApp.commandLine.appendSwitch('ignore-certificate-errors')

// 当所有窗口被关闭了，退出。
electronApp.on('window-all-closed', function () {
  // 在 OS X 上，通常用户在明确地按下 Cmd + Q 之前
  // 应用会保持活动状态
  if (process.platform != 'darwin') {
    electronApp.quit()
  }
})

electronApp.on(
  'certificate-error',
  (event, webContents, url, error, certificate, callback) => {
    event.preventDefault()
    callback(true)
  }
)

const windowControl = {
  windowMap: {},
  _getGameWindowTitle: function () {
    const titles = [
      {
        text:
          '雀魂Plus - 游戏制作不易，请多多在雀魂内氪金支持雀魂猫粮开发团队！',
        weight: 50
      },
      {
        text:
          '雀魂Plus - 扩展插件可能会损害游戏开发者利益，请尽可能支持付费',
        weight: 50
      },
      {
        text:
          '雀魂Plus - 在使用插件的同时，也不要忘记给别人推荐这款游戏哦',
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

  _getExcuteScripts: function () {
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

  _getExcuteCode: function (executeScript) {
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

  _excute: function (gameWindow) {
    const executeScripts = windowControl._getExcuteScripts()
    executeScripts.forEach(executeScript => {
      console.log('Hack加载 ' + executeScript.name)
      const code = windowControl._getExcuteCode(executeScript)
      gameWindow.webContents.executeJavaScript(code)
    })
  },

  _getLocalUrlWithParams(url) {
    if (url.includes('?')) {
      return `https://localhost:${configs.SERVER_PORT}/0/${url.substring(url.indexOf('?S'))}`
    }
    return `https://localhost:${configs.SERVER_PORT}/0/`
  },

  _redirectGameWindow: function (url, gameWindow) {
    if (url.startsWith(configs.REMOTE_DOMAIN) && url.includes('?')) {
      const localUrl = windowControl._getLocalUrlWithParams(url)
      gameWindow.loadURL(localUrl)
    }
  },

  electronReady: function () {
    return new Promise(resolve => electronApp.once('ready', resolve))
  },

  initLocalMirrorServer: function (sererHttps, port) {
    return new Promise(resolve => sererHttps.listen(port, resolve))
  },

  initManagerWindow: function (managerWindowConfig) {
    const managerWindow = new BrowserWindow(managerWindowConfig)
    managerWindow.on('page-title-updated', evt => evt.preventDefault())
    managerWindow.loadURL(path.join(__dirname, '/manager/index.html'))
    windowControl.windowMap['manager'] = managerWindow
  },

  initGameWindow: function (gameWindowConfig) {
    const config = { ...gameWindowConfig, title: windowControl._getGameWindowTitle() }
    const gameWindow = new BrowserWindow(config)
    gameWindow.on('page-title-updated', evt => evt.preventDefault())
    gameWindow.webContents.on('did-finish-load', () => windowControl._excute(gameWindow))
    gameWindow.webContents.on('crashed', evt => console.log('web contents crashed'))
    gameWindow.webContents.on('did-navigate', (evt, url) => {
      evt.preventDefault()
      windowControl._redirectGameWindow(url, gameWindow)
    })
    gameWindow.webContents.on('console-message', (evt, level, msg, line, sourceId) => console.log('Console', msg))
    gameWindow.loadURL(`https://localhost:${configs.SERVER_PORT}/0/`)
    windowControl.windowMap['game'] = gameWindow
  },

  closeManagerWindow: function () {
    const managerWindow = windowControl.windowMap['manager']
    managerWindow && managerWindow.close()
  },

  addAppListener: function () {
    ipcMain.on('application-message', (evt, ...args) => {
      if (args && args.length > 0) {
        switch (args[0]) {
          case 'start-game':
            windowControl.closeManagerWindow()
            windowControl.initLocalMirrorServer(sererHttps, configs.SERVER_PORT)
            windowControl.initGameWindow(configs.GAME_WINDOW_CONFIG)
            break
          default:
            break;
        }
      }
    })
  },

  start: function () {
    windowControl.electronReady()
      .then(() => {
        electron.Menu.setApplicationMenu(null)
        windowControl.addAppListener()
        windowControl.initManagerWindow(configs.MANAGER_WINDOW_CONFIG)
      })
  }
}
windowControl.start()

/* Promise.all([new Promise(resolve => electronApp.once('ready', resolve))]).then(
  () => {
    guiWindows = {}
    const startGame = () => {
      Promise.all([
        new Promise(resolve => sererHttps.listen(configs.SERVER_PORT, resolve))
        // new Promise(resolve => pipeHttps.listen(configs.PIPE_PORT, resolve))
      ]).then(() => {
        console.log('镜像服务器运行于端口', configs.SERVER_PORT)
        // console.log('代理服务器运行于端口', configs.PIPE_PORT)
      })
      guiWindows[1] = new BrowserWindow({
        width: 960 + 16,
        height: 540 + 39,
        frame: true,
        resizable: true,
        backgroundColor: '#000000',
        webPreferences: {
          webSecurity: false,
          nodeIntegration: false
          // plugins: true
        },
        title: (() => {
          const titles = [
            {
              text:
                '雀魂Plus - 游戏制作不易，请多多在雀魂内氪金支持雀魂猫粮开发团队！',
              weight: 50
            },
            {
              text:
                '雀魂Plus - 扩展插件可能会损害游戏开发者利益，请尽可能支持付费',
              weight: 50
            },
            {
              text:
                '雀魂Plus - 在使用插件的同时，也不要忘记给别人推荐这款游戏哦',
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
        })()
      })
      // 注入脚本根文件根目录
      const executeRootDir = path.join(__dirname, configs.EXECUTE_DIR)
      let executes
      try {
        const data = fs.readFileSync(path.join(executeRootDir, '/active.json'))
        executes = JSON.parse(data.toString('utf-8'))
        executes.forEach(executeInfo => {
          console.log('Hack加载 ' + executeInfo.name)
        })
      } catch (error) {
        console.error(error)
        executes = []
      }
      guiWindows[1].webContents.on('did-finish-load', () => {
        // 注入脚本的逻辑
        executes.forEach(executeInfo => {
          let code = fs
            .readFileSync(path.join(executeInfo.filesDir, executeInfo.entry))
            .toString('utf-8')
          if (!executeInfo.sync) {
            code = `(()=>{
              let __raf
              const __rafFun = ()=>{if(window.game){(()=>{${code}})()}else{__raf=requestAnimationFrame(__rafFun)}}
              __raf = requestAnimationFrame(__rafFun)})()`
          }
          guiWindows[1].webContents.executeJavaScript(code)
        })
      })
      // guiWindows[1].openDevTools({ mode: 'detach' })
      guiWindows[1].on('page-title-updated', event => event.preventDefault())
      guiWindows[1].webContents.on('crashed', event => console.log('creashed'))
      guiWindows[1].webContents.on('did-navigate', (event, url) => {
        console.log('will-navigate', url)
        if (url.startsWith(configs.REMOTE_DOMAIN)) {
          if (url.indexOf('?') > -1) {
            event.preventDefault()
            guiWindows[1].loadURL(
              `https://localhost:${configs.SERVER_PORT}/0/` +
              url.substring(url.indexOf('?'))
            )
          }
        }
      })
      guiWindows[1].webContents.on(
        'console-message',
        (event, level, message, line, sourceId) =>
          console.log('Console', message)
      )
      guiWindows[1].loadURL(`https://localhost:${configs.SERVER_PORT}/0/`)
      if (guiWindows[0]) {
        guiWindows[0].close()
      }
    }
    guiWindows[0] = new BrowserWindow({
      width: 960 + 16,
      height: 540 + 39,
      frame: true,
      resizable: true,
      backgroundColor: '#FFFFFF',
      webPreferences: {
        webSecurity: false,
        allowRunningInsecureContent: true
      },
      title: '雀魂Plus - 扩展资源管理器'
    })
    guiWindows[0].on('page-title-updated', event => event.preventDefault())
    guiWindows[0].loadURL(path.join(__dirname, '/manager/index.html'))
    // guiWindows[0].openDevTools({ mode: 'detach' })
    ipcMain.on('application-message', (event, ...args) => {
      if (args && args.length > 0) {
        switch (args[0]) {
          case 'start-game':
            // Util.loadMods() // 该语句用于重新加载Mod，可选
            startGame()
            break
          default:
            return
        }
      }
    })
    electron.Menu.setApplicationMenu(null)
  }
) */

process.on('uncaughtException', function (err) {
  console.log(err)
})