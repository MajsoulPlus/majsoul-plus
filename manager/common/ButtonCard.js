const Card = require('./Card')

class ButtonCard extends Card {
  constructor(options){
    super(options)
  }

  _createInputElements(){
    const input = document.createElement('input')
    const label = document.createElement('label')
    input.type = 'button'
    input.addEventListener('click', evt => {
      this._listener.emit('click', evt)
    })
    input.id = this._getRandomId()
    label.setAttribute('for', input.id)
    return {
      input,
      label,
    }
  }
}

module.exports = ButtonCard