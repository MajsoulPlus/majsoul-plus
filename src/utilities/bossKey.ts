import Utility from './utility'
import { BrowserWindow, globalShortcut } from 'electron'
import { GameWindows } from '../windows/game'
import { ManagerWindow } from '../windows/manager'

function hideWindow(window: BrowserWindow) {
  if (window) {
    window.hide()
    window.webContents.setAudioMuted(true)
  }
}

function showWindow(window: BrowserWindow) {
  if (window) {
    window.show()
    window.webContents.setAudioMuted(false)
  }
}

class BossKey extends Utility {
  private isActive = true

  constructor() {
    super()
    this.name = 'BossKey'
  }

  protected execute() {
    globalShortcut.register('Alt+X', () => {
      if (this.isActive) {
        // 备份窗口信息 & 隐藏窗口
        hideWindow(ManagerWindow)
        GameWindows.forEach(window => {
          hideWindow(window)
          window.webContents.send('set-audio-muted', true)
        })
      } else {
        // 重新显示窗口
        showWindow(ManagerWindow)
        GameWindows.forEach(window => {
          showWindow(window)
          window.webContents.send('set-audio-muted', false)
        })
      }
      this.isActive = !this.isActive
    })
  }
}

export default new BossKey()
