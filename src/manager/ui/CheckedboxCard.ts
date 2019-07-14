import Card from './Card'

export default class CheckedboxCard extends Card {
  checked: boolean
  constructor(options: MajsoulPlus_Manager.CardMetadata, checked = false) {
    super(options)
    this.checked = checked
  }

  protected createInputElements() {
    const input = document.createElement('input')
    const label = document.createElement('label')
    input.type = 'checkbox'
    input.id = this.getRandomId()
    input.addEventListener('change', event => {
      this.listener.emit('change', event)
    })
    Object.defineProperty(this, 'checked', {
      get: () => input.checked,
      set: value => {
        input.checked = value
      }
    })
    label.setAttribute('for', input.id)
    return {
      input,
      label
    }
  }
}
