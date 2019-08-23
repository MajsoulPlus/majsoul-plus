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
        (event, detail: MajsoulPlus_Manager.GetDetailMetadataResponse) => {
          resolve(detail)
        }
      )
    })
  }

  protected generateCardsFromDetails = (
    details: MajsoulPlus_Manager.GetDetailMetadataResponse
  ) => {
    for (const id of Object.keys(details)) {
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
    const card = new CheckedboxCard(info.metadata, info.enabled, info.sequence)
    const id = info.metadata.id
    this.cardListItemMap.set(id, { ...info, id, card })

    card.on('change', () => this.handleCheckedChange(id))
    card.on('export', () => this.handleExport(id))
    card.on('remove', () => this.handleRemove(id))
  }

  protected handleCheckedChange = (id: string) => {
    const cardItem = this.cardListItemMap.get(id)
    if (cardItem.card['checked'] !== undefined) {
      const details: MajsoulPlus_Manager.GetDetailMetadataResponse = ipcRenderer.sendSync(
        `change-${this.name.toLowerCase()}-enability`,
        id,
        cardItem.card['checked']
      )
      this.load(Promise.resolve(details))

      if (details[id].errors.length > 0) {
        const err = details[id].errors[0]
        switch (err[0]) {
          case 'dependencyVersionMismatch':
            alert(i18n.text.manager[err[0]](err[1], err[2], err[3]))
            break
          case 'dependencyNotFound':
          case 'dependencyNotEnabled':
            alert(i18n.text.manager[err[0]](err[1]))
            break
          default:
            break
        }
      }
    }
  }

  protected async handleExport(id: string) {
    const { extend, typeText } = this.getExportInfo()
    const exp = this.cardListItemMap.get(id)
    if (!exp) return

    const saveReturn = await dialog.showSaveDialog({
      title: i18n.text.manager.exportTo(),
      filters: [
        {
          name: typeText,
          extensions: extend
        }
      ],
      defaultPath: `${exp.metadata.name}(${id}) - ${exp.metadata.author}`
    })

    if (!saveReturn.canceled) {
      // 向主进程请求打包
      const resp: { err: string | undefined } = ipcRenderer.sendSync(
        `export-${this.name.toLowerCase()}`,
        id,
        saveReturn.filePath
      )
      if (resp.err) {
        alert(
          i18n.text.manager.exportExtendResourcesFailed(resp.err.toString())
        )
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
