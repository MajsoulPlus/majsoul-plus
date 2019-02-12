if (!global._i18nInstance) {
  global._i18nInstance = new (require('./i18n'))()
}
module.exports = global._i18nInstance
