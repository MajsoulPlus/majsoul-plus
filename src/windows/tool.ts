import { BrowserWindow } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import { ManagerWindow } from './manager'
import { Global, appDataDir } from '../global'
import { MajsoulPlus } from '../majsoul_plus'

class Tool {
  private toolWindows: Map<string, BrowserWindow> = new Map()

  constructor() {
    if (!ManagerWindow) {
      console.error(`cannot initialize ToolManager before ManagerWindow`)
    }
  }

  private load(toolName: string) {
    const toolFolder = path.join(appDataDir, 'tool', toolName)
    // TODO: JSON Schema
    const localConfig: MajsoulPlus.ToolConfig = JSON.parse(
      fs.readFileSync(path.join(toolFolder, 'tool.json'), { encoding: 'utf-8' })
    )
    const toolWindowConfig = {
      ...Global.ToolWindowConfig,
      ...localConfig.windowOptions,
      ...{
        // parent: ManagerWindow,
        webPreferences: {
          sandbox: true,
          preload: path.join(__dirname, 'sandbox-preload.js')
        }
      }
    }
    const toolWindow = new BrowserWindow(toolWindowConfig)
    this.toolWindows.set(toolName, new BrowserWindow(toolWindowConfig))
    if (process.env.NODE_ENV === 'development') {
      toolWindow.webContents.openDevTools({
        mode: 'detach'
      })
    }
    toolWindow.loadURL(
      'file://' + path.join(toolFolder, localConfig.index || 'index.html')
    )
  }

  start(toolName: string) {
    if (!this.toolWindows.has(toolName)) {
      this.load(toolName)
    }
    this.toolWindows.get(toolName).show()
  }
}

// tslint:disable-next-line
export const ToolManager = new Tool()
