import i18n from '../../i18n'
import CardList from '../ui/CardList'

class ResourcePack extends CardList {
  protected getExportInfo() {
    return {
      extend: 'mspr',
      typeText: i18n.text.manager.fileTypeMSPM()
    }
  }

  protected handleCheckedChange = (key: string) => {
    // TODO
  }
}

export default new ResourcePack()
