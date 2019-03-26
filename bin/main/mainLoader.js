/* eslint no-console: ["error", { allow: ["warn", "error"] }] */

const fs = require('fs')
const path = require('path')
const electron = require('electron')
const { ipcRenderer } = electron
const configs = require('../../configs')
const userConfigs = require(configs.USER_CONFIG_PATH)

const electronScreen = electron.screen
const i18n = require('../../i18nInstance')

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

/**
 * @type {ClientRectList | DOMRectList}
 */
let clientRect

const prebuildExecuteCode = executeScriptInfo => {
  executePreferences = executeScriptInfo.executePreferences
    ? executeScriptInfo.executePreferences
    : {}
  let codeEntry = executeScriptInfo.entry
  if (!codeEntry) {
    codeEntry = 'script.js'
  }
  let code = ''
  if (Array.isArray(codeEntry)) {
    codeEntry.forEach(codeEntry => {
      code +=
        '\n' +
        fs
          .readFileSync(path.join(executeScriptInfo.filesDir, codeEntry))
          .toString('utf-8')
    })
  } else {
    code = fs
      .readFileSync(path.join(executeScriptInfo.filesDir, codeEntry))
      .toString('utf-8')
  }
  const sanboxCode = `const sandbox = new Proxy({}, {
    get(target, prop) {
      if (target.hasOwnProperty(prop)) {
        return target[prop]
      }
      if (prop === "window") {
        return sandbox
      }
      if (prop === "global") {
        return sandbox
      }
      if (prop === "requestAnimationFrame") {
        return (fun)=>{return requestAnimationFrame(fun.bind(sandbox))}
      }
      if (prop === "require" && ${!!executePreferences.nodeRequire} === false) {
        return undefined
      }
      if (prop === "document" && ${!!executePreferences.document} === false) {
        return undefined
      }
      if (prop === "localStorage" && ${!!executePreferences.localStorage} === false) {
        return undefined
      }
      if (prop === "XMLHttpRequest" && ${!!executePreferences.XMLHTTPRequest} === false) {
        return undefined
      }
      if (prop === "WebSocket" && ${!!executePreferences.WebSocket} === false) {
        return undefined
      }
      if (prop === Symbol.unscopables) {
        return undefined
      }
      return window[prop]
    },
    has() { return true },
    set(target, prop, value) {
      target[prop] = value
      if (${!!executePreferences.writeableWindowObject} === true) {
        window[prop] = target[prop]
      }
    }
  })`
  if (!executeScriptInfo.sync) {
    code = `(()=>{
      let __raf;
      ${sanboxCode}
      const __rafFun=()=>{
        if(window.game) {
              with (sandbox) {
              ${code}
            }
          } else 
          {__raf=requestAnimationFrame(__rafFun)
          }
        }
      __raf=requestAnimationFrame(__rafFun)
      })()`
  } else {
    code = `(()=>{
      ${sanboxCode}
      with (sandbox) {${code}}
    })()`
  }
  return code
}

// Sanbox from https://zhuanlan.zhihu.com/p/58602800
const sandbox = new Proxy(
  {},
  {
    get(target, prop) {
      if (target.hasOwnProperty(prop)) {
        return target[prop]
      }
      if (prop === 'window') {
        return sandbox
      }
      if (prop === 'global') {
        return sandbox
      }
      if (prop === 'require' && false === false) {
        return undefined
      }
      if (prop === 'document' && false === false) {
        return undefined
      }
      if (prop === 'localStorage' && false === false) {
        return undefined
      }
      if (prop === 'XMLHttpRequest' && false === false) {
        return undefined
      }
      if (prop === 'WebSocket' && false === false) {
        return undefined
      }
      if (prop === Symbol.unscopables) {
        return undefined
      }
      return window[prop]
    },
    has() {
      return true
    },
    set(target, prop, value) {
      target[prop] = value
      if (true === true) {
        window[prop] = target[prop]
      }
    }
  }
)
with (sandbox) {
}

let screenshotCounter = 0
let screenshotTimer
const showScreenshotLabel = src => {
  /**
   * @type {HTMLImageElement}
   */
  const screenshotImage = document.getElementById('screenshotImage')
  const screenshotText = document.getElementById('screenshotText')
  const screenshotLabel = document.getElementById('screenshotLabel')
  screenshotImage.src = src
  screenshotText.innerText = screenshotCounter++
    ? i18n.t.main.screenshotsSaved(screenshotCounter)
    : i18n.t.main.screenshotSaved()
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

ipcRenderer.on('window-resize', (event, ...args) => {
  clientRect = args[0]
})

ipcRenderer.on('take-screenshot', () => {
  if (webContents) {
    /**
     * 回调函数
     * @param {Electron.NativeImage} image
     */
    const callbackFunction = image => {
      ipcRenderer.send('application-message', 'take-screenshot', image.toPNG())
    }
    const rect = clientRect
    const display = electronScreen.getDisplayMatching({
      x: parseInt(rect.x),
      y: parseInt(rect.y),
      width: parseInt(rect.width),
      height: parseInt(rect.height)
    })
    webContents.capturePage(
      {
        x: 0,
        y: 0,
        width: parseInt(mainWindow.clientWidth * display.scaleFactor),
        height: parseInt(mainWindow.clientHeight * display.scaleFactor)
      },
      callbackFunction
    )
  }
})

ipcRenderer.on('screenshot-saved', (event, ...args) => {
  const src = args[0]
  showScreenshotLabel('file://' + src)
})

ipcRenderer.on('open-devtools', () => {
  if (webContents) {
    mainWindow.openDevTools({ mode: 'detach' })
  }
})

const testRedirectGameWindow = url => {
  return (
    url.startsWith(configs.REMOTE_DOMAIN) ||
    url.startsWith(configs.HTTP_REMOTE_DOMAIN)
  )
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
  console.warn('Redirect Target:' + localUrl)
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
    const code = prebuildExecuteCode(executeScript)
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
      }
    })

    if (process.env.NODE_ENV === 'development') {
      mainWindow.openDevTools({ mode: 'detach' })
    }
  }

  if (testIsLocalGameWindow(mainWindow.src)) {
    scaleWindow(scalePercent)
    mainWindow.insertCSS('body{overflow:hidden;}')
  } else {
    scaleWindow(100)
  }
})

ipcRenderer.on('load-url', (event, ...args) => {
  const url = args[0]
  console.warn('LoadURL', url)
  if (testRedirectGameWindow(url)) {
    redirectGameWindow(url, mainWindow)
  } else {
    mainWindow.loadURL(url)
  }
  mainWindowBox.style.width = '100vw'
  mainWindowBox.style.height = '100vh'
  mainWindowBox.style.transform = 'none'
})
