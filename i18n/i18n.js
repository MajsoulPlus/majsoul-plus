const path = require('path')
const fs = require('fs')

/**
 * 自动地判断并读取一个js或者是json
 * @param {string} filePath Path
 */
const readLangFile = filePath => {
  switch (path.extname(filePath)) {
    case '.js':
      delete require.cache[filePath]
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
    actives = [],
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
    // 当优先语言全部不存在，则加载该默认语言
    this.defaultLocale = defaultLocale
    // 设置活动的语言列表
    this.actives = actives
    // 如果设置了自动更新翻译
    if (autoReload) {
      /**
       * @type {string[]} 已被监听的文件夹列表
       */
      const calledList = []
      /**
       * 递归为一个文件夹内全部文件夹执行事件，重复调用不会执行
       * @param {string} filePath
       * @param {function} callback
       */
      const recursiveDir = (filePath, callback) => {
        fs.stat(filePath, (error, stat) => {
          if (error) {
            throw error
          }
          if (stat.isDirectory()) {
            if (!calledList.includes(filePath)) {
              callback.call(this, filePath)
              calledList.push(filePath)
            }
            fs.readdir(filePath, (error, files) => {
              if (error) {
                throw error
              }
              files.forEach(file => {
                recursiveDir(path.join(filePath, file), callback)
              })
            })
          }
        })
      }
      const dirWatcher = dirPath => {
        fs.watch(dirPath, eventType => {
          if (eventType === 'change') {
            // 重新载入所有翻译文本
            this._locals = readLangDir(directory)
            recursiveDir(dirPath, dirWatcher)
          }
        })
      }
      recursiveDir(directory, dirWatcher)
    }
  }
  /**
   * 获取翻译文本
   * @returns {(...params?:string)=>{[key:string]:function}}
   */
  get text () {
    /**
     * 格式化模板字符串
     * @param {string} string
     * @param  {...string} args
     */
    const formatString = (string, ...args) => {
      for (let index in args) {
        string = string.replace(`$${index}`, args[index])
      }
      return string
    }
    /**
     * 创建一个被包装过的Object
     * @param {string[]} chainsArray 调用链
     */
    const createProxy = chainsArray => {
      return new Proxy(
        (() => {
          const f = (...args) => {
            for (let i = 0; i < this._actives.length; i++) {
              let localeObj = this.locals[this._actives[i]]
              if (!localeObj) {
                break
              }
              for (let j = 0; j < f._chains.length; j++) {
                localeObj = localeObj[f._chains[j]]
                if (!localeObj) {
                  break
                } else if (j === f._chains.length - 1) {
                  return formatString(localeObj, ...args)
                }
              }
            }
            return undefined
          }
          f._chains = chainsArray
          return f
        })(),
        {
          get: (target, key) => {
            if (!target[key]) {
              target[key] = createProxy(target._chains.concat(key))
            }
            return target[key]
          }
        }
      )
    }
    return new Proxy(
      {},
      {
        get: (target, key) => {
          return createProxy([].concat(key))
        }
      }
    )
  }
  get t () {
    return this.text
  }
  get _ () {
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
   * 活动的语言列表的拷贝
   * @returns {string[]}
   */
  get actives () {
    const copy = this._actives.concat()
    copy.pop()
    return copy
  }
  /**
   * @param {string[]} localTags
   */
  set actives (localTags) {
    this._actives = localTags.concat(this.defaultLocale)
  }
}
module.exports = i18n
