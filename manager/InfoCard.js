const path = require('path')
const infoCardIdMap = {}
/**
 * 信息卡
 */
class InfoCard {
  /**
   * 模组和插件通用的信息卡
   * @param {{name:string,author:string,description:string,preview:string,filesDir:string}} infos
   * @param {boolean} checked
   */
  constructor (infos, checked = false, isButton = false) {
    this.infos = infos
    this.checked = checked
    this.name = infos.name ? infos.name : '未知'
    this.author = infos.author ? infos.author : '无名氏'
    this.description = infos.description ? infos.description : '无描述'
    this.previewSrc = path.join(
      infos.filesDir,
      infos.preview ? infos.preview : 'preview.jpg'
    )
    this._inputType = isButton ? 'button' : 'checkbox'
    /**
     * @type {{[x:string]:Array<EventListener>}}
     */
    this._eventListeners = {}
    this.initDOM()
    this.edit = false
  }
  get DOM () {
    return this._dom
  }
  set DOM (value) {
    this._dom = value
    return value
  }
  initDOM () {
    const article = document.createElement('article')
    const preview = document.createElement('img')
    const h3 = document.createElement('h3')
    const address = document.createElement('address')
    const p = document.createElement('p')
    const input = document.createElement('input')
    const label = document.createElement('label')
    const exportBtn = document.createElement('button')
    const removeBtn = document.createElement('button')

    preview.src = this.previewSrc
    preview.addEventListener('error', function errFun () {
      preview.src = path.join(__dirname, 'defaultPreview.jpg')
      preview.removeEventListener('error', errFun)
    })
    preview.addEventListener('dragstart', event => {
      event.preventDefault()
    })

    h3.innerText = this.name
    address.innerText = this.author
    p.innerText = this.description

    if (this._inputType === 'checkbox') {
      input.type = 'checkbox'
      input.addEventListener('change', event => {
        if (this._eventListeners['change']) {
          this._eventListeners['change'].forEach(listener => {
            listener.call(this, event)
          })
        }
      })
      input.checked = this.checked
      Object.defineProperty(this, 'checked', {
        get: () => input.checked,
        set: value => (input.checked = value)
      })
    } else if (this._inputType === 'button') {
      input.type = 'button'
      input.addEventListener('click', event => {
        if (this._eventListeners['click']) {
          this._eventListeners['click'].forEach(listener => {
            listener.call(this, event)
          })
        }
      })
    }

    input.id = (function getRandomId () {
      let str = 'infoCard_'
      window.crypto.getRandomValues(new Uint32Array(3)).forEach(value => {
        str += value.toString(32)
      })
      if (infoCardIdMap[str]) {
        return getRandomId()
      }
      infoCardIdMap[str] = true
      return str
    })()
    label.setAttribute('for', input.id)

    exportBtn.className = 'export-btn'
    exportBtn.addEventListener('click', event => {
      if (this._eventListeners['export']) {
        this._eventListeners['export'].forEach(listener => {
          listener.call(this, event)
        })
      }
    })

    removeBtn.className = 'remove-btn'
    removeBtn.addEventListener('click', event => {
      if (this._eventListeners['remove']) {
        this._eventListeners['remove'].forEach(listener => {
          listener.call(this, event)
        })
      }
    })

    article.appendChild(preview)
    article.appendChild(h3)
    article.appendChild(p)

    article.appendChild(address)

    article.appendChild(input)
    article.appendChild(label)

    article.appendChild(exportBtn)
    article.appendChild(removeBtn)

    this.DOM = article
  }
  addEventListener (type, listener) {
    if (!this._eventListeners[type]) {
      this._eventListeners[type] = []
    }
    this._eventListeners[type].push(listener)
  }
  removeEventListener (type, listener) {
    if (!this._eventListeners[type]) {
      return
    }
    this._eventListeners[type].forEach((addedListener, index) => {
      if (addedListener === listener) {
        this._eventListeners[type].splice(index, 1)
      }
    })
  }
  get edit () {
    return this._edit
  }
  set edit (value) {
    this._edit = value
    if (value === true) {
      this.DOM.className = 'edit'
    } else {
      this.DOM.className = ''
    }
    return value
  }
}
module.exports = InfoCard
