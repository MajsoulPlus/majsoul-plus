const path = require('path')
const fs = require('fs')
const CSV = require('./csv')

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
    case '.csv':
      /**
       * @type {string[][]}
       */
      const csv = new CSV(fs.readFileSync(filePath).toString(), {
        cast: false
      }).parse()
      const localeObj = {}
      csv.forEach(line => {
        localeObj[line[0]] = line[2]
      })
      return localeObj
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
    defaultLocale = 'en-US',
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
    // 读取所有翻译文本
    this._locals = readLangDir(directory)
    // 设置一个绑定列表
    /**
     * @type {any[]}
     */
    this._bindElementList = []
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
            // 如果出现新文件夹，自动监听
            recursiveDir(dirPath, dirWatcher)
            // 更新绑定的翻译
            this._updateLocales()
          }
        })
      }
      recursiveDir(directory, dirWatcher)
    }
  }
  /**
   * 更新所有绑定翻译的内容
   */
  _updateLocales () {
    this._bindElementList.forEach(({ locale, htmlElement, type, args }) => {
      const text = locale(...args)
      switch (type) {
        case 'text': {
          htmlElement.innerText = text
          break
        }
        case 'html': {
          htmlElement.innerHTML = text
        }
      }
    })
  }
  /**
   * 绑定一条翻译到指定DOM元素
   * @param {function} locale 一个locale函数对象
   * @param {HTMLElement} htmlElement HTMLElement
   * @param {"text" | "html"} type 绑定到的类型
   * @param  {...string} args locale参数
   */
  _bindElement (locale, htmlElement, type, ...args) {
    this._bindElementList.push({
      locale: locale,
      htmlElement: htmlElement,
      type: type,
      args: args
    })
    this._updateLocales()
  }
  /**
   * 解绑指定DOM元素的所有绑定
   * @param {HTMLElement} htmlElement HTMLElement
   */
  unbindElement (htmlElement) {
    this._bindElementList = this._bindElementList.filter(
      ({ htmlElementTest }) => {
        return htmlElementTest !== htmlElement
      }
    )
  }
  /**
   * 绑定一条翻译到指定DOM元素的 innerText
   * @param {function} locale 一个locale函数对象
   * @param {HTMLElement} htmlElement HTMLElement
   * @param  {...string} args locale参数
   */
  bindElementText (locale, htmlElement, ...args) {
    return this._bindElement(locale, htmlElement, 'text', ...args)
  }
  /**
   * 绑定一条翻译到指定DOM元素的 innerHTML
   * @param {function} locale 一个locale函数对象
   * @param {HTMLElement} htmlElement HTMLElement
   * @param  {...string} args locale参数
   */
  bindElementHTML (locale, htmlElement, ...args) {
    return this._bindElement(locale, htmlElement, 'html', ...args)
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
                continue
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
            return 'MissingText'
          }
          f._chains = chainsArray
          /**
           * @param {HTMLElement} htmlElement
           * @param {...string} args
           */
          f.renderAsText = (htmlElement, ...args) => {
            this.bindElementText(f, htmlElement, ...args)
          }
          /**
           * @param {HTMLElement} htmlElement
           * @param {...string} args
           */
          f.renderAsHTML = (htmlElement, ...args) => {
            this.bindElementHTML(f, htmlElement, ...args)
          }
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
  /**
   * 根据 dataset.i18n 绑定翻译到DOM元素树
   * @param {HTMLElement} htmlElement HTMLElement
   * @param {"text" | "html"} type 绑定到的类型
   * @param  {...string} args locale参数
   */
  _parseAllElements (htmlElement, type, ...args) {
    /**
     * 渲染翻译
     * @param {HTMLElement} element
     */
    const renderElement = element => {
      const i18nLocaleKeyChain = element.dataset.i18n.split('.')
      const i18nLocaleElement = (() => {
        let SelectedElement = this.text
        i18nLocaleKeyChain.forEach(i18nLocaleKey => {
          SelectedElement = SelectedElement[i18nLocaleKey]
        })
        return SelectedElement
      })()
      this._bindElement(i18nLocaleElement, element, type, ...args)
    }
    if (htmlElement.getAttribute('data-i18n')) {
      renderElement(htmlElement)
    }
    htmlElement.querySelectorAll('[data-i18n]').forEach(renderElement)
  }
  /**
   * 根据 dataset.i18n 绑定翻译到DOM元素树 Text
   * @param {HTMLElement} htmlElement HTMLElement
   */
  parseAllElementsText (htmlElement) {
    return this._parseAllElements(htmlElement, 'text')
  }
  /**
   * 根据 dataset.i18n 绑定翻译到DOM元素树 HTML
   * @param {HTMLElement} htmlElement HTMLElement
   */
  parseAllElementsHTML (htmlElement) {
    return this._parseAllElements(htmlElement, 'html')
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
    this._updateLocales()
  }
}
module.exports = i18n
