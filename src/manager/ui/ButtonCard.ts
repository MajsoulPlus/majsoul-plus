import Card from './Card'

export default class ButtonCard extends Card {
  protected createInputElements() {
    const input = document.createElement('input')
    const label = document.createElement('label')
    input.type = 'button'
    input.addEventListener('click', event => {
      this.listener.emit('click', event)
    })
    input.id = this.getRandomId()
    label.setAttribute('for', input.id)
    return {
      input,
      label
    }
  }
}
