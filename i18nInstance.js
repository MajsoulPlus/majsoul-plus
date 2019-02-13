if (!global._i18nInstance) {
  global._i18nInstance = new (require('./i18n/i18n'))({
    autoReload: process.env.NODE_ENV === 'development'
  })
}
module.exports = global._i18nInstance
