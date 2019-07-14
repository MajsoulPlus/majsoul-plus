import i18n from '../../i18n'
import CardList from '../ui/CardList'

class Extension extends CardList {
  protected getExportInfo() {
    return {
      extend: 'mspe',
      typeText: i18n.text.manager.fileTypeMSPE()
    }
  }

  protected handleCheckedChange = (key: string) => {
    // TODO
  }
}

export default new Extension()
