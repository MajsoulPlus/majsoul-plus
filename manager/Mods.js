const fs = require('fs')
const path = require('path')
const CardList = require('./common/CardList')
const configs = require('../configs')
const enabledMods = (() => {
  try {
    return JSON.parse(
      fs.readFileSync(configs.MODS_CONFIG_PATH).toString('utf-8')
    )
  } catch (error) {
    return []
  }
})()
const i18n = require('../i18nInstance')
const defaultOptions = {
  settingFilePath: configs.MODS_CONFIG_PATH,
  checkedKeys: enabledMods.map(item => `${item.name || '未命名'}|${item.author || '无名氏'}`),
  rootDir: path.join(__dirname, '../', configs.MODS_DIR),
  config: 'mod.json',
  renderTarget: 'modInfos'
}

class Mods extends CardList {
  constructor (options) {
    super({ ...defaultOptions, ...options })
  }
  _getExportInfo () {
    return {
      extend: 'mspm',
      typeText: i18n.t.manager.fileTypeMSPM()
    }
  }
}

module.exports = Mods
