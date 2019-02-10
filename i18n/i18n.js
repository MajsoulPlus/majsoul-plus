const path = require('path')
const fs = require('fs')

/**
 * 读取一个js或者是json
 * @param {string} filePath Path
 */
const readJsonLikeFile = filePath => {
  switch (path.extname(filePath)) {
    case 'js':
      return require(filePath)
    case 'json':
    default:
      return JSON.parse(fs.readFileSync(filePath))
  }
}
class i18n {
  /**
   * 构造函数
   */
  constructor ({
    directory = path.join(__dirname, 'locales'),
    actives = ['zh_CN'],
    defaultLocale = 'zh_CN',
    autoReload = false
  } = {}) {
    const stat = fs.statSync(directory)
    if (!stat.isDirectory()) {
      throw new Error('param directory is not a directory')
    }
    const files = fs.readdirSync(directory)
    if (!files) {
      throw new Error('directory is empty, please make sure there is any files')
    }
    const filesPath = files.map(fileName => {
      return path.join(directory, fileName)
    })
    this._locals = {}
    filesPath.forEach((filePath, index) => {
      const stat = fs.statSync(filePath)
      if (stat.isDirectory()) {
        this.locals[files[index]] = {}
      } else {
        this.locals[path.basename(files[index])] = readJsonLikeFile(filePath)
      }
    })
  }
  /**
   * 已经加载的翻译文本
   * @returns {{[localTag: string] : {[type:string]:string}}}
   */
  get locals () {
    return this._locals
  }
  /**
   * 活动的语言列表
   * @returns {string[]}
   */
  get actives () {
    return this._actives
  }
  /**
   * @param {string[]} localTag
   */
  set actives (localTag) {
    this._actives = localTag
  }
}
module.exports = i18n
