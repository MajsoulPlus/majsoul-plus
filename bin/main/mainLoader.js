/*eslint no-console: ["error", { allow: ["warn", "error"] }] */

const fs = require('fs')
const path = require('path')
const electron = require('electron')
const { ipcRenderer, remote } = electron
const userConfigs = require('../../configs-user.json')
const configs = require('../../configs')

const clipboard = remote.clipboard

/**
 * @type {Electron.WebviewTag}
 */
const mainWindow = document.getElementById('mainWindow')

/**
 * @type {HTMLDivElement}
 */
const mainWindowBox = document.getElementById('mainWindowBox')

let scalePercent = userConfigs.window.renderingMultiple

/**
 * @type {Electron.webContents}
 */
let webContents

/**
 * @type {Array<string>}
 */
let executeScriptsCodes = []

/**
 * @type {number}
 */
let serverPort

const probuildExecuteCode = executeScriptInfo => {
  let codeEntry = executeScriptInfo.entry
  if (!codeEntry) {
    codeEntry = 'script.js'
  }
  let code = fs
    .readFileSync(
      path.join(executeScriptInfo.filesDir, executeScriptInfo.entry)
    )
    .toString('utf-8')
  if (!executeScriptInfo.sync) {
    code = `(()=>{
            let __raf
            let require = undefined
            const __rafFun = ()=>{if(window.game){(()=>{${code}})()}else{__raf=requestAnimationFrame(__rafFun)}}
            __raf = requestAnimationFrame(__rafFun)})()`
  } else {
    code = `(()=>{
            let require = undefined;
            (()=>{${code}})()
            })()`
  }
  return code
}

let screenshotCounter = 0
let screenshotTimer
const showScreenshotLabel = dataURL => {
  /**
   * @type {HTMLImageElement}
   */
  const screenshotImage = document.getElementById('screenshotImage')
  const screenshotText = document.getElementById('screenshotText')
  const screenshotLabel = document.getElementById('screenshotLabel')
  screenshotImage.src = dataURL
  screenshotText.innerText = screenshotCounter++
    ? `已保存${screenshotCounter}张截图`
    : '截图已保存'
  screenshotLabel.classList.remove('hide')
  screenshotLabel.classList.add('show')
  clearTimeout(screenshotTimer)
  screenshotTimer = setTimeout(() => {
    screenshotCounter = 0
    screenshotLabel.classList.remove('show')
    screenshotTimer = setTimeout(() => {
      screenshotLabel.classList.add('hide')
    }, 300)
  }, 3000)
}

ipcRenderer.on('load-url', (event, ...args) => {
  const url = args[0]
  console.warn('LoadURL', url)
  mainWindow.loadURL(url)
  mainWindowBox.style.width = '100vw'
  mainWindowBox.style.height = '100vh'
  mainWindowBox.style.transform = 'none'
})

ipcRenderer.on('take-screenshot', () => {
  if (webContents) {
    webContents.capturePage(image => {
      ipcRenderer.send('application-message', 'take-screenshot', image.toPNG())
      const dataURL = image.toDataURL()
      showScreenshotLabel(dataURL)
      clipboard.writeImage(image)
    })
  }
})

const testRedirectGameWindow = url => {
  return url.startsWith(configs.REMOTE_DOMAIN)
}
const testIsLocalGameWindow = url => {
  return url.startsWith('https://localhost:')
}
const getLocalUrlWithParams = url => {
  if (url.includes('?')) {
    return `https://localhost:${serverPort}/0/${url.substring(
      url.indexOf('?')
    )}`
  }
  return `https://localhost:${serverPort}/0/`
}
const redirectGameWindow = (url, gameWindow) => {
  const localUrl = getLocalUrlWithParams(url)
  gameWindow.loadURL(localUrl)
}

ipcRenderer.on('server-port-load', (event, ...args) => {
  console.warn('server-port-load')
  serverPort = args[0]
  ipcRenderer.send('main-loader-message', 'server-port-loaded')
})

ipcRenderer.on('executes-load', (event, ...args) => {
  console.warn('executes-load')
  const executeScripts = args[0]
  executeScriptsCodes = []
  executeScripts.forEach(executeScript => {
    const code = probuildExecuteCode(executeScript)
    executeScriptsCodes.push(code)
  })
  ipcRenderer.send('main-loader-message', 'executes-loaded')
})

const scaleWindow = (percent = scalePercent) => {
  mainWindowBox.style.width = `${percent}vw`
  mainWindowBox.style.height = `${percent}vh`
  mainWindowBox.style.transform = `scale(${100 / percent}) translate(${(100 -
    percent) /
    2}%, ${(100 - percent) / 2}%)`
}

mainWindow.addEventListener('dom-ready', () => {
  if (!webContents) {
    webContents = mainWindow.getWebContents()
    webContents.setZoomFactor(1)
    ipcRenderer.send('main-loader-message', 'main-loader-ready')

    webContents.on('dom-ready', () => {
      executeScriptsCodes.forEach(executeScriptCode => {
        webContents.executeJavaScript(executeScriptCode)
      })
    })

    webContents.on('will-navigate', (evt, url) => {
      if (testRedirectGameWindow(url)) {
        evt.preventDefault()
        redirectGameWindow(url, mainWindow)
      } else {
        webContents.setZoomFactor(1)
      }

      if (testIsLocalGameWindow(url)) {
        scaleWindow()
      } else {
        scaleWindow(100)
      }
    })

    if (process.env.NODE_ENV === 'development') {
      mainWindow.openDevTools({ mode: 'detach' })
    }
  }
})
