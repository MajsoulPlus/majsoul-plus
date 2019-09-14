import { ipcMain } from 'electron'
import { Global } from '../global'
import { getFoldersSync } from '../utils'
import manager from './manager'

export let ToolManager: manager

export function LoadTool() {
  // 初始化 manager
  ToolManager = new manager(Global.ToolConfigPath)

  function load() {
    const tools: string[] = getFoldersSync(Global.ToolFolderPath)
    tools.forEach(tool => ToolManager.use(tool))
    ToolManager.enableAll()
  }

  load()

  ipcMain.on('refresh-tool', event => {
    ToolManager.clear()
    load()
    event.returnValue = ToolManager.getDetails()
  })
}
