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
  renderTarget: 'executeInfos',
  executePreferences: {
    document: false, // 允许访问 document 对象
    nodeRequire: false, // 启用 node 的 require 支持,
    XMLHTTPRequest: false, // 启用 XMLHTTPRequest
    WebSocket: false, // 启用 WebSocket,
    localStorage: false, // 允许访问 localStorage
    writeableWindowObject: false // 允许对 window 对象进行写入（如果为 false 则修改仅在作用域内有效）
  }
}

class Executes extends CardList {
  constructor (options = {}) {
    super({
      ...defaultOptions,
      ...options
    })
  }
  _getCardInfo (dir) {
    const info = super._getCardInfo.call(this, dir)
    if (typeof info === 'object' && info !== null) {
      info.executePreferences = {
        ...defaultOptions.executePreferences,
        ...info.executePreferences
      }
    }
    return info
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
              return i18n.text.manager.executeSafeAlertNodeRequire()
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
      const confirmed = window.confirm(confirmText)
      if (!confirmed) {
        card.checked = false
      }
    }
    return super._handleCheckedChange.call(this, key)
  }
}
module.exports = Executes
