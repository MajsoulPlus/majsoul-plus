const path = require('path')
const fs = require('fs')
const os = require('os')
const {
  remote: { dialog }
} = require('electron')
const CheckboxCard = require('./CheckboxCard')
const Util = require('../../Util')
const i18n = require('../../i18nInstance')

const defaultOptions = {
  rootDir: '',
  config: '',
  checkedKeys: [],
  renderTarget: '',
  executePreferences: {
    document: false, // 允许访问 document 对象
    nodeRequire: false, // 启用 node 的 require 支持,
    XMLHTTPRequest: false, // 启用 XMLHTTPRequest
    WebSocket: false, // 启用 WebSocket,
    localStorage: false, // 允许访问 localStorage
    writeableWindowObject: false // 允许对 window 对象进行写入（如果为 false 则修改仅在作用域内有效）
  }
}
class CardList {
  constructor (options) {
    this._cardList = []
    this.options = options
    this._getCardInfo = this._getCardInfo.bind(this)
    this._getCards = this._getCards.bind(this)
    this._getCard = this._getCard.bind(this)
    this._renderCards = this._renderCards.bind(this)
  }

  _getCardInfo (dir) {
    const { rootDir, config } = this.options
    const dirPath = path.join(rootDir, dir)
    const stat = fs.statSync(dirPath)
    if (stat.isDirectory()) {
      try {
        const data = fs.readFileSync(path.join(dirPath, config))
        const info = JSON.parse(data.toString('utf-8'))
        info.filesDir = dirPath
        info.executePreferences = {
          ...defaultOptions.executePreferences,
          ...info.executePreferences
        }
        return info
      } catch (error) {
        return null
      }
    } else {
      return null
    }
  }

  _getCardInfos () {
    const { rootDir } = this.options
    const dirs = fs.readdirSync(rootDir)
    return Promise.all(dirs.map(this._getCardInfo)).then(list =>
      list.filter(item => !!item)
    )
  }

  _getCards (cardInfos = []) {
    const cards = cardInfos.map(this._getCard)
    this._cardList = cards
    return Promise.resolve(cards)
  }

  _getCard (cardInfo) {
    const card = new CheckboxCard(cardInfo)
    const key = `${cardInfo.name}|${cardInfo.author}`
    card.checked = this.options.checkedKeys.includes(key)
    card.on('change', () => this._handleCheckedChange(key))
    card.on('export', () => this._handleExport(key))
    card.on('remove', () => this._handleRemove(key))
    return {
      key,
      card
    }
  }

  _handleCheckedChange (key) {
    const { card } = this._cardList.find(item => item.key === key)
    if (card.checked && !this.options.checkedKeys.includes(key)) {
      this.options.checkedKeys.push(key)
    } else if (!card.checked && this.options.checkedKeys.includes(key)) {
      const index = this.options.checkedKeys.indexOf(key)
      this.options.checkedKeys.splice(index, 1)
    }
  }

  _getExportInfo () {}

  _handleExport (key) {
    const {
      card: {
        options: { name, author, filesDir }
      }
    } = this._cardList.find(item => item.key === key)
    const { extend, typeText } = this._getExportInfo()
    const tempZipName = `${name}-${author}.${extend}`
    const tempZipPath = path.join(os.tmpdir(), tempZipName)
    Util.zipDir(filesDir, tempZipPath)
    const userChosenPath = dialog.showSaveDialog({
      title: i18n.t.manager.exportTo(),
      filters: [
        {
          name: typeText,
          extensions: [extend]
        },
        {
          name: i18n.t.manager.fileTypeAllfiles(),
          extensions: ['*']
        }
      ],
      defaultPath: tempZipName
    })
    if (userChosenPath) {
      fs.copyFile(tempZipPath, userChosenPath, err => {
        if (err) {
          alert(i18n.t.manager.exportExtendResourcesFailed(err))
        } else {
          alert(i18n.t.manager.exportExtendResourcesSucceeded())
        }
      })
    }
  }

  _handleRemove (key) {
    const { card } = this._cardList.find(item => item.key === key)
    card.DOM.remove()
    const { filesDir } = card.options
    Util.removeDirSync(filesDir)
    this.load()
  }

  _renderCards () {
    const { renderTarget } = this.options
    const target = document.getElementById(renderTarget)
    target.innerHTML = ''
    this._cardList.forEach(({ card }) => {
      const { DOM } = card
      target.appendChild(DOM)
    })
  }

  load () {
    return this._getCardInfos()
      .then(this._getCards)
      .then(this._renderCards)
  }

  save () {
    const { checkedKeys, settingFilePath } = this.options
    const launchedCards = this._cardList
      .filter(item => checkedKeys.includes(item.key))
      .map(item => item.card.options)
    fs.writeFileSync(settingFilePath, JSON.stringify(launchedCards), {
      encoding: 'utf-8'
    })
  }

  get cardList () {
    return this._cardList
  }

  changeEditable () {
    this._cardList.forEach(item => {
      item.card.editable = !item.card.editable
    })
  }
}

module.exports = CardList
