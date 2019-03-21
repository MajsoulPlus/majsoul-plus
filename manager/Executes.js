const fs = require('fs')
const path = require('path')
const CardList = require('./common/CardList')
const configs = require('../configs')
const enabledExecutes = (() => {
  try {
    return JSON.parse(
      fs.readFileSync(configs.EXECUTES_CONFIG_PATH).toString('utf-8')
    )
  } catch (error) {
    return []
  }
})()
const i18n = require('../i18nInstance')
const defaultOptions = {
  settingFilePath: configs.EXECUTES_CONFIG_PATH,
  checkedKeys: enabledExecutes.map(
    item => `${item.name || '未命名'}|${item.author || '无名氏'}`
  ),
  rootDir: path.join(__dirname, '../', configs.EXECUTES_DIR),
  config: 'execute.json',
  executePreferences: {
    nodeRequire: false, // 启用 node 的 require 支持
    XMLHTTPRequest: false, // 启用 XMLHTTPRequest
    WebSocket: false, // 启用 WebSocket
    writeableWindowObject: false // 允许对 window 对象进行写入（如果为 false 则修改仅在作用域内有效）
  },
  renderTarget: 'executeInfos'
}

class Executes extends CardList {
  constructor (options) {
    super({ ...defaultOptions, ...options })
  }
  _getExportInfo () {
    return {
      extend: 'mspe',
      typeText: i18n.t.manager.fileTypeMSPE()
    }
  }
}
module.exports = Executes
