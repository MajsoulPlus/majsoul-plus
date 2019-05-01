import { ipcRenderer } from 'electron'
import * as path from 'path'
import { Global, GlobalPath } from '../../global'
import { i18n } from '../../i18nInstance'
import { ButtonCard } from '../ui/ButtonCard'
import { CardList } from '../ui/CardList'

const defaultOptions = {
  settingFilePath: Global.ToolWindowConfig,
  rootDir: path.join(__dirname, '../', GlobalPath.ToolsDir),
  config: 'tool.json',
  renderTarget: 'toolInfos'
}

export class Tools extends CardList {
  constructor(options) {
    super({ ...defaultOptions, ...options })
  }

  handleCardClick(key: string) {
    const { card } = this.cardList.find(item => item.key === key)
    ipcRenderer.send('start-tool', card.options)
  }

  getCard(cardInfo: MajsoulPlus_Manager.CardConstructorOptions) {
    const card = new ButtonCard(cardInfo)
    const key = `${cardInfo.name}|${cardInfo.author}`
    card.on('click', () => this.handleCardClick(key))
    card.on('export', () => this.handleExport(key))
    card.on('remove', () => this.handleRemove(key))
    return {
      key,
      card
    }
  }

  getExportInfo() {
    return {
      extend: 'mspt',
      typeText: i18n.text.manager.fileTypeMSPT()
    }
  }

  save() {}
}
