import { Card } from './Card'

export class CheckedboxCard extends Card {
  checked = false
  constructor(options: MajsoulPlus_Manager.CardConstructorOptions) {
    super(options)
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
