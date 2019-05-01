const path = require('path')
const { ipcRenderer } = require('electron')

const CardList = require('./ui/CardList')
const { Global, GlobalPath } = require('..//global')
const ButtonCard = require('./ui/ButtonCard')
const { i18n } = require('..//i18nInstance')
const defaultOptions = {
  settingFilePath: Global.ToolWindowConfig,
  rootDir: path.join(__dirname, '../', GlobalPath.ToolsDir),
  config: 'tool.json',
  renderTarget: 'toolInfos'
}

class Tools extends CardList {
  constructor(options) {
    super({ ...defaultOptions, ...options })
  }
  handleCardClick(key) {
    const { card } = this.cardList.find(item => item.key === key)
    ipcRenderer.send('application-message', 'start-tool', card.options)
  }

  getCard(cardInfo) {
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
module.exports = Tools
