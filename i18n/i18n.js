const path = require('path')
class i18n {
  constructor({
    directory = path.join(__dirname, 'locales'),
    actives = ['zh_CN'],
    defaultLocale = 'zh_CN',
    autoReload = false
  } = {}) {}
}
module.exports = i18n
