/*eslint no-console: ["error", { allow: ["warn", "error"] }] */

const electron = require('electron')
const { ipcRenderer } = electron

/**
 * @type {Electron.WebviewTag}
 */
const mainWindow = document.getElementById('mainWindow')

/**
 * @type {HTMLDivElement}
 */
const mainWindowBox = document.getElementById('mainWindowBox')

const scalePercent = 400

ipcRenderer.on('load-url', (event, ...args) => {
  const url = args[0]
  console.warn('LoadURL', url)
  mainWindow.loadURL(url)
  mainWindowBox.style.width = '100%'
  mainWindowBox.style.height = '100%'
  mainWindowBox.style.transform = 'none'
})

let webContents
mainWindow.addEventListener('dom-ready', () => {
  if (!webContents) {
    webContents = mainWindow.getWebContents()
    ipcRenderer.send('main-loader-message', 'main-loader-ready')

    if (process.env.NODE_ENV === 'development') {
      mainWindow.openDevTools({ mode: 'detach' })
    }
  }
  mainWindowBox.style.width = `${scalePercent}vw`
  mainWindowBox.style.height = `${scalePercent}vh`
  mainWindowBox.style.transform = `scale(${100 /
    scalePercent}) translate(${(100 - scalePercent) / 2}%, ${(100 -
    scalePercent) /
    2}%)`
})
