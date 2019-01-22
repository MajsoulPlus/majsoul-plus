/*eslint no-console: ["error", { allow: ["warn", "error"] }] */

const fs = require('fs')
const path = require('path')
const electron = require('electron')
const { ipcRenderer, remote } = electron
const userConfigs = require('../../configs-user.json')

const clipboard = remote.clipboard

/**
 * @type {Electron.WebviewTag}
 */
const mainWindow = document.getElementById('mainWindow')

/**
 * @type {HTMLDivElement}
 */
const mainWindowBox = document.getElementById('mainWindowBox')

const scalePercent = userConfigs.window.renderingMultiple

/**
 * @type {Electron.webContents}
 */
let webContents

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
            let require = undefined
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
    },300)
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

/**
 * @type {Array<string>}
 */
let executeScriptsCodes
ipcRenderer.on('executes-load', (event, ...args) => {
  const executeScripts = args[0]
  executeScriptsCodes = []
  executeScripts.forEach(executeScript => {
    const code = probuildExecuteCode(executeScript)
    executeScriptsCodes.push(code)
  })
  ipcRenderer.send('main-loader-message', 'executes-loaded')
})

mainWindow.addEventListener('dom-ready', () => {
  if (!webContents) {
    webContents = mainWindow.getWebContents()
    webContents.setZoomFactor(1)
    ipcRenderer.send('main-loader-message', 'main-loader-ready')

    webContents.on('did-finish-load', () => {
      executeScriptsCodes.forEach(executeScriptCode => {
        webContents.executeJavaScript(executeScriptCode)
      })
    })

    if (process.env.NODE_ENV === 'development') {
      mainWindow.openDevTools({ mode: 'detach' })
    }
  } else {
    mainWindowBox.style.width = `${scalePercent}vw`
    mainWindowBox.style.height = `${scalePercent}vh`
    mainWindowBox.style.transform = `scale(${100 /
      scalePercent}) translate(${(100 - scalePercent) / 2}%, ${(100 -
      scalePercent) /
      2}%)`
  }
})
