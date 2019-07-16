import Card from './Card'

export default class CheckedboxCard extends Card {
  checked: boolean
  // TODO: 渲染加载顺序
  private sequence: number
  constructor(
    options: MajsoulPlus_Manager.CardMetadata,
    checked = false,
    sequence = 0
  ) {
    super(options)
    this.checked = checked
    this.sequence = sequence
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
