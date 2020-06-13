import { ipcRenderer } from 'electron'
import i18n from '../../i18n'
import Global from '../../manager/global'
import { MajsoulPlus } from '../../majsoul_plus'

const userConfigs: MajsoulPlus.UserConfig = require(Global.UserConfigPath)

const remoteDomains = [
  { id: 0, name: 'zh', domain: 'https://game.maj-soul.com/1' },
  { id: 1, name: 'jp', domain: 'https://game.mahjongsoul.com/' },
  { id: 2, name: 'en', domain: 'https://mahjongsoul.game.yo-star.com/' }
]

const mainWindow: Electron.WebviewTag = document.querySelector('#mainWindow')
const mainWindowBox: HTMLDivElement = document.querySelector('#mainWindowBox')
const scalePercent = userConfigs.window.renderingMultiple

let webContents: Electron.webContents

let screenshotCounter = 0
let screenshotTimer: NodeJS.Timeout
function showScreenshotLabel(src: string) {
  const image = document.querySelector('#screenshotImage') as HTMLImageElement
  image.src = src

  const text = document.querySelector('#screenshotText') as HTMLParagraphElement
  text.innerText = screenshotCounter++
    ? i18n.text.main.screenshotsSaved(String(screenshotCounter))
    : i18n.text.main.screenshotSaved()

  const label = document.querySelector('#screenshotLabel') as HTMLDivElement
  label.classList.remove('hide')
  label.classList.add('show')

  clearTimeout(screenshotTimer)
  screenshotTimer = setTimeout(() => {
    label.classList.remove('show')
    clearTimeout(screenshotTimer)
    screenshotTimer = setTimeout(() => {
      label.classList.add('hide')
      screenshotCounter = 0
    }, 300)
  }, 8000)
}

ipcRenderer.on(
  'take-screenshot',
  (event, index: number, scaleFactor: number) => {
    if (webContents) {
      webContents
        .capturePage({
          x: 0,
          y: 0,
          width: Math.floor(mainWindow.clientWidth * scaleFactor),
          height: Math.floor(mainWindow.clientHeight * scaleFactor)
        })
        .then(image => {
          ipcRenderer.send('save-screenshot', index, image.toPNG())
        })
    }
  }
)

ipcRenderer.on('screenshot-saved', (event, filePath: string) => {
  showScreenshotLabel('file://' + filePath)
})

ipcRenderer.on('open-devtools', () => {
  if (webContents) {
    mainWindow.openDevTools()
  }
})

ipcRenderer.on('set-audio-muted', (event, bool: boolean) => {
  if (webContents) {
    mainWindow.setAudioMuted(bool)
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
    webContents.zoomFactor = 1

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

  mainWindow.useragent = navigator.userAgent
})

ipcRenderer.on(
  'load-url',
  (event, url: string, port: number, http: boolean, partition?: string) => {
    serverInfo = { url, port, http }
    console.log('[Majsoul Plus] LoadURL', serverInfo)

    if (partition) {
      mainWindow.partition = partition
    }
    mainWindow.src = url
    mainWindowBox.style.width = '100vw'
    mainWindowBox.style.height = '100vh'
    mainWindowBox.style.transform = 'none'
  }
)
