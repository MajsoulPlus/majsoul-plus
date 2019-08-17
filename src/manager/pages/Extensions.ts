import i18n from '../../i18n'
import CardList from '../ui/CardList'

class Extension extends CardList {
  protected getExportInfo() {
    return {
      extend: ['mspe', 'mspm'],
      typeText: i18n.text.manager.fileTypeMSPE()
    }
  }
}

export default new Extension()
