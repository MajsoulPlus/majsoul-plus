import Utility from './utility'
import { ipcMain } from 'electron'
import * as path from 'path'

class OpenFile extends Utility {
  private filePath: string

  constructor() {
    super()
    this.name = 'OpenFile'
  }

  setPath(fpath: string) {
    this.filePath = fpath
  }

  protected execute() {
    if (
      this.filePath ||
      process.argv.length >= 2 + Number(process.env.NODE_ENV === 'development')
    ) {
      const filePath =
        this.filePath ||
        path.resolve(
          process.argv[1 + Number(process.env.NODE_ENV === 'development')]
        )
      const ext = path.extname(filePath)
      const type = {
        '.mspr': 'resourcepack',
        '.mspe': 'extension',
        '.mspm': 'extension',
        '.mspt': 'tool'
      }[ext]
      if (type) {
        ipcMain.emit(`import-${type}`, {}, filePath)
        ipcMain.emit(`refresh-${type}`, {})
      }
    }
  }
}

export default new OpenFile()
