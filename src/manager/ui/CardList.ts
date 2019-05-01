import { remote } from 'electron'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { i18n } from '../../i18nInstance'
import { removeDirSync, zipDir } from '../../utils-refactor'
import { Card } from './Card'
import { CheckedboxCard } from './CheckedboxCard'

const dialog = remote.dialog

interface CardListItem {
  key: string
  card: Card | CheckedboxCard
}

interface ExportInfo {
  extend?: string
  typeText?: string
}

const defaultOptions = {
  rootDir: '',
  config: '',
  checkedKeys: [],
  renderTarget: ''
}

export class CardList {
  cardList: CardListItem[] = []
  options: MajsoulPlus_Manager.CardListConstructorOptions

  constructor(options: MajsoulPlus_Manager.CardListConstructorOptions) {
    this.options = options

    // TODO: Remove the following after refactor
    this.getCardInfo = this.getCardInfo.bind(this)
    this.getCards = this.getCards.bind(this)
    this.getCard = this.getCard.bind(this)
    this.renderCards = this.renderCards.bind(this)
  }

  protected getCardInfo = (dir: string) => {
    const { rootDir, config } = this.options
    const dirPath = path.join(rootDir, dir)
    const stat = fs.statSync(dirPath)
    if (stat.isDirectory()) {
      try {
        const data = fs.readFileSync(path.join(dirPath, config), {
          encoding: 'utf-8'
        })
        const info = JSON.parse(data)
        info.filesDir = dirPath
        return info
      } catch (error) {
        return null
      }
    } else {
      return null
    }
  }

  protected async getCardInfos() {
    const { rootDir } = this.options
    const dirs = fs.readdirSync(rootDir)
    const list = await Promise.all(dirs.map(this.getCardInfo))
    return list.filter(item => !!item)
  }

  protected getCards = (cardInfos = []) => {
    const cards = cardInfos.map(this.getCard)
    this.cardList = cards
    return Promise.resolve(cards)
  }

  protected getCard(
    cardInfo: MajsoulPlus_Manager.CardConstructorOptions
  ): CardListItem {
    const card = new CheckedboxCard(cardInfo)
    const key = `${cardInfo.name}|${cardInfo.author}`
    if (this.options.checkedKeys) {
      card.checked = this.options.checkedKeys.includes(key)
    }
    card.on('change', () => this.handleCheckedChange(key))
    card.on('export', () => this.handleExport(key))
    card.on('remove', () => this.handleRemove(key))
    return {
      key,
      card
    }
  }

  protected handleCheckedChange(key: string) {
    const { card } = this.cardList.find(item => item.key === key)
    if (card['checked'] && !this.options.checkedKeys.includes(key)) {
      this.options.checkedKeys.push(key)
    } else if (
      card['checked'] !== undefined &&
      !card['checked'] &&
      this.options.checkedKeys.includes(key)
    ) {
      const index = this.options.checkedKeys.indexOf(key)
      this.options.checkedKeys.splice(index, 1)
    }
  }

  protected getExportInfo(): ExportInfo {
    return {}
  }

  protected handleExport(key: string) {
    const {
      card: {
        options: { name, author, filesDir }
      }
    } = this.cardList.find(item => item.key === key)
    const { extend, typeText } = this.getExportInfo()
    const tempZipName = `${name}-${author}.${extend}`
    const tempZipPath = path.join(os.tmpdir(), tempZipName)
    zipDir(filesDir, tempZipPath)
    const userChosenPath = dialog.showSaveDialog({
      title: i18n.text.manager.exportTo(),
      filters: [
        {
          name: typeText,
          extensions: [extend]
        },
        {
          name: i18n.text.manager.fileTypeAllfiles(),
          extensions: ['*']
        }
      ],
      defaultPath: tempZipName
    })
    if (userChosenPath) {
      fs.copyFile(tempZipPath, userChosenPath, err => {
        if (err) {
          alert(i18n.text.manager.exportExtendResourcesFailed(err))
        } else {
          alert(i18n.text.manager.exportExtendResourcesSucceeded())
        }
      })
    }
  }

  protected handleRemove(key: string) {
    const { card } = this.cardList.find(item => item.key === key)
    card.DOM.remove()
    const { filesDir } = card.options
    removeDirSync(filesDir)
    this.load()
  }

  protected renderCards = () => {
    const { renderTarget } = this.options
    const target = document.getElementById(renderTarget)
    target.innerHTML = ''
    this.cardList.forEach(({ card }) => {
      const { DOM } = card
      target.appendChild(DOM)
    })
  }

  load() {
    return this.getCardInfos()
      .then(this.getCards)
      .then(this.renderCards)
  }

  save() {
    const { checkedKeys, settingFilePath } = this.options
    const launchedCards = this.cardList
      .filter(item => checkedKeys.includes(item.key))
      .map(item => item.card.options)
    fs.writeFileSync(settingFilePath, JSON.stringify(launchedCards), {
      encoding: 'utf-8'
    })
  }

  changeEditable() {
    this.cardList.forEach(item => {
      item.card.editable = !item.card.editable
    })
  }
}
