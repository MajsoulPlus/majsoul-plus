if (!global._i18nInstance) {
  const I18n = require('./i18n/i18n')
  const i18nInstance = new I18n({
    autoReload: process.env.NODE_ENV === 'development'
  })
  global._i18nInstance = i18nInstance
  module.exports = i18nInstance
} else {
  module.exports = global._i18nInstance
}
