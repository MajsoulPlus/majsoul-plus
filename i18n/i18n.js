const path = require('path')
const fs = require('fs')

/**
 * 自动地判断并读取一个js或者是json
 * @param {string} filePath Path
 */
const readLangFile = filePath => {
  switch (path.extname(filePath)) {
    case '.js':
      return require(filePath)
    case '.json':
      return JSON.parse(fs.readFileSync(filePath))
    default:
      return {}
  }
}
/**
 * 读取一个文件夹以及内部所有类JSON文件
 * @param {string} dirPath Path
 */
const readLangDir = dirPath => {
  const lang = {}
  const files = fs.readdirSync(dirPath)
  const filesPath = files.map(fileName => {
    return path.join(dirPath, fileName)
  })
  filesPath.forEach((filePath, index) => {
    const stat = fs.statSync(filePath)
    if (stat.isDirectory()) {
      lang[files[index]] = readLangDir(filePath)
    } else {
      const fileName = files[index]
      lang[path.basename(fileName, path.extname(fileName))] = readLangFile(
        filePath
      )
    }
  })
  return lang
}
class i18n {
  /**
   * 构造函数
   */
  constructor ({
    directory = path.join(__dirname, 'locales'),
    actives = ['zh-CN'],
    defaultLocale = 'zh-CN',
    autoReload = false
  } = {}) {
    // 如果文件夹参数不是文件夹，报错
    const stat = fs.statSync(directory)
    if (!stat.isDirectory()) {
      throw new Error('param directory is not a directory')
    }
    // 如果文件夹为空，报错
    const files = fs.readdirSync(directory)
    if (!files) {
      throw new Error('directory is empty, please make sure there is any files')
    }
    // 所有翻译文本
    this._locals = readLangDir(directory)
    // 活动的语言列表
    this.actives = actives
    // 当优先语言全部不存在，则加载该默认语言
    this.defaultLocale = defaultLocale
  }
  /**
   * 获取翻译文本
   * @returns {(...params?:string)=>{toString:string,[key:string]:function}}
   */
  get text () {
    const i18nInstance = this
    return {
      toString: () => {

      }
    }
  }
  get t () {
    return this.text
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
