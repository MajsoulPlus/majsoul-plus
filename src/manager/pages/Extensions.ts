import { ipcRenderer } from 'electron'
import * as path from 'path'
import { Global, GlobalPath } from '../../global'
import { i18n } from '../../i18nInstance'
import { MajsoulPlus } from '../../majsoul_plus'
import { CardList } from '../ui/CardList'

let enabledExtensions: string[]
let extensionDetails: {
  [extension: string]: MajsoulPlus.Extension
}

export class Extensions extends CardList {
  constructor(options: MajsoulPlus_Manager.CardListConstructorOptions) {
    enabledExtensions = ipcRenderer.sendSync('extension-list')
    extensionDetails = ipcRenderer.sendSync('extension-detail')

    const defaultOptions = {
      settingFilePath: Global.ExtensionConfigPath,
      checkedKeys: enabledExtensions.map(
        item =>
          `${extensionDetails[item].name}|${extensionDetails[item].author}`
      ),
      rootDir: path.join(__dirname, '../bin', GlobalPath.ExtensionDir),
      config: 'extension.json',
      renderTarget: 'modInfos'
    }
    super({ ...defaultOptions, ...options })
  }

  protected getExportInfo() {
    return {
      extend: 'mspm',
      typeText: i18n.text.manager.fileTypeMSPM()
    }
  }

  protected handleCheckedChange(key: string) {
    //
  }
}
