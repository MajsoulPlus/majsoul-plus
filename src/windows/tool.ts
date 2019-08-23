import { BrowserWindow, ipcMain } from 'electron'
import * as path from 'path'
import { Global } from '../global'
import { MajsoulPlus } from '../majsoul_plus'
import { ToolManager } from '../tool/tool'

class ToolWindow {
  private window: BrowserWindow

  constructor(id: string) {
    const localConfig = ToolManager.getDetail(id) as MajsoulPlus.ToolConfig
    const toolWindowConfig = {
      ...Global.ToolWindowConfig,
      ...localConfig.windowOptions,
      show: false
    }
    toolWindowConfig.webPreferences = {
      ...Global.ToolWindowConfig.webPreferences,
      ...localConfig.windowOptions.webPreferences,
      sandbox: true,
      preload: path.join(__dirname, 'sandbox-preload.js')
    }

    this.window = new BrowserWindow(toolWindowConfig)

    if (process.env.NODE_ENV === 'development') {
      this.window.webContents.openDevTools({
        mode: 'detach'
      })
    }

    this.window.loadURL(
      'file://' +
        path.join(Global.ToolFolderPath, id, localConfig.index || 'index.html')
    )
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

class ToolMapManager {
  private toolWindows: Map<string, ToolWindow> = new Map()

  private load(id: string) {
    const toolWindow = new ToolWindow(id)
    this.toolWindows.set(id, toolWindow)
    if (process.env.NODE_ENV === 'development') {
      toolWindow.openDevTools()
    }
  }

  start(id: string) {
    if (!this.toolWindows.has(id)) {
      this.load(id)
    }
    this.toolWindows.get(id).show()
  }
}

export function initToolManager() {
  const manager = new ToolMapManager()

  ipcMain.on('start-tool', (event, id: string) => {
    manager.start(id)
  })
}
