if (!global._i18nInstance) {
  const I18n = require('./i18n/i18n')
  global._i18nInstance = new I18n({
    autoReload: process.env.NODE_ENV === 'development'
  })
}
module.exports = global._i18nInstance
