import { app, clipboard, ipcMain, nativeImage } from 'electron'
import * as path from 'path'
import { writeFile } from '../utils'
import { GameWindows } from '../windows/game'
import Utility from './utility'

class ScreenShot extends Utility {
  constructor() {
    super()
    this.name = 'ScreenShot'
  }

  protected execute() {
    ipcMain.on('save-screenshot', (event, index: number, buf: Buffer) => {
      // 接收到的截图 Buffer
      const buffer: Buffer = buf
      // 由主进程进行保存
      const filePath = path.join(
        app.getPath('pictures'),
        app.name,
        Date.now() + '.png'
      )
      // 写入文件
      writeFile(filePath, buffer).then(() => {
        // 通知渲染进程（游戏宿主窗口）截图已保存，并由渲染进程弹窗
        GameWindows.get(index).webContents.send('screenshot-saved', filePath)
      })
      // 写入图像到剪切板
      clipboard.writeImage(nativeImage.createFromBuffer(buffer))
    })
  }
}

export default new ScreenShot()
