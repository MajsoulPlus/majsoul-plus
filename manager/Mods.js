const fs = require('fs')
const path = require('path')
const CardList = require('./ui/CardList')
const { Global, GlobalPath } = require('..//global')
const enabledMods = (() => {
  try {
    return JSON.parse(fs.readFileSync(Global.ModsConfigPath).toString('utf-8'))
  } catch (error) {
    return []
  }
})()
const { i18n } = require('..//i18nInstance')
const defaultOptions = {
  settingFilePath: Global.ModsConfigPath,
  checkedKeys: enabledMods.map(
    item => `${item.name || '未命名'}|${item.author || '无名氏'}`
  ),
  rootDir: path.join(__dirname, '../', GlobalPath.ModsDir),
  config: 'mod.json',
  renderTarget: 'modInfos'
}

class Mods extends CardList {
  constructor(options) {
    super({ ...defaultOptions, ...options })
  }
  _getExportInfo() {
    return {
      extend: 'mspm',
      typeText: i18n.text.manager.fileTypeMSPM()
    }
  }
  _handleCheckedChange(key) {
    const { card } = this._cardList.find(item => item.key === key)
    if (typeof card.options.execute === 'object') {
      if (!card.options.execute.executePreferences) {
        card.options.execute.executePreferences = {}
      }
      const isAleatNeeded = Object.keys(
        card.options.execute.executePreferences
      ).filter(key => {
        return !!card.options.execute.executePreferences[key]
      }, true)
      if (card.checked && isAleatNeeded && isAleatNeeded.length > 0) {
        let confirmText = `${i18n.text.manager.executeSafeAlert()}`
        isAleatNeeded
          .map(key => {
            switch (key) {
              case 'document':
                return i18n.text.manager.executeSafeAlertDocument()
              case 'nodeRequire':
                return i18n.text.manager.executeSafeAlertNodeRequire()
              case 'XMLHttpRequest':
                return i18n.text.manager.executeSafeAlertXMLHttpRequest()
              case 'WebSocket':
                return i18n.text.manager.executeSafeAlertWebSocket()
              case 'localStorage':
                return i18n.text.manager.executeSafeAlertLocalStorage()
              case 'writeableWindowObject':
                return i18n.text.manager.executeSafeAlertWriteableWindowObject()
              default:
                return key
            }
          })
          .forEach(text => {
            confirmText += `\n${text}`
          })
        const confirmed = window.confirm(confirmText)
        if (!confirmed) {
          card.checked = false
        }
      }
    }
    return super._handleCheckedChange.call(this, key)
  }
}

module.exports = Mods
