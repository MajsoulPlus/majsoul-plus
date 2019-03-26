const fs = require('fs')
const path = require('path')
const CardList = require('./common/CardList')
const configs = require('../configs')
const i18n = require('../i18nInstance')

const enabledExecutes = (() => {
  try {
    return JSON.parse(
      fs.readFileSync(configs.EXECUTES_CONFIG_PATH).toString('utf-8')
    )
  } catch (error) {
    return []
  }
})()
const defaultOptions = {
  settingFilePath: configs.EXECUTES_CONFIG_PATH,
  checkedKeys: enabledExecutes.map(
    item => `${item.name || '未命名'}|${item.author || '无名氏'}`
  ),
  rootDir: path.join(__dirname, '../', configs.EXECUTES_DIR),
  config: 'execute.json',
  renderTarget: 'executeInfos'
}

class Executes extends CardList {
  constructor (options = {}) {
    super({
      ...defaultOptions,
      ...options
    })
  }
  _getExportInfo () {
    return {
      extend: 'mspe',
      typeText: i18n.t.manager.fileTypeMSPE()
    }
  }
  _handleCheckedChange (key) {
    const { card } = this._cardList.find(item => item.key === key)
    const isAleatNeeded = Object.keys(card.options.executePreferences).filter(
      key => {
        return !!card.options.executePreferences[key]
      },
      true
    )
    if (card.checked && isAleatNeeded && isAleatNeeded.length > 0) {
      let confirmText = `${i18n.text.manager.executeSafeAlert()}`
      isAleatNeeded
        .map(key => {
          switch (key) {
            case 'document':
              return i18n.text.manager.executeSafeAlertDocument()
            case 'nodeRequire':
              return i18n.text.manager.executeSafeAlertWriteableNodeRequire()
            case 'XMLHTTPRequest':
              return i18n.text.manager.executeSafeAlertXMLHttpRequest()
            case 'WebSocket':
              return i18n.text.manager.executeSafeAlertWebSocket()
            case 'localStorage':
              return i18n.text.manager.executeSafeAlertLocalStorage()
            case 'writeableWindowObject':
              return i18n.text.manager.executeSafeAlertWriteableWindowObject()
          }
        })
        .forEach(text => {
          confirmText += `\n${text}`
        })
      const confirmed = confirm(confirmText)
      if (!confirmed) {
        card.checked = false
      }
    }
    super._handleCheckedChange.call(this, key)
  }
}
module.exports = Executes
