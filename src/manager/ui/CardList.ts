import { ipcRenderer, remote } from 'electron'
import i18n from '../../i18n'
import Card from './Card'
import CheckedboxCard from './CheckedboxCard'

const dialog = remote.dialog

interface CardListItem extends MajsoulPlus_Manager.CardMetadataWithEnable {
  id: string
  card: Card | CheckedboxCard
}

export default class CardList {
  name: string
  cardListItemMap: Map<string, CardListItem> = new Map()

  constructor() {
    this.name = this.constructor.name
  }

  protected getCardDetails = (): Promise<
    MajsoulPlus_Manager.GetDetailMetadataResponse
  > => {
    ipcRenderer.send(`get-${this.name.toLowerCase()}-details`)
    return new Promise(resolve => {
      ipcRenderer.on(
        `get-${this.name.toLowerCase()}-details-response`,
        (
          event: Electron.Event,
          detail: MajsoulPlus_Manager.GetDetailMetadataResponse
        ) => {
          resolve(detail)
        }
      )
    })
  }

  protected generateCardsFromDetails = (
    details: MajsoulPlus_Manager.GetDetailMetadataResponse
  ) => {
    for (const id of Object.keys(details)) {
      // TODO: 渲染 errors
      details[id].metadata.type = this.name
      this.generateCardFromMetadata(details[id])
    }
  }

  protected renderCards = () => {
    const target = document.querySelector(`#${this.name}Infos`)
    target.innerHTML = ''
    this.cardListItemMap.forEach(({ card }) => {
      const { DOM } = card
      target.appendChild(DOM)
    })
  }

  protected generateCardFromMetadata = (
    info: MajsoulPlus_Manager.CardMetadataWithEnable
  ) => {
    const card = new CheckedboxCard(info.metadata, info.enabled)
    const id = info.metadata.id
    this.cardListItemMap.set(id, { ...info, id, card })

    card.on('change', () => this.handleCheckedChange(id))
    card.on('export', () => this.handleExport(id))
    card.on('remove', () => this.handleRemove(id))
  }

  protected handleCheckedChange = (id: string) => {
    const cardItem = this.cardListItemMap.get(id)
    if (cardItem.card['checked'] !== undefined) {
      const details = ipcRenderer.sendSync(
        `change-${this.name.toLowerCase()}-enability`,
        id,
        cardItem.card['checked']
      )
      this.load(Promise.resolve(details))
    }
  }

  protected handleExport(id: string) {
    const { extend, typeText } = this.getExportInfo()

    const pathToSave = dialog.showSaveDialog({
      title: i18n.text.manager.exportTo(),
      filters: [
        {
          name: typeText,
          extensions: [extend]
        }
      ]
    })

    if (pathToSave) {
      // 向主进程请求打包
      const resp: { err: string | undefined } = ipcRenderer.sendSync(
        `zip-${this.name.toLowerCase()}`,
        id,
        pathToSave
      )
      if (resp.err) {
        alert(i18n.text.manager.exportExtendResourcesFailed(resp.err))
      } else {
        alert(i18n.text.manager.exportExtendResourcesSucceeded())
      }
    }
  }

  protected handleRemove = (id: string) => {
    const cardItem = this.cardListItemMap.get(id)
    cardItem.card.DOM.remove()
    ipcRenderer.sendSync(`remove-${this.name.toLowerCase()}`, id)
    this.refresh()
  }

  protected getExportInfo(): MajsoulPlus_Manager.ExportInfo {
    return undefined
  }

  load(details = this.getCardDetails()) {
    this.cardListItemMap.clear()
    details.then(details => {
      console.log(this.name, details)
      this.generateCardsFromDetails(details)
      this.renderCards()
    })
  }

  refresh() {
    const details = ipcRenderer.sendSync(`refresh-${this.name.toLowerCase()}`)
    this.load(Promise.resolve(details))
  }

  save() {
    ipcRenderer.sendSync(`save-${this.name.toLowerCase()}-enabled`)
  }

  changeEditable() {
    this.cardListItemMap.forEach(cardItem => {
      cardItem.card.setEditable(!cardItem.card.isEditable())
    })
  }
}
