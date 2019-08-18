import { ipcRenderer, screen as electronScreen } from 'electron'
import i18n from '../../i18n'
import Global from '../../manager/global'
import { MajsoulPlus } from '../../majsoul_plus'

const userConfigs: MajsoulPlus.UserConfig = require(Global.UserConfigPath)

const remoteDomains = [
  { id: 0, name: 'zh', domain: 'https://www.majsoul.com/1/' },
  { id: 1, name: 'jp', domain: 'https://game.mahjongsoul.com/' },
  { id: 2, name: 'en', domain: 'https://mahjongsoul.game.yo-star.com/' }
]

const mainWindow: Electron.WebviewTag = document.querySelector('#mainWindow')
const mainWindowBox: HTMLDivElement = document.querySelector('#mainWindowBox')
const scalePercent = userConfigs.window.renderingMultiple

let webContents: Electron.webContents
let clientRect: Electron.Rectangle

let screenshotCounter = 0
let screenshotTimer: NodeJS.Timeout
function showScreenshotLabel(src: string) {
  const screenshotImage: HTMLImageElement = document.querySelector(
    '#screenshotImage'
  )
  const screenshotText: HTMLParagraphElement = document.querySelector(
    '#screenshotText'
  )
  const screenshotLabel: HTMLDivElement = document.querySelector(
    '#screenshotLabel'
  )
  screenshotImage.src = src
  screenshotText.innerText = screenshotCounter++
    ? i18n.text.main.screenshotsSaved(String(screenshotCounter))
    : i18n.text.main.screenshotSaved()
  screenshotLabel.classList.remove('hide')
  screenshotLabel.classList.add('show')
  clearTimeout(screenshotTimer)
  screenshotTimer = setTimeout(() => {
    screenshotLabel.classList.remove('show')
    clearTimeout(screenshotTimer)
    screenshotTimer = setTimeout(() => {
      screenshotLabel.classList.add('hide')
      screenshotCounter = 0
    }, 300)
  }, 8000)
}

ipcRenderer.on('window-resize', (event, rect: Electron.Rectangle) => {
  clientRect = rect
})

ipcRenderer.on('take-screenshot', () => {
  if (webContents) {
    // 回调函数
    const callbackFunction = (image: Electron.NativeImage) => {
      ipcRenderer.send('take-screenshot', image.toPNG())
    }
    const rect = clientRect
    const display = electronScreen.getDisplayMatching({
      x: Math.floor(rect.x),
      y: Math.floor(rect.y),
      width: Math.floor(rect.width),
      height: Math.floor(rect.height)
    })
    webContents.capturePage(
      {
        x: 0,
        y: 0,
        width: Math.floor(mainWindow.clientWidth * display.scaleFactor),
        height: Math.floor(mainWindow.clientHeight * display.scaleFactor)
      },
      callbackFunction
    )
  }
})

ipcRenderer.on(
  'screenshot-saved',
  (event: Electron.Event, filePath: string) => {
    showScreenshotLabel('file://' + filePath)
  }
)

ipcRenderer.on('open-devtools', () => {
  if (webContents) {
    mainWindow.openDevTools()
  }
})

let serverInfo: {
  url: string
  port: number
  http: boolean
}

function isVanillaGameUrl(url: string) {
  return (
    url.startsWith(remoteDomains[0].domain) ||
    url.startsWith(remoteDomains[1].domain) ||
    url.startsWith(remoteDomains[2].domain)
  )
}

function isLocalHost(url: string) {
  return url.match(/https?:\/\/localhost:/)
}

function getLocalUrlWithParams(url: string) {
  if (url.includes('?')) {
    return `${serverInfo.url}${url.substring(url.indexOf('?'))}`
  }
  return serverInfo.url
}

function redirectGameWindow(url: string, gameWindow: Electron.WebviewTag) {
  const localUrl = getLocalUrlWithParams(url)
  console.log('[Majsoul Plus] Redirect Target:' + localUrl)
  gameWindow.loadURL(localUrl)
}

function scaleWindow(percent = scalePercent) {
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
    ipcRenderer.send('main-loader-ready')

    webContents.on('will-navigate', (event, url) => {
      if (isVanillaGameUrl(url)) {
        event.preventDefault()
        redirectGameWindow(url, mainWindow)
      }
    })

    if (process.env.NODE_ENV === 'development') {
      mainWindow.openDevTools()
    }
  }

  if (isLocalHost(mainWindow.src)) {
    scaleWindow(scalePercent)
    mainWindow.insertCSS('body{overflow:hidden;}')
  } else {
    scaleWindow(100)
  }
})

ipcRenderer.on(
  'load-url',
  (event: Electron.Event, url: string, port: number, http: boolean) => {
    serverInfo = { url, port, http }
    console.log('[Majsoul Plus] LoadURL', serverInfo)

    mainWindow.loadURL(url)
    mainWindowBox.style.width = '100vw'
    mainWindowBox.style.height = '100vh'
    mainWindowBox.style.transform = 'none'
  }
)

ipcRenderer.on('get-local-storage', () => {
  mainWindow.executeJavaScript(
    'Object.entries(localStorage)',
    false,
    result => {
      console.log(result)
      ipcRenderer.send('save-local-storage', result)
    }
  )
})
