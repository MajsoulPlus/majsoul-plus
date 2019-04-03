const Listener = require('./Listener')
const path = require('path')
const { i18n } = require('../../dist/i18nInstance')
const defaultOptions = {
  name: '未知',
  author: i18n.text.manager.missingAuthor(),
  description: '无描述',
  preview: 'preview.jpg'
}
class Card {
  constructor (options) {
    this.options = { ...defaultOptions, ...options }
    this._listener = new Listener()
    this._dom = this._createDOM()
    this._editable = false
  }

  _getPreviewPath () {
    const { preview, filesDir } = this.options
    return path.join(filesDir, preview)
  }

  _getRandomId () {
    var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split(''); var uuid = new Array(36); var rnd = 0; var r
    for (var i = 0; i < 36; i++) {
      if (i === 8 || i === 13 || i === 18 || i === 23) {
        uuid[i] = '-'
      } else if (i === 14) {
        uuid[i] = '4'
      } else {
        if (rnd <= 0x02) { rnd = 0x2000000 + (Math.random() * 0x1000000) | 0 }
        r = rnd & 0xf
        rnd = rnd >> 4
        uuid[i] = chars[(i === 19) ? (r & 0x3) | 0x8 : r]
      }
    }
    return `${uuid.join('').replace(/-/gm, '').toLowerCase()}`
  }

  _createInputElements () {

  }

  _createH3Element () {
    const h3 = document.createElement('h3')
    h3.innerText = this.options.name
    return h3
  }

  _createAddressElement () {
    const address = document.createElement('address')
    address.innerText = this.options.author
    return address
  }

  _createPreviewElement () {
    const preview = document.createElement('img')
    preview.src = this._getPreviewPath()
    preview.addEventListener('error', function errFun () {
      preview.src = path.join(__dirname, '../', 'defaultPreview.jpg')
      preview.removeEventListener('error', errFun)
    })
    preview.addEventListener('dragstart', evt => evt.preventDefault())
    return preview
  }

  _createPElement () {
    const p = document.createElement('p')
    p.innerText = this.options.description
    return p
  }

  _createExportButton () {
    const exportButton = document.createElement('button')
    exportButton.className = 'export-btn'
    exportButton.addEventListener('click', evt => {
      this._listener.emit('export', evt)
    })
    return exportButton
  }

  _createRemoveButton () {
    const removeButton = document.createElement('button')
    removeButton.className = 'remove-btn'
    removeButton.addEventListener('click', evt => {
      this._listener.emit('remove', evt)
    })
    return removeButton
  }

  _createDOM () {
    const article = document.createElement('article')
    const preview = this._createPreviewElement()
    const h3 = this._createH3Element()
    const address = this._createAddressElement()
    const p = this._createPElement()
    const { input, label } = this._createInputElements()
    const exportButton = this._createExportButton()
    const removeButton = this._createRemoveButton()
    article.appendChild(preview)
    article.appendChild(h3)
    article.appendChild(p)
    article.appendChild(address)
    article.appendChild(input)
    article.appendChild(label)
    article.appendChild(exportButton)
    article.appendChild(removeButton)
    return article
  }

  get DOM () {
    return this._dom
  }

  get editable () {
    return this._editable
  }

  set editable (value) {
    this._editable = value
    this._dom.className = value ? 'edit' : ''
    return value
  }

  on (event, handle) {
    this._listener.on(event, handle)
  }

  off (event, handle) {
    this._listener.off(event, handle)
  }

  emit (event) {
    this._listener.emit(event)
  }
}

module.exports = Card
