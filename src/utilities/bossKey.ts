import Utility from './utility'
import { BrowserWindow, globalShortcut } from 'electron'
import { MajsoulPlus } from '../majsoul_plus'
import { GameWindowStatus, GameWindow } from '../windows/game'
import { ManagerWindow, ManagerWindowStatus } from '../windows/manager'

function hideWindow(window: BrowserWindow, option: MajsoulPlus.WindowStatus) {
  if (window) {
    option.visible = window.isVisible()
    option.muted = ManagerWindow.webContents.isAudioMuted()
    window.hide()
    window.webContents.setAudioMuted(true)
  }
}

function showWindow(window: BrowserWindow, option: MajsoulPlus.WindowStatus) {
  if (window) {
    if (option.visible) {
      window.show()
    }
    window.webContents.setAudioMuted(option.muted)
  }
}

class BossKey extends Utility {
  private isActive = false

  constructor() {
    super()
    this.name = 'BossKey'
  }

  protected execute() {
    globalShortcut.register('Alt+X', () => {
      if (this.isActive) {
        // 备份窗口信息 & 隐藏窗口
        hideWindow(ManagerWindow, ManagerWindowStatus)
        hideWindow(GameWindow, GameWindowStatus)
      } else {
        // 重新显示窗口
        showWindow(ManagerWindow, ManagerWindowStatus)
        showWindow(GameWindow, GameWindowStatus)
      }
    })
  }
}

export default new BossKey()
