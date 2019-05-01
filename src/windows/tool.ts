import { BrowserWindow, ipcMain } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import { ManagerWindow } from './manager'
import { Global, appDataDir } from '../global'
import { MajsoulPlus } from '../majsoul_plus'

class ToolWindow {
  private window: BrowserWindow

  constructor(toolName: string) {
    const toolFolder = path.join(appDataDir, 'tool', toolName)

    // TODO: JSON Schema
    const localConfig: MajsoulPlus.ToolConfig = JSON.parse(
      fs.readFileSync(path.join(toolFolder, 'tool.json'), {
        encoding: 'utf-8'
      })
    )
    const toolWindowConfig = {
      ...Global.ToolWindowConfig,
      ...localConfig.windowOptions,
      ...{
        show: false,
        parent: ManagerWindow,
        webPreferences: {
          sandbox: true,
          preload: path.join(__dirname, 'sandbox-preload.js')
        }
      }
    }

    this.window = new BrowserWindow(toolWindowConfig)
    if (process.env.NODE_ENV === 'development') {
      this.window.webContents.openDevTools({
        mode: 'detach'
      })
    }
    this.window.loadURL(
      'file://' + path.join(toolFolder, localConfig.index || 'index.html')
    )

    this.window.on('close', event => {
      this.hide()
      event.preventDefault()
    })
  }

  show() {
    this.window.show()
  }

  hide() {
    this.window.hide()
  }

  openDevTools() {
    this.window.webContents.openDevTools({ mode: 'detach' })
  }
}

class Tool {
  private toolWindows: Map<string, ToolWindow> = new Map()

  constructor() {
    if (!ManagerWindow) {
      console.error(`cannot initialize ToolManager before ManagerWindow`)
    }
  }

  private load(toolName: string) {
    const toolWindow = new ToolWindow(toolName)
    this.toolWindows.set(toolName, toolWindow)
    if (process.env.NODE_ENV === 'development') {
      toolWindow.openDevTools()
    }
  }

  start(toolName: string) {
    if (!this.toolWindows.has(toolName)) {
      this.load(toolName)
    }
    this.toolWindows.get(toolName).show()
  }
}

// tslint:disable-next-line
export let ToolManager: Tool

export function initToolManager() {
  ToolManager = new Tool()

  ipcMain.on(
    'start-tool',
    (event: Electron.Event, config: MajsoulPlus.ToolConfig) => {
      ToolManager.start(config.id)
    }
  )
}
