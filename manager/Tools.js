const path = require('path')
const {ipcRenderer} = require('electron')

const CardList = require('./common/CardList')
const configs = require('../configs')
const ButtonCard = require('./common/ButtonCard')
const defaultOptions = {
  settingFilePath: configs.TOOL_WINDOW_CONFIG,
  rootDir: path.join(__dirname, '../', configs.TOOLS_DIR),
  config: 'tool.json',
  renderTarget: 'toolInfos'
}

class Tools extends CardList {
  constructor (options) {
    super(options)
  }

  _handleCardClick(key){
    const {card} = this._cardList.find(item => item.key === key)
    ipcRenderer.send('application-message', 'start-tool', card.options)
  }

  _getCard(cardInfo){
    const card = new ButtonCard(cardInfo)
    const key = `${cardInfo.name}|${cardInfo.author}`
    card.on('click', () => this._handleCardClick(key))
    card.on('export', () => this._handleExport(key))
    card.on('remove', () => this._handleRemove(key))
    return {
      key,
      card,
    }
  }

  _getExportInfo () {
    return {
      extend: 'mspt',
      typeText: '工具'
    }
  }

  save(){}
}
module.exports = new Tools(defaultOptions)
