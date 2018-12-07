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
const { app: electronApp, BrowserWindow } = electron

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

Promise.all([
  new Promise(resolve => electronApp.on('ready', resolve)),
  new Promise(resolve => server.listen(configs.SERVER_PORT, resolve)),
  new Promise(resolve => serverPipe.listen(configs.PIPE_PORT, resolve))
]).then(() => {
  console.log('镜像服务器运行于端口', configs.SERVER_PORT)
  console.log('代理服务器运行于端口', configs.PIPE_PORT)

  guiWindows = {}

  guiWindows[0] = new BrowserWindow({
    width: 976,
    height: 579,
    frame: true,
    resizable: true,
    backgroundColor: '#000000',
    webPreferences: {
      webSecurity: false,
      nodeIntegration: false
      // plugins: true
    },
    title: '雀魂Plus'
  })
  electron.Menu.setApplicationMenu(null)

  guiWindows[0].webContents.session.setProxy(
    {
      pacScript: path.join(__dirname, 'core.pac')
    },
    () => {
      guiWindows[0].loadURL('http://majsoul.union-game.com/0/')
    }
  )

  guiWindows[0].webContents.on('did-finish-load', () => {
    // 注入脚本根文件根目录
    const executeRootDir = path.join(__dirname, configs.EXECUTE_DIR)
    // 所有已在目录中的注入脚本目录
    const executeDirs = fs.readdirSync(executeRootDir)
    // 用于存储注入脚本对象
    const executes = []
    // 遍历所有注入脚本文件夹，寻找execute.json并加载
    executeDirs.forEach(dir => {
      const executeDir = path.join(executeRootDir, dir)
      fs.stat(executeDir, (err, stats) => {
        if (err) {
          console.error(err)
        } else if (stats.isDirectory()) {
          fs.readFile(path.join(executeDir, 'execute.json'), (err, data) => {
            if (!err) {
              const executeInfo = JSON.parse(data)
              executeInfo.filesDir = executeDir
              executes.push(executeInfo)
              guiWindows[0].webContents.executeJavaScript(
                fs
                  .readFileSync(path.join(executeDir, executeInfo.entry))
                  .toString('utf-8')
              )
              console.log('Hack加载 ' + executeInfo.name)
            }
          })
        } else {
          // TODO, 若为 "*.exec" 则作为 zip 文件解压，然后加载
        }
      })
    })
  })
  // guiWindows[0].openDevTools({ mode: 'detach' })

  guiWindows[0].on('page-title-updated', event => event.preventDefault())
})

process.on('uncaughtException', function(err) {
  console.log(err)
})
