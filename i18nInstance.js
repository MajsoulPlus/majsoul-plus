if (!global._i18nInstance) {
  const I18n = require('./i18n/i18n')
  const electron = require('electron')
  /**
   * @type {Electron.App}
   */
  let app
  if (electron.app) {
    app = electron.app
  } else {
    app = electron.remote.app
  }
  const i18nInstance = new I18n({
    autoReload: process.env.NODE_ENV === 'development',
    actives: [app.getLocale()]
  })
  global._i18nInstance = i18nInstance
  module.exports = i18nInstance
} else {
  module.exports = global._i18nInstance
}
