const Card = require('./Card')
class CheckboxCard extends Card {
  constructor (options) {
    super(options)
    this.checked = false
  }

  _createInputElements () {
    const input = document.createElement('input')
    const label = document.createElement('label')
    input.type = 'checkbox'
    input.id = this._getRandomId()
    input.addEventListener('change', evt => {
      this._listener.emit('change', evt)
    })
    Object.defineProperty(this, 'checked', {
      get: () => input.checked,
      set: value => { input.checked = value }
    })
    label.setAttribute('for', input.id)
    return {
      input,
      label
    }
  }
}

module.exports = CheckboxCard
