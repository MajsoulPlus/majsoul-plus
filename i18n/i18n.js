const fs = require('fs')
const defautLang = 'zh_CN'
const i18n = new Proxy(
  {},
  {
    get: key => {
      if (this[key]) {
        return this[key]
      }
      try {
        fs.statSync(key)
        this[key] = new Lang(key)
        return this[key]
      } catch (error) {
        return this[defautLang]
      }
    }
  }
)
