const express = require('express')
const server = express()
const Util = require('./Util.js')
const configs = require('./configs')
const fs = require('fs')
const path = require('path')
const request = require('request')
const http = require('http')

const serverPipe = express()
const electron = require('electron')
const { app: electronApp, BrowserWindow, globalShortcut, ipcMain } = electron

server.get('*', Util.processRequest)

serverPipe.use('*', (req, res) => {
  if (req.url.indexOf(configs.REMOTE_DOMAIN) > -1) {
    const pipeUrl =
      'http://127.0.0.1:' +
      configs.SERVER_PORT +
      req.originalUrl.substring(
        req.originalUrl.indexOf(configs.REMOTE_DOMAINs) +
          configs.REMOTE_DOMAIN.length +
          1
      )
    req.pipe(request(pipeUrl)).pipe(res)
    return
  }
  pipeUrl = req.originalUrl
  req.pipe(request(pipeUrl)).pipe(res)
})

// 保持一个对于 window 对象的全局引用，不然，当 JavaScript 被 GC，
// window 会被自动地关闭

/**
 * @type {{[x:string]:Electron.BrowserWindow}}
 */
let guiWindows = null

// 当所有窗口被关闭了，退出。
electronApp.on('window-all-closed', function() {
  // 在 OS X 上，通常用户在明确地按下 Cmd + Q 之前
  // 应用会保持活动状态
  if (process.platform != 'darwin') {
    electronApp.quit()
  }
})

Promise.all([new Promise(resolve => electronApp.on('ready', resolve))]).then(
  () => {
    guiWindows = {}

    const startGame = () => {
      Promise.all([
        new Promise(resolve => server.listen(configs.SERVER_PORT, resolve)),
        new Promise(resolve => serverPipe.listen(configs.PIPE_PORT, resolve))
      ]).then(() => {
        console.log('镜像服务器运行于端口', configs.SERVER_PORT)
        console.log('代理服务器运行于端口', configs.PIPE_PORT)
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
          console.log(titles[index])
          return titles[index].text
        })()
      })

      guiWindows[1].webContents.session.setProxy(
        {
          pacScript: path.join(__dirname, 'core.pac')
        },
        () => {
          guiWindows[1].loadURL('http://majsoul.union-game.com/0/')
        }
      )

      // 注入脚本根文件根目录
      const executeRootDir = path.join(__dirname, configs.EXECUTE_DIR)
      let executes
      fs.readFile(path.join(executeRootDir, '/active.json'), (err, data) => {
        if (err) {
          executes = []
        } else {
          executes = JSON.parse(data.toString('utf-8'))
        }
      })

      guiWindows[1].webContents.on('did-finish-load', () => {
        // 注入脚本的逻辑
        executes.forEach(executeInfo => {
          guiWindows[1].webContents.executeJavaScript(
            fs
              .readFileSync(path.join(executeInfo.filesDir, executeInfo.entry))
              .toString('utf-8')
          )
          console.log('Hack加载 ' + executeInfo.name)
        })
      })
      // guiWindows[1].openDevTools({ mode: 'detach' })

      guiWindows[1].on('page-title-updated', event => event.preventDefault())

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
)

process.on('uncaughtException', function(err) {
  console.log(err)
})
