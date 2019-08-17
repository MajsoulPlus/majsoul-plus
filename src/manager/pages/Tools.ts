import { ipcRenderer } from 'electron'
import i18n from '../../i18n'
import ButtonCard from '../ui/ButtonCard'
import CardList from '../ui/CardList'

class Tool extends CardList {
  handleCardClick(id: string) {
    const cardItem = this.cardListItemMap.get(id)
    ipcRenderer.send('start-tool', cardItem.card.options.id)
  }

  generateCardFromMetadata = (
    info: MajsoulPlus_Manager.CardMetadataWithEnable
  ) => {
    const card = new ButtonCard(info.metadata)
    const id = info.metadata.id
    this.cardListItemMap.set(id, { ...info, id, card })

    card.on('change', () => this.handleCheckedChange(id))
    card.on('export', () => this.handleExport(id))
    card.on('remove', () => this.handleRemove(id))
    card.on('click', () => this.handleCardClick(id))
  }

  getExportInfo() {
    return {
      extend: ['mspt'],
      typeText: i18n.text.manager.fileTypeMSPT()
    }
  }

  save() {}
}

export default new Tool()
