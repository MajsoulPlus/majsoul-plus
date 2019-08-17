import i18n from '../../i18n'
import CardList from '../ui/CardList'

class ResourcePack extends CardList {
  protected getExportInfo() {
    return {
      extend: ['mspr'],
      typeText: i18n.text.manager.fileTypeMSPR()
    }
  }
}

export default new ResourcePack()
